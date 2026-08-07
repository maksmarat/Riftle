(() => {
  "use strict";

  const root = typeof window !== "undefined" ? window : globalThis;
  const RiftRun = root.RiftRun || {};
  const config = RiftRun.config || (typeof require === "function" ? require("./config.js") : null);

  const {
    RUN_CONFIG,
    SCORING_CONFIG,
    DIFFICULTY_CONFIG,
    CATEGORY_CONFIG,
    CHALLENGE_TYPES,
    MODIFIERS,
    METRICS,
    TRAIT_RULES,
  } = config;

  const metricById = new Map(METRICS.map((metric) => [metric.id, metric]));
  const percentMetrics = new Set(["item.attackSpeed", "ability.abilitySlow"]);
  const preciseMetrics = new Set(["champion.attackSpeedLevel1", "champion.attackSpeedLevel18"]);

  function clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "");
  }

  function toArray(value) {
    if (Array.isArray(value)) {
      return value.filter((item) => item !== null && item !== undefined && item !== "");
    }

    if (value === null || value === undefined || value === "") {
      return [];
    }

    return [value];
  }

  function localize(value, language = "en") {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value[language] || value.en || Object.values(value)[0] || "";
    }

    return String(value || "");
  }

  function formatNumber(value, metric = {}) {
    const number = Number(value);
    const digits = preciseMetrics.has(metric.id) ? 3 : 1;
    const formatted = Number.isInteger(number)
      ? String(number)
      : number.toFixed(digits).replace(/\.?0+$/, "");

    if (metric.unit === "s") {
      return `${formatted}s`;
    }

    if (metric.unit === "gold") {
      return `${formatted} gold`;
    }

    return metric.unit === "%" || percentMetrics.has(metric.id) ? `${formatted}%` : formatted;
  }

  function createHash(value) {
    let hash = 1779033703 ^ String(value).length;

    for (let index = 0; index < String(value).length; index += 1) {
      hash = Math.imul(hash ^ String(value).charCodeAt(index), 3432918353);
      hash = (hash << 13) | (hash >>> 19);
    }

    return () => {
      hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
      hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
      return (hash ^= hash >>> 16) >>> 0;
    };
  }

  function createRng(seed) {
    const seedHash = createHash(seed);
    let state = seedHash();

    const next = () => {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };

    const int = (max) => Math.floor(next() * max);

    const pick = (values) => {
      if (!values.length) {
        return null;
      }

      return values[int(values.length)];
    };

    const shuffle = (values) => {
      const copy = [...values];

      for (let index = copy.length - 1; index > 0; index -= 1) {
        const swapIndex = int(index + 1);
        [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
      }

      return copy;
    };

    const weighted = (items) => {
      const viable = items.filter((item) => Number(item.weight) > 0);
      const total = viable.reduce((sum, item) => sum + item.weight, 0);
      let roll = next() * total;

      for (const item of viable) {
        roll -= item.weight;
        if (roll <= 0) {
          return item.value;
        }
      }

      return viable[viable.length - 1]?.value || null;
    };

    return { next, int, pick, shuffle, weighted };
  }

  function randomSeed() {
    if (root.crypto?.getRandomValues) {
      const values = root.crypto.getRandomValues(new Uint32Array(2));
      return `rr-${values[0].toString(36)}${values[1].toString(36)}`;
    }

    return `rr-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
  }

  function createRun(seed = randomSeed()) {
    const now = Date.now();

    return {
      version: RUN_CONFIG.version,
      id: `${seed}-${now.toString(36)}`,
      seed,
      nonce: 1,
      phase: "challenge",
      stage: 1,
      score: 0,
      bankedScore: 0,
      multiplier: SCORING_CONFIG.multiplierStart,
      combo: 0,
      longestCombo: 0,
      stability: RUN_CONFIG.startingStability,
      answered: 0,
      correct: 0,
      partial: 0,
      mistakes: 0,
      startedAt: now,
      endedAt: null,
      finishReason: "",
      currentChallenge: null,
      options: [],
      lastOutcome: null,
      pendingCashOut: false,
      history: {
        entityIds: [],
        typeIds: [],
        metricIds: [],
        categoryIds: [],
      },
      facts: {
        categoryCorrect: {},
        categoryAttempts: {},
        hardestCleared: null,
        bestReward: 0,
      },
    };
  }

  function getRunRng(run, purpose = "stage") {
    return createRng(`${run.seed}:${run.nonce}:${run.stage}:${purpose}`);
  }

  function bumpNonce(run) {
    return { ...run, nonce: Number(run.nonce || 1) + 1 };
  }

  function buildData(rawData) {
    const profileByName = new Map(
      (rawData.champions || []).map((champion) => [normalizeText(champion.name), champion]),
    );

    const champions = (rawData.championStats?.champions || [])
      .map((champion) => {
        const profile = profileByName.get(normalizeText(localize(champion.name)));
        const releaseYear = Number(profile?.releaseYear);
        const stats = normalizeStats(champion.stats);

        if (Number.isFinite(releaseYear)) {
          stats.releaseYear = releaseYear;
        }

        return {
          id: `champion:${champion.id}`,
          sourceId: String(champion.id),
          category: "champions",
          kind: "champion",
          name: champion.name,
          title: champion.title,
          image: champion.icon || profile?.icon || "",
          meta: localize(champion.title) || profile?.resource || "",
          stats,
          traits: {
            resource: profile?.resource || "",
            rangeType: toArray(profile?.rangeType),
            position: toArray(profile?.position),
            region: toArray(profile?.region),
            species: toArray(profile?.species),
          },
        };
      })
      .filter((champion) => champion.image);

    const items = (rawData.items?.items || [])
      .map((item) => ({
        id: `item:${item.id}`,
        sourceId: String(item.id),
        category: "items",
        kind: "item",
        name: item.name,
        title: item.plaintext || "",
        image: item.icon || "",
        meta: `${Number(item.gold || 0)} gold`,
        gold: Number(item.gold || 0),
        stats: normalizeStats(item.stats),
        traits: {
          tags: toArray(item.tags),
        },
      }))
      .filter((item) => item.image && item.gold > 0);

    const abilities = (rawData.abilities?.abilities || [])
      .map((ability) => ({
        id: `ability:${ability.id}`,
        sourceId: String(ability.id),
        category: "abilities",
        kind: "ability",
        name: ability.name,
        title: ability.championName,
        image: ability.icon || "",
        meta: `${localize(ability.championName)} • ${ability.slot}`,
        championName: ability.championName,
        championKey: normalizeText(localize(ability.championName)),
        slot: ability.slot,
        stats: normalizeStats(ability.stats),
        traits: {
          slot: ability.slot,
          champion: [normalizeText(localize(ability.championName))],
        },
      }))
      .filter((ability) => ability.image);

    const entitiesByCategory = { champions, items, abilities };
    const entityById = new Map([...champions, ...items, ...abilities].map((entity) => [entity.id, entity]));

    return {
      entitiesByCategory,
      entityById,
      metrics: METRICS,
      metricById,
    };
  }

  function normalizeStats(stats) {
    return Object.fromEntries(
      Object.entries(stats || {})
        .map(([key, value]) => [key, Number(value)])
        .filter(([, value]) => Number.isFinite(value)),
    );
  }

  function getMetricValue(entity, metric) {
    if (!entity || !metric) {
      return null;
    }

    const value = metric.key === "gold" ? entity.gold : entity.stats?.[metric.key];
    return Number.isFinite(Number(value)) ? Number(value) : null;
  }

  function metricIsValidValue(value, metric) {
    if (!Number.isFinite(Number(value))) {
      return false;
    }

    if (metric.valid === "positive") {
      return Number(value) > 0;
    }

    return true;
  }

  function entitiesForMetric(data, metric) {
    return (data.entitiesByCategory[metric.category] || []).filter((entity) => {
      return metricIsValidValue(getMetricValue(entity, metric), metric);
    });
  }

  function targetDifficulty(run, special = false) {
    const stage = Number(run.stage || 1);
    const wave = Math.sin(stage * 0.88) * DIFFICULTY_CONFIG.waveAmount;
    const breathingRoom = stage % DIFFICULTY_CONFIG.breathingRoomEvery === 0 ? -0.16 : 0;
    const specialBump = special ? DIFFICULTY_CONFIG.specialBump : 0;

    return clamp(
      DIFFICULTY_CONFIG.earlyTarget + stage * DIFFICULTY_CONFIG.stageSlope + wave + breathingRoom + specialBump,
      DIFFICULTY_CONFIG.min,
      DIFFICULTY_CONFIG.max,
    );
  }

  function modifierList(ids = []) {
    return ids.map((id) => MODIFIERS[id]).filter(Boolean);
  }

  function modifierDifficulty(ids = []) {
    return modifierList(ids).reduce((sum, modifier) => sum + Number(modifier.difficulty || 0), 0);
  }

  function modifierRisk(ids = []) {
    return modifierList(ids).reduce((sum, modifier) => sum + Number(modifier.risk || 0), 0);
  }

  function modifierReward(ids = []) {
    return modifierList(ids).reduce((sum, modifier) => sum + Number(modifier.reward || 0), 0);
  }

  function hasModifier(challengeOrRoute, id) {
    return (challengeOrRoute.modifiers || []).includes(id);
  }

  function createEncounterOptions(run, data) {
    const rng = getRunRng(run, "options");
    const options = [];
    let attempts = 0;

    while (options.length < RUN_CONFIG.optionCount && attempts < 80) {
      attempts += 1;
      const special = shouldOfferSpecial(run) && options.length === 0;
      const route = createRoute(run, data, rng, { special });

      if (!route) {
        continue;
      }

      const challenge = generateChallenge(run, data, route, rng);

      if (!challenge || options.some((option) => option.signature === challenge.signature)) {
        continue;
      }

      options.push(challenge);
    }

    if (!options.length) {
      const route = { type: "higherLower", category: "items", metricId: "item.gold", modifiers: [], special: false };
      const fallback = generateChallenge(run, data, route, rng);

      if (fallback) {
        options.push(fallback);
      }
    }

    return options;
  }

  function shouldOfferSpecial(run) {
    return Number(run.stage || 1) >= 4 && Number(run.stage || 1) % RUN_CONFIG.specialEvery === 0;
  }

  function createRoute(run, data, rng, options = {}) {
    const special = Boolean(options.special);
    const target = targetDifficulty(run, special);
    const type = pickChallengeType(run, rng, special);

    if (!type) {
      return null;
    }

    const category = pickCategoryForType(data, type, run, rng);

    if (!category) {
      return null;
    }

    const modifiers = pickModifiers({ type, category, target, run, rng, special });
    const metricId = pickMetricId(data, { type, category, modifiers, target, run, rng });

    return {
      type,
      category,
      metricId,
      modifiers,
      special,
      risk: clamp(target * 0.4 + modifierRisk(modifiers), 0.05, 0.95),
    };
  }

  function pickChallengeType(run, rng, special) {
    const stage = Number(run.stage || 1);
    const recentTypes = new Set(run.history?.typeIds || []);
    const entries = Object.entries(CHALLENGE_TYPES)
      .filter(([, typeConfig]) => stage >= Number(typeConfig.minStage || 1))
      .filter(([, typeConfig]) => (special ? typeConfig.specialWeight : !typeConfig.specialOnly))
      .map(([id, typeConfig]) => {
        const base = special ? Number(typeConfig.specialWeight || 0) : Number(typeConfig.baseWeight || 0);
        const recentPenalty = recentTypes.has(id) ? 0.42 : 1;
        const pacingBonus = id === "higherLower" && stage <= 2 ? 2.2 : 1;

        return { value: id, weight: base * recentPenalty * pacingBonus };
      });

    return rng.weighted(entries);
  }

  function pickCategoryForType(data, type, run, rng) {
    const typeConfig = CHALLENGE_TYPES[type] || {};
    const allowed = typeConfig.categories || Object.keys(CATEGORY_CONFIG);
    const recentCategories = new Set(run.history?.categoryIds || []);
    const entries = allowed
      .filter((category) => (data.entitiesByCategory[category] || []).length >= 4)
      .map((category) => ({
        value: category,
        weight: (recentCategories.has(category) ? 0.62 : 1) * (category === "champions" ? 1.08 : 1),
      }));

    return rng.weighted(entries);
  }

  function pickMetricId(data, { type, category, modifiers, target, run, rng }) {
    if (["identify", "outlier", "match", "constraint"].includes(type)) {
      return "";
    }

    const recentMetrics = new Set(run.history?.metricIds || []);
    const metrics = METRICS.filter((metric) => metric.category === category)
      .filter((metric) => entitiesForMetric(data, metric).length >= 6)
      .filter((metric) => hasModifier({ modifiers }, "mixedLevels") || metric.group !== "mixedLevel" || target > 0.42)
      .map((metric) => {
        const obscureBonus = hasModifier({ modifiers }, "obscureMetric") ? 0.8 + metric.obscurity * 2.5 : 1;
        const recentPenalty = recentMetrics.has(metric.id) ? 0.38 : 1;
        const earlyPenalty = target < 0.35 && metric.obscurity > 0.24 ? 0.42 : 1;

        return { value: metric.id, weight: Math.max(0.05, obscureBonus * recentPenalty * earlyPenalty) };
      });

    return rng.weighted(metrics) || metrics[0]?.value || "";
  }

  function pickModifiers({ type, category, target, run, rng, special }) {
    if (Number(run.stage || 1) < 3) {
      return [];
    }

    const maxCount = special || target > 0.72 ? 2 : 1;
    const chance = clamp(0.15 + target * 0.55 + (special ? 0.22 : 0), 0, 0.84);
    const selected = [];

    for (let index = 0; index < maxCount; index += 1) {
      if (rng.next() > chance - index * 0.22) {
        continue;
      }

      const choices = Object.entries(MODIFIERS)
        .filter(([id, modifier]) => !selected.includes(id) && (!modifier.types || modifier.types.includes(type)))
        .filter(([, modifier]) => !modifier.categories || modifier.categories.includes(category))
        .map(([id, modifier]) => ({
          value: id,
          weight: 1 + Number(modifier.risk || 0) + (target > 0.62 ? Number(modifier.difficulty || 0) : 0),
        }));
      const next = rng.weighted(choices);

      if (next) {
        selected.push(next);
      }
    }

    return selected;
  }

  function generateChallenge(run, data, route, rng = getRunRng(run, "challenge")) {
    const generators = {
      higherLower: generateHigherLower,
      order: generateOrder,
      exact: generateExact,
      outlier: generateOutlier,
      match: generateMatch,
      identify: generateIdentify,
      constraint: generateConstraint,
      rapidFire: generateRapidFire,
    };
    const generator = generators[route.type];

    if (!generator) {
      return null;
    }

    const challenge = generator(run, data, route, rng);

    if (!challenge) {
      return null;
    }

    const adjustedDifficulty = clamp(
      challenge.difficulty + modifierDifficulty(route.modifiers),
      DIFFICULTY_CONFIG.min,
      DIFFICULTY_CONFIG.max,
    );
    const risk = clamp(route.risk + modifierRisk(route.modifiers) * 0.45, 0.05, 0.98);
    const reward = calculatePotentialReward(run, adjustedDifficulty, risk, route.special, route.modifiers);
    const typeConfig = CHALLENGE_TYPES[route.type];
    const categoryConfig = CATEGORY_CONFIG[route.category];

    return {
      ...challenge,
      id: `rr-${run.stage}-${route.type}-${Math.floor(rng.next() * 1e8).toString(36)}`,
      stage: run.stage,
      type: route.type,
      typeLabel: typeConfig.label,
      category: route.category,
      categoryLabel: categoryConfig.label,
      categoryShortLabel: categoryConfig.shortLabel,
      special: Boolean(route.special),
      modifiers: route.modifiers,
      difficulty: adjustedDifficulty,
      risk,
      reward,
      multiplierPreview: Number((1 + risk * SCORING_CONFIG.riskMultiplierScale).toFixed(2)),
      timeLimit: route.modifiers.map((id) => MODIFIERS[id]).find((modifier) => modifier?.timeLimit)?.timeLimit || 0,
      createdAt: Date.now(),
    };
  }

  function generateHigherLower(run, data, route, rng) {
    const metric = metricById.get(route.metricId) || metricById.get(pickMetricId(data, { ...route, run, rng }));
    const pool = metric ? entitiesForMetric(data, metric) : [];

    if (pool.length < 2) {
      return null;
    }

    const target = targetDifficulty(run, route.special) + (hasModifier(route, "narrowGap") ? 0.18 : 0);
    let best = null;

    for (let attempt = 0; attempt < 130; attempt += 1) {
      const left = rng.pick(pool);
      const right = rng.pick(pool);

      if (!left || !right || left.id === right.id) {
        continue;
      }

      const leftValue = getMetricValue(left, metric);
      const rightValue = getMetricValue(right, metric);

      if (leftValue === rightValue) {
        continue;
      }

      const difficulty = compareDifficulty(leftValue, rightValue, metric);
      const historyPenalty = entityRecentPenalty(run, [left.id, right.id]);
      const score = Math.abs(difficulty - target) + historyPenalty;

      if (!best || score < best.score) {
        best = { left, right, leftValue, rightValue, difficulty, score };
      }
    }

    if (!best) {
      return null;
    }

    const correctAnswer = best.rightValue > best.leftValue ? "higher" : "lower";
    const verb = correctAnswer === "higher" ? "higher" : "lower";

    return {
      title: `${CATEGORY_CONFIG[route.category].shortLabel} ${metric.shortLabel}`,
      prompt: `Will ${displayName(best.right)} be higher or lower than ${displayName(best.left)} for ${metric.label}?`,
      metric,
      entities: [viewEntity(best.left), viewEntity(best.right)],
      values: {
        left: best.leftValue,
        right: best.rightValue,
      },
      choices: [
        { id: "higher", label: "Higher" },
        { id: "lower", label: "Lower" },
      ],
      correctAnswer,
      explanation: `${displayName(best.right)} is ${formatNumber(best.rightValue, metric)}, ${verb} than ${displayName(best.left)} at ${formatNumber(best.leftValue, metric)}.`,
      difficulty: best.difficulty,
      signature: `higherLower:${metric.id}:${best.left.id}:${best.right.id}`,
    };
  }

  function generateOrder(run, data, route, rng) {
    const metric = metricById.get(route.metricId) || metricById.get(pickMetricId(data, { ...route, run, rng }));
    const pool = metric ? entitiesForMetric(data, metric) : [];
    const count = route.special ? 6 : targetDifficulty(run, route.special) > 0.6 ? 5 : 4;

    if (pool.length < count) {
      return null;
    }

    const target = targetDifficulty(run, route.special);
    let best = null;

    for (let attempt = 0; attempt < 120; attempt += 1) {
      const entries = uniqueBy(rng.shuffle(pool), (entity) => getMetricValue(entity, metric)).slice(0, count);

      if (entries.length < count) {
        continue;
      }

      const values = entries.map((entity) => getMetricValue(entity, metric));
      const difficulty = orderDifficulty(values, count, metric);
      const score = Math.abs(difficulty - target) + entityRecentPenalty(run, entries.map((entity) => entity.id));

      if (!best || score < best.score) {
        best = { entries, values, difficulty, score };
      }
    }

    if (!best) {
      return null;
    }

    const descending = hasModifier(route, "reverse");
    const sorted = [...best.entries].sort((left, right) => {
      const diff = getMetricValue(left, metric) - getMetricValue(right, metric);
      return descending ? -diff : diff;
    });
    const direction = descending ? "highest to lowest" : "lowest to highest";

    return {
      title: `${CATEGORY_CONFIG[route.category].shortLabel} Order`,
      prompt: `Order by ${metric.label}, ${direction}.`,
      metric,
      entities: best.entries.map(viewEntity),
      correctAnswer: sorted.map((entity) => entity.id),
      explanation: sorted
        .map((entity) => `${displayName(entity)} ${formatNumber(getMetricValue(entity, metric), metric)}`)
        .join(" → "),
      difficulty: best.difficulty,
      signature: `order:${metric.id}:${sorted.map((entity) => entity.id).join(":")}`,
    };
  }

  function generateExact(run, data, route, rng) {
    const metric = metricById.get(route.metricId) || metricById.get(pickMetricId(data, { ...route, run, rng }));
    const pool = metric ? entitiesForMetric(data, metric) : [];

    if (!pool.length) {
      return null;
    }

    const target = targetDifficulty(run, route.special);
    const entity = pickEntityWithHistory(run, pool, rng);
    const value = getMetricValue(entity, metric);
    const toleranceRatio = hasModifier(route, "precision")
      ? DIFFICULTY_CONFIG.exactToleranceHard
      : DIFFICULTY_CONFIG.exactToleranceEasy -
        (DIFFICULTY_CONFIG.exactToleranceEasy - DIFFICULTY_CONFIG.exactToleranceHard) * target;
    const tolerance = Math.max(metric.unit === "s" ? 1 : 3, Math.abs(value) * toleranceRatio);
    const difficulty = clamp(0.2 + target * 0.42 + metric.obscurity * 0.55);

    return {
      title: `${CATEGORY_CONFIG[route.category].shortLabel} Estimate`,
      prompt: `Estimate ${metric.label} for ${displayName(entity)}.`,
      metric,
      entities: [viewEntity(entity)],
      correctAnswer: value,
      tolerance,
      explanation: `${displayName(entity)} has ${metric.label} of ${formatNumber(value, metric)}.`,
      difficulty,
      signature: `exact:${metric.id}:${entity.id}`,
    };
  }

  function generateOutlier(run, data, route, rng) {
    const rule = pickTraitRule(data, route.category, rng);

    if (!rule) {
      return null;
    }

    const entities = data.entitiesByCategory[route.category] || [];
    const groups = groupByTrait(entities, rule);
    const viableGroups = [...groups.entries()].filter(([, group]) => group.length >= 3);
    const [traitValue, samePool] = rng.pick(viableGroups) || [];

    if (!traitValue || !samePool) {
      return null;
    }

    const same = rng.shuffle(samePool).slice(0, 3);
    const differentPool = entities.filter((entity) => !entityHasTrait(entity, rule.id, traitValue));

    if (differentPool.length < 3) {
      return null;
    }

    const reverse = hasModifier(route, "reverse");
    const choices = reverse
      ? rng.shuffle([rng.pick(samePool), ...rng.shuffle(differentPool).slice(0, 3)])
      : rng.shuffle([...same, rng.pick(differentPool)]);
    const correct = reverse
      ? choices.find((entity) => entityHasTrait(entity, rule.id, traitValue))
      : choices.find((entity) => !entityHasTrait(entity, rule.id, traitValue));

    if (!correct) {
      return null;
    }

    const prompt = reverse
      ? `Find the one that matches: ${rule.label} · ${traitValue}.`
      : `Find the outlier. Three share ${rule.label} · ${traitValue}.`;

    return {
      title: `${CATEGORY_CONFIG[route.category].shortLabel} Outlier`,
      prompt,
      traitRule: { id: rule.id, label: rule.label, value: traitValue, reverse },
      entities: choices.map(viewEntity),
      correctAnswer: correct.id,
      explanation: `${displayName(correct)} is the ${reverse ? "match" : "outlier"} for ${rule.label} · ${traitValue}.`,
      difficulty: clamp(0.28 + targetDifficulty(run, route.special) * 0.42 + (reverse ? 0.14 : 0)),
      signature: `outlier:${rule.id}:${traitValue}:${choices.map((entity) => entity.id).join(":")}`,
    };
  }

  function generateMatch(run, data, route, rng) {
    const abilities = rng
      .shuffle(data.entitiesByCategory.abilities || [])
      .filter((ability) => ability.championKey)
      .filter((ability, index, list) => list.findIndex((item) => item.championKey === ability.championKey) === index)
      .slice(0, route.special ? 4 : 3);

    if (abilities.length < 3) {
      return null;
    }

    const championsByKey = new Map(
      (data.entitiesByCategory.champions || []).map((champion) => [normalizeText(localize(champion.name)), champion]),
    );
    const champions = abilities.map((ability) => championsByKey.get(ability.championKey)).filter(Boolean);

    if (champions.length !== abilities.length) {
      return null;
    }

    const correctAnswer = Object.fromEntries(
      abilities.map((ability) => [ability.id, championsByKey.get(ability.championKey).id]),
    );

    return {
      title: "Ability Match",
      prompt: "Match each ability to its champion.",
      entities: abilities.map(viewEntity),
      choices: rng.shuffle(champions).map(viewEntity),
      correctAnswer,
      explanation: abilities
        .map((ability) => `${displayName(ability)} → ${localize(ability.championName)}`)
        .join(" · "),
      difficulty: clamp(0.36 + targetDifficulty(run, route.special) * 0.46 + (abilities.length - 3) * 0.1),
      signature: `match:${abilities.map((ability) => ability.id).join(":")}`,
    };
  }

  function generateIdentify(run, data, route, rng) {
    const pool = data.entitiesByCategory[route.category] || [];

    if (pool.length < 4) {
      return null;
    }

    const target = pickEntityWithHistory(run, pool, rng);
    const choices = createIdentifyChoices(data, route, target, rng);

    if (choices.length < 4) {
      return null;
    }

    return {
      title: `${CATEGORY_CONFIG[route.category].shortLabel} Identify`,
      prompt: `Identify this ${CATEGORY_CONFIG[route.category].shortLabel.toLowerCase()}.`,
      entities: [viewEntity(target)],
      choices: rng.shuffle(choices).map(viewEntity),
      correctAnswer: target.id,
      explanation: `That is ${displayName(target)}.`,
      difficulty: clamp(0.22 + targetDifficulty(run, route.special) * 0.4 + (hasModifier(route, "closeChoices") ? 0.16 : 0)),
      signature: `identify:${route.category}:${target.id}`,
    };
  }

  function generateConstraint(run, data, route, rng) {
    const champions = data.entitiesByCategory.champions || [];
    const target = pickEntityWithHistory(run, champions, rng);
    const conditionCount = clamp(Math.floor(2 + targetDifficulty(run, route.special) * 3), 2, 4);
    const conditions = createConditionsForChampion(target, data, rng, conditionCount + (hasModifier(route, "doubleCondition") ? 1 : 0));

    if (conditions.length < 2) {
      return null;
    }

    const validChampions = champions.filter((champion) => satisfiesConditions(champion, conditions));

    if (!validChampions.some((champion) => champion.id === target.id)) {
      return null;
    }

    const decoys = rng
      .shuffle(champions.filter((champion) => champion.id !== target.id && !satisfiesConditions(champion, conditions)))
      .slice(0, 3);

    if (decoys.length < 3) {
      return null;
    }

    const choices = rng.shuffle([target, ...decoys]);

    return {
      title: "Constraint Search",
      prompt: "Find a champion matching every condition.",
      entities: choices.map(viewEntity),
      conditions,
      correctAnswer: target.id,
      explanation: `${displayName(target)} satisfies: ${conditions.map((condition) => condition.text).join(", ")}.`,
      difficulty: clamp(0.36 + conditions.length * 0.1 + targetDifficulty(run, route.special) * 0.3),
      signature: `constraint:${target.id}:${conditions.map((condition) => condition.id).join(":")}`,
    };
  }

  function generateRapidFire(run, data, route, rng) {
    const metric = metricById.get(route.metricId) || metricById.get(pickMetricId(data, { ...route, run, rng }));
    const pool = metric ? entitiesForMetric(data, metric) : [];

    if (pool.length < 2) {
      return null;
    }

    const rounds = [];
    const usedPairs = new Set();

    while (rounds.length < RUN_CONFIG.rapidFireRounds && usedPairs.size < 120) {
      const left = rng.pick(pool);
      const right = rng.pick(pool);

      if (!left || !right || left.id === right.id) {
        continue;
      }

      const leftValue = getMetricValue(left, metric);
      const rightValue = getMetricValue(right, metric);

      if (leftValue === rightValue) {
        continue;
      }

      const signature = [left.id, right.id].sort().join(":");

      if (usedPairs.has(signature)) {
        continue;
      }

      usedPairs.add(signature);
      rounds.push({
        left: viewEntity(left),
        right: viewEntity(right),
        leftValue,
        rightValue,
        correctAnswer: rightValue > leftValue ? "higher" : "lower",
      });
    }

    if (rounds.length < RUN_CONFIG.rapidFireRounds) {
      return null;
    }

    return {
      title: `${CATEGORY_CONFIG[route.category].shortLabel} Rapid Fire`,
      prompt: `${RUN_CONFIG.rapidFireRounds} fast calls on ${metric.label}.`,
      metric,
      rounds,
      correctAnswer: rounds.map((round) => round.correctAnswer),
      explanation: rounds
        .map((round) => `${round.right.name}: ${formatNumber(round.rightValue, metric)}`)
        .join(" · "),
      difficulty: clamp(0.48 + targetDifficulty(run, true) * 0.34 + metric.obscurity * 0.24),
      signature: `rapid:${metric.id}:${rounds.map((round) => round.left.id + round.right.id).join(":")}`,
    };
  }

  function calculatePotentialReward(run, difficulty, risk, special, modifiers = []) {
    const base = SCORING_CONFIG.baseReward + (special ? SCORING_CONFIG.specialRewardBonus : 0);
    const difficultyScale = 1 + difficulty * SCORING_CONFIG.difficultyRewardScale;
    const riskScale = 1 + risk * SCORING_CONFIG.riskMultiplierScale + modifierReward(modifiers);

    return Math.round(base * difficultyScale * riskScale * Number(run.multiplier || 1));
  }

  function compareDifficulty(leftValue, rightValue, metric) {
    const gap = Math.abs(leftValue - rightValue);
    const relative = gap / Math.max(Math.abs(leftValue), Math.abs(rightValue), 1);
    const gapDifficulty = clamp(1 - relative / 0.42, 0.05, 0.94);

    return clamp(0.08 + gapDifficulty * 0.74 + Number(metric.obscurity || 0) * 0.28);
  }

  function orderDifficulty(values, count, metric) {
    const sorted = [...values].sort((left, right) => left - right);
    const gaps = sorted.slice(1).map((value, index) => {
      return Math.abs(value - sorted[index]) / Math.max(Math.abs(value), Math.abs(sorted[index]), 1);
    });
    const closest = gaps.length ? Math.min(...gaps) : 1;
    const closeDifficulty = clamp(1 - closest / 0.32, 0.08, 0.94);

    return clamp(0.12 + closeDifficulty * 0.5 + (count - 4) * 0.12 + Number(metric.obscurity || 0) * 0.28);
  }

  function entityRecentPenalty(run, ids) {
    const recent = run.history?.entityIds || [];
    return ids.reduce((penalty, id) => {
      const index = recent.indexOf(id);
      return penalty + (index === -1 ? 0 : (recent.length - index) / recent.length) * 0.12;
    }, 0);
  }

  function pickEntityWithHistory(run, pool, rng) {
    const recent = new Set(run.history?.entityIds || []);
    const fresh = pool.filter((entity) => !recent.has(entity.id));
    return rng.pick(fresh.length ? fresh : pool);
  }

  function uniqueBy(values, getter) {
    const seen = new Set();
    const result = [];

    for (const value of values) {
      const key = getter(value);

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      result.push(value);
    }

    return result;
  }

  function viewEntity(entity) {
    return {
      id: entity.id,
      sourceId: entity.sourceId,
      category: entity.category,
      kind: entity.kind,
      name: localize(entity.name),
      title: localize(entity.title),
      image: entity.image,
      meta: entity.meta || "",
    };
  }

  function displayName(entity) {
    return entity?.name ? localize(entity.name) : "";
  }

  function createIdentifyChoices(data, route, target, rng) {
    const pool = data.entitiesByCategory[route.category] || [];
    let decoyPool = pool.filter((entity) => entity.id !== target.id);

    if (hasModifier(route, "closeChoices")) {
      if (route.category === "abilities") {
        const sameSlot = decoyPool.filter((entity) => entity.slot === target.slot);
        decoyPool = sameSlot.length >= 3 ? sameSlot : decoyPool;
      }

      if (route.category === "items") {
        const targetTags = new Set(target.traits.tags || []);
        const sameTags = decoyPool.filter((entity) => (entity.traits.tags || []).some((tag) => targetTags.has(tag)));
        decoyPool = sameTags.length >= 3 ? sameTags : decoyPool;
      }

      if (route.category === "champions") {
        const targetPositions = new Set(target.traits.position || []);
        const samePosition = decoyPool.filter((entity) => {
          return (entity.traits.position || []).some((position) => targetPositions.has(position));
        });
        decoyPool = samePosition.length >= 3 ? samePosition : decoyPool;
      }
    }

    return [target, ...rng.shuffle(decoyPool).slice(0, 3)];
  }

  function pickTraitRule(data, category, rng) {
    const rules = TRAIT_RULES.filter((rule) => rule.category === category);
    const viable = rules.filter((rule) => {
      const groups = groupByTrait(data.entitiesByCategory[category] || [], rule);
      return [...groups.values()].some((group) => group.length >= rule.minSame);
    });

    return rng.pick(viable);
  }

  function groupByTrait(entities, rule) {
    const groups = new Map();

    entities.forEach((entity) => {
      toArray(entity.traits?.[rule.id]).forEach((value) => {
        if (!value) {
          return;
        }

        if (!groups.has(value)) {
          groups.set(value, []);
        }

        groups.get(value).push(entity);
      });
    });

    return groups;
  }

  function entityHasTrait(entity, traitId, traitValue) {
    return toArray(entity.traits?.[traitId]).includes(traitValue);
  }

  function createConditionsForChampion(target, data, rng, desiredCount) {
    const conditions = [];
    const traitCandidates = [
      ["resource", target.traits.resource],
      ["rangeType", rng.pick(target.traits.rangeType || [])],
      ["position", rng.pick(target.traits.position || [])],
      ["region", rng.pick(target.traits.region || [])],
    ].filter(([, value]) => value);
    const traitLabels = {
      resource: "Resource",
      rangeType: "Range type",
      position: "Position",
      region: "Region",
    };

    rng.shuffle(traitCandidates).forEach(([key, value]) => {
      if (conditions.length >= desiredCount) {
        return;
      }

      conditions.push({
        id: `${key}:${value}`,
        type: "trait",
        key,
        value,
        text: `${traitLabels[key]} is ${value}`,
      });
    });

    const numericMetrics = METRICS.filter((metric) => metric.category === "champions")
      .filter((metric) => metric.group !== "mixedLevel")
      .filter((metric) => metricIsValidValue(getMetricValue(target, metric), metric));

    rng.shuffle(numericMetrics).forEach((metric) => {
      if (conditions.length >= desiredCount) {
        return;
      }

      const value = getMetricValue(target, metric);
      const allValues = entitiesForMetric(data, metric).map((entity) => getMetricValue(entity, metric));
      const min = Math.min(...allValues);
      const max = Math.max(...allValues);
      const span = Math.max(1, max - min);
      const direction = value > min + span * 0.55 ? ">" : "<";
      const offset = span * (0.12 + rng.next() * 0.12);
      const threshold = direction === ">" ? Math.floor(value - offset) : Math.ceil(value + offset);

      if (threshold <= min || threshold >= max) {
        return;
      }

      conditions.push({
        id: `${metric.id}:${direction}:${threshold}`,
        type: "numeric",
        metricId: metric.id,
        operator: direction,
        threshold,
        text: `${metric.shortLabel} ${direction} ${formatNumber(threshold, metric)}`,
      });
    });

    return conditions.slice(0, desiredCount);
  }

  function satisfiesConditions(entity, conditions) {
    return conditions.every((condition) => {
      if (condition.type === "trait") {
        return entityHasTrait(entity, condition.key, condition.value);
      }

      const metric = metricById.get(condition.metricId);
      const value = getMetricValue(entity, metric);

      if (!metricIsValidValue(value, metric)) {
        return false;
      }

      return condition.operator === ">" ? value > condition.threshold : value < condition.threshold;
    });
  }

  function evaluateAnswer(challenge, answer) {
    if (!challenge) {
      return { correct: false, partial: 0, label: "No challenge" };
    }

    if (challenge.type === "exact") {
      const value = Number(answer);
      const delta = Math.abs(value - Number(challenge.correctAnswer));
      const exact = delta <= challenge.tolerance;
      const partialWindow = challenge.tolerance * 2.6;
      const partial = exact ? 1 : clamp(1 - delta / partialWindow, 0, 0.82);

      return { correct: exact, partial, label: exact ? "Clean estimate" : partial > 0 ? "Partial estimate" : "Miss" };
    }

    if (challenge.type === "order") {
      const answerIds = Array.isArray(answer) ? answer : [];
      const correctIds = challenge.correctAnswer || [];
      const correctPositions = correctIds.filter((id, index) => answerIds[index] === id).length;
      const partial = correctPositions / correctIds.length;

      return {
        correct: partial === 1,
        partial: partial >= 0.5 ? partial : 0,
        label: partial === 1 ? "Perfect order" : partial >= 0.5 ? "Partial order" : "Wrong order",
      };
    }

    if (challenge.type === "match") {
      const answerMap = answer && typeof answer === "object" ? answer : {};
      const correctEntries = Object.entries(challenge.correctAnswer || {});
      const matches = correctEntries.filter(([abilityId, championId]) => answerMap[abilityId] === championId).length;
      const partial = matches / correctEntries.length;

      return {
        correct: partial === 1,
        partial: partial >= 0.5 ? partial : 0,
        label: partial === 1 ? "Clean match" : partial >= 0.5 ? "Partial match" : "Mismatch",
      };
    }

    if (challenge.type === "rapidFire") {
      const answers = Array.isArray(answer) ? answer : [];
      const correct = challenge.correctAnswer || [];
      const hits = correct.filter((value, index) => answers[index] === value).length;
      const partial = hits / correct.length;

      return {
        correct: partial === 1,
        partial: partial >= 0.6 ? partial : 0,
        label: `${hits}/${correct.length} calls`,
      };
    }

    const correct = answer === challenge.correctAnswer;
    return { correct, partial: correct ? 1 : 0, label: correct ? "Correct" : "Wrong" };
  }

  function resolveChallenge(run, challenge, answer, options = {}) {
    const evaluation = evaluateAnswer(challenge, answer);
    const timedOut = Boolean(options.timedOut);
    const correct = evaluation.correct && !timedOut;
    const partial = correct ? 1 : timedOut ? 0 : evaluation.partial;
    const cleanPartial = !correct && partial > 0;
    const oneShot = hasModifier(challenge, "oneShot");
    let nextRun = { ...run, facts: { ...run.facts }, history: cloneHistory(run.history) };
    let reward = 0;
    let scoreLoss = 0;
    let stabilityDelta = 0;
    let multiplierDelta = 0;

    nextRun.answered += 1;
    nextRun.facts.categoryAttempts = {
      ...nextRun.facts.categoryAttempts,
      [challenge.category]: Number(nextRun.facts.categoryAttempts?.[challenge.category] || 0) + 1,
    };

    if (correct) {
      reward = challenge.reward;
      multiplierDelta =
        SCORING_CONFIG.comboStep +
        challenge.difficulty * 0.08 +
        challenge.risk * SCORING_CONFIG.riskMultiplierScale;
      stabilityDelta = SCORING_CONFIG.correctStabilityGain;
      nextRun.correct += 1;
      nextRun.combo += 1;
      nextRun.longestCombo = Math.max(nextRun.longestCombo, nextRun.combo);
      nextRun.facts.categoryCorrect = {
        ...nextRun.facts.categoryCorrect,
        [challenge.category]: Number(nextRun.facts.categoryCorrect?.[challenge.category] || 0) + 1,
      };

      if (!nextRun.facts.hardestCleared || challenge.difficulty > nextRun.facts.hardestCleared.difficulty) {
        nextRun.facts.hardestCleared = {
          title: challenge.title,
          category: challenge.categoryLabel,
          difficulty: challenge.difficulty,
          stage: challenge.stage,
        };
      }
    } else if (cleanPartial) {
      reward = Math.round(challenge.reward * partial * 0.52);
      stabilityDelta = -SCORING_CONFIG.partialLoss;
      multiplierDelta = -0.1;
      nextRun.partial += 1;
      nextRun.combo = 0;
    } else {
      const unbanked = Math.max(0, nextRun.score - nextRun.bankedScore);
      scoreLoss = Math.round(unbanked * (1 - SCORING_CONFIG.wrongScoreKeep) * (oneShot ? 1.25 : 1));
      stabilityDelta = -(oneShot ? SCORING_CONFIG.oneShotLoss : SCORING_CONFIG.wrongStabilityLoss);
      multiplierDelta = -Math.max(0.24, Number(nextRun.multiplier || 1) * 0.28);
      nextRun.mistakes += 1;
      nextRun.combo = 0;
    }

    nextRun.score = Math.max(nextRun.bankedScore, nextRun.score + reward - scoreLoss);
    nextRun.multiplier = clamp(
      Number(nextRun.multiplier || 1) + multiplierDelta,
      SCORING_CONFIG.multiplierStart,
      SCORING_CONFIG.multiplierCap,
    );
    nextRun.stability = clamp(nextRun.stability + stabilityDelta, 0, RUN_CONFIG.startingStability);
    nextRun.facts.bestReward = Math.max(Number(nextRun.facts.bestReward || 0), reward);
    nextRun.lastOutcome = {
      correct,
      partial,
      timedOut,
      label: timedOut ? "Time lost" : evaluation.label,
      reward,
      scoreLoss,
      stabilityDelta,
      multiplier: Number(nextRun.multiplier.toFixed(2)),
      explanation: challenge.explanation,
      answer,
    };
    nextRun.history = updateHistory(nextRun.history, challenge);
    nextRun.currentChallenge = challenge;
    nextRun.options = [];

    if (nextRun.stability <= RUN_CONFIG.failStability) {
      nextRun = finishRun(nextRun, "Stability collapsed");
    } else {
      nextRun.phase = "feedback";
      nextRun.stage += 1;
      nextRun.pendingCashOut = (nextRun.stage - 1) % RUN_CONFIG.cashOutEvery === 0;
    }

    return { run: nextRun, outcome: nextRun.lastOutcome };
  }

  function advanceRun(run, data, action = "continue") {
    let nextRun = { ...run, facts: { ...run.facts }, history: cloneHistory(run.history) };

    if (nextRun.phase === "results") {
      return nextRun;
    }

    if (action === "cashOut") {
      return finishRun(bankRun(nextRun), "Cashed out");
    }

    if (nextRun.phase === "cashout") {
      nextRun.multiplier = clamp(
        Number(nextRun.multiplier || 1) + SCORING_CONFIG.continueBonus,
        SCORING_CONFIG.multiplierStart,
        SCORING_CONFIG.multiplierCap,
      );
      nextRun.pendingCashOut = false;
    }

    if (nextRun.pendingCashOut) {
      nextRun.phase = "cashout";
      return nextRun;
    }

    if (nextRun.stage <= RUN_CONFIG.firstChoiceStage) {
      const openingRoute = RUN_CONFIG.openingStages[nextRun.stage - 1];
      const route = openingRoute
        ? { ...openingRoute, modifiers: [], special: false, risk: 0.08 + nextRun.stage * 0.04 }
        : createRoute(nextRun, data, getRunRng(nextRun, "auto"), { special: false });
      const challenge = generateChallenge(nextRun, data, route, getRunRng(nextRun, "auto-challenge"));
      nextRun = bumpNonce(nextRun);
      nextRun.currentChallenge = challenge;
      nextRun.phase = "challenge";
      return nextRun;
    }

    nextRun.options = createEncounterOptions(nextRun, data);
    nextRun = bumpNonce(nextRun);
    nextRun.currentChallenge = null;
    nextRun.phase = "choice";
    return nextRun;
  }

  function selectOption(run, optionId) {
    const challenge = (run.options || []).find((option) => option.id === optionId) || run.options?.[0];

    if (!challenge) {
      return run;
    }

    return {
      ...run,
      phase: "challenge",
      currentChallenge: challenge,
      options: [],
      lastOutcome: null,
    };
  }

  function bankRun(run) {
    const bankedScore = Math.max(Number(run.bankedScore || 0), Math.round(Number(run.score || 0) * SCORING_CONFIG.cashOutBankShare));

    return { ...run, bankedScore };
  }

  function finishRun(run, reason = "Finished") {
    return {
      ...run,
      phase: "results",
      finishReason: reason,
      endedAt: Date.now(),
      currentChallenge: null,
      options: [],
      pendingCashOut: false,
    };
  }

  function cloneHistory(history = {}) {
    return {
      entityIds: [...(history.entityIds || [])],
      typeIds: [...(history.typeIds || [])],
      metricIds: [...(history.metricIds || [])],
      categoryIds: [...(history.categoryIds || [])],
    };
  }

  function updateHistory(history, challenge) {
    const next = cloneHistory(history);
    const entityIds = extractEntityIds(challenge);

    next.entityIds = trimRecent([...next.entityIds, ...entityIds], RUN_CONFIG.maxRecentEntities);
    next.typeIds = trimRecent([...next.typeIds, challenge.type], RUN_CONFIG.maxRecentTypes);
    next.metricIds = trimRecent(
      challenge.metric?.id ? [...next.metricIds, challenge.metric.id] : next.metricIds,
      RUN_CONFIG.maxRecentMetrics,
    );
    next.categoryIds = trimRecent([...next.categoryIds, challenge.category], RUN_CONFIG.maxRecentTypes);

    return next;
  }

  function trimRecent(values, max) {
    return values.slice(Math.max(0, values.length - max));
  }

  function extractEntityIds(challenge) {
    const ids = [];

    (challenge.entities || []).forEach((entity) => ids.push(entity.id));
    (challenge.choices || []).forEach((entity) => ids.push(entity.id));
    (challenge.rounds || []).forEach((round) => {
      ids.push(round.left.id, round.right.id);
    });

    return [...new Set(ids)];
  }

  function getCorrectAnswer(challenge) {
    if (!challenge) {
      return null;
    }

    if (challenge.type === "match") {
      return { ...challenge.correctAnswer };
    }

    if (Array.isArray(challenge.correctAnswer)) {
      return [...challenge.correctAnswer];
    }

    return challenge.correctAnswer;
  }

  function summarizeRun(run) {
    const attempts = Math.max(1, Number(run.answered || 0));
    const accuracy = Math.round((Number(run.correct || 0) / attempts) * 100);
    const categoryEntries = Object.entries(run.facts?.categoryAttempts || {});
    const bestCategory = categoryEntries
      .map(([category, attemptsCount]) => {
        const hits = Number(run.facts?.categoryCorrect?.[category] || 0);
        return { category, score: hits / Math.max(1, attemptsCount), attempts: attemptsCount };
      })
      .sort((left, right) => right.score - left.score || right.attempts - left.attempts)[0];

    return {
      score: Math.round(Number(run.score || 0)),
      depth: Math.max(0, Number(run.stage || 1) - 1),
      accuracy,
      longestCombo: Number(run.longestCombo || 0),
      bestCategory: bestCategory ? CATEGORY_CONFIG[bestCategory.category]?.label || bestCategory.category : "None",
      hardestCleared: run.facts?.hardestCleared,
      bestReward: Number(run.facts?.bestReward || 0),
      reason: run.finishReason || "Finished",
      durationMs: (run.endedAt || Date.now()) - Number(run.startedAt || Date.now()),
      seed: run.seed,
    };
  }

  function mergeRecords(records = {}, run) {
    const summary = summarizeRun(run);
    const previous = records || {};

    return {
      bestScore: Math.max(Number(previous.bestScore || 0), summary.score),
      deepestStage: Math.max(Number(previous.deepestStage || 0), summary.depth),
      longestCombo: Math.max(Number(previous.longestCombo || 0), summary.longestCombo),
      totalRuns: Number(previous.totalRuns || 0) + 1,
      bestCategory: summary.score >= Number(previous.bestScore || 0) ? summary.bestCategory : previous.bestCategory || "None",
      lastRun: summary,
    };
  }

  function validateChallenge(challenge) {
    const errors = [];

    if (!challenge) {
      return ["challenge missing"];
    }

    ["id", "type", "category", "prompt", "correctAnswer"].forEach((key) => {
      if (challenge[key] === undefined || challenge[key] === null || challenge[key] === "") {
        errors.push(`${key} missing`);
      }
    });

    if (!Number.isFinite(Number(challenge.difficulty))) {
      errors.push("difficulty is not finite");
    }

    if (!Number.isFinite(Number(challenge.reward))) {
      errors.push("reward is not finite");
    }

    extractEntityIds(challenge).forEach((id) => {
      if (!id) {
        errors.push("empty entity id");
      }
    });

    (challenge.entities || []).forEach((entity) => {
      if (!entity.image && !hasModifier(challenge, "noPortraits")) {
        errors.push(`empty image for ${entity.id}`);
      }
    });

    if (challenge.type === "higherLower") {
      const [left, right] = challenge.entities || [];
      if (!left || !right || left.id === right.id) {
        errors.push("higher/lower compares same or missing entity");
      }
      if (challenge.values?.left === challenge.values?.right) {
        errors.push("higher/lower equal values");
      }
    }

    if (challenge.type === "order" && new Set(challenge.correctAnswer || []).size !== (challenge.correctAnswer || []).length) {
      errors.push("order has duplicate correct ids");
    }

    return errors;
  }

  function simulateRun(rawData, options = {}) {
    const data = buildData(rawData);
    let run = createRun(options.seed || "simulation-seed");
    run = advanceRun(run, data);
    const errors = [];
    const maxStages = Number(options.stages || 180);

    for (let index = 0; index < maxStages && run.phase !== "results"; index += 1) {
      if (run.phase === "choice") {
        run = selectOption(run, run.options[0]?.id);
      }

      if (run.phase === "cashout") {
        run = advanceRun(run, data, "continue");
      }

      if (run.phase !== "challenge") {
        run = advanceRun(run, data);
        continue;
      }

      const challengeErrors = validateChallenge(run.currentChallenge);
      if (challengeErrors.length) {
        errors.push({ stage: run.stage, id: run.currentChallenge?.id, errors: challengeErrors });
        break;
      }

      const result = resolveChallenge(run, run.currentChallenge, getCorrectAnswer(run.currentChallenge));
      run = advanceRun(result.run, data);
    }

    return { run, errors, summary: summarizeRun(run) };
  }

  RiftRun.engine = {
    createRng,
    createRun,
    randomSeed,
    buildData,
    advanceRun,
    selectOption,
    resolveChallenge,
    evaluateAnswer,
    getCorrectAnswer,
    summarizeRun,
    mergeRecords,
    validateChallenge,
    simulateRun,
    formatNumber,
    localize,
    clamp,
  };

  root.RiftRun = RiftRun;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = RiftRun.engine;
  }
})();
