(() => {
  "use strict";

  const ITEM_DATA_URL = "./data/items.json";
  const DATA_DRAGON_VERSION = "16.15.1";
  const LANGUAGE_KEY = "riftle-language-v1";
  const PLAYERS_KEY = "riftle-random-players-v1";
  const BUILD_ROLE_KEY = "riftle-random-build-role-v1";
  const SPIN_SPEED_KEY = "riftle-random-spin-speed-v1";
  const DEFAULT_LANGUAGE = "en";
  const SUPPORTED_LANGUAGES = ["en", "ru"];
  const ROLE_COUNT = 5;
  const SPIN_SPEEDS = [0.5, 1, 2, 4];
  const DEFAULT_SPIN_SPEED = 1;

  const spinSettings = {
    0.5: { duration: 9200, selectedIndex: 72 },
    1: { duration: 5600, selectedIndex: 54 },
    2: { duration: 3000, selectedIndex: 36 },
    4: { duration: 1500, selectedIndex: 22 },
  };

  const roles = [
    { key: "top", en: "Top", ru: "Топ" },
    { key: "jungle", en: "Jungle", ru: "Лес" },
    { key: "middle", en: "Mid", ru: "Мид" },
    { key: "bottom", en: "Bot", ru: "Бот" },
    { key: "support", en: "Support", ru: "Саппорт" },
  ];

  const translations = {
    en: {
      htmlLang: "en",
      documentTitle: "Riftle Random",
      modes: {
        classic: "Classic",
        moreLess: "Item Duel",
        spellDuel: "Spell Duel",
        statDuel: "Stat Duel",
        random: "Random",
      },
      heroTitle: "Random Tools",
      rolesTitle: "Random roles",
      playerColumn: "Player",
      roleColumn: "Role",
      rollRoles: "Roll roles",
      playerPlaceholder: (index) => `Player ${index}`,
      buildTitle: "Random build",
      rollBuild: "Generate",
      buildRoleAria: "Build role",
      itemsTitle: "Items",
      summonersTitle: "Summoner spells",
      buyTitle: "What buy next?",
      spinBuy: "Spin",
      spinSpeedAria: "Spin speed",
      loading: "Loading items...",
      loadError: "Could not load items.",
      noRole: "—",
      gold: "gold",
      buyResult: "Buy next",
      roles: {
        top: "Top",
        jungle: "Jungle",
        middle: "Mid",
        bottom: "Bot",
        support: "Support",
      },
      spells: {
        flash: "Flash",
        teleport: "Teleport",
        ignite: "Ignite",
        ghost: "Ghost",
        smite: "Smite",
        heal: "Heal",
        exhaust: "Exhaust",
        barrier: "Barrier",
        cleanse: "Cleanse",
      },
    },
    ru: {
      htmlLang: "ru",
      documentTitle: "Riftle Рандом",
      modes: {
        classic: "Классика",
        moreLess: "Предметы",
        spellDuel: "Умения",
        statDuel: "Статы",
        random: "Рандом",
      },
      heroTitle: "Рандом для игры",
      rolesTitle: "Случайные роли",
      playerColumn: "Игрок",
      roleColumn: "Роль",
      rollRoles: "Раздать роли",
      playerPlaceholder: (index) => `Игрок ${index}`,
      buildTitle: "Случайный билд",
      rollBuild: "Собрать",
      buildRoleAria: "Роль для билда",
      itemsTitle: "Предметы",
      summonersTitle: "Саммонерки",
      buyTitle: "Что купить следующим?",
      spinBuy: "Крутить",
      spinSpeedAria: "Скорость прокрутки",
      loading: "Загружаю предметы...",
      loadError: "Не удалось загрузить предметы.",
      noRole: "—",
      gold: "золота",
      buyResult: "Покупай",
      roles: {
        top: "Топ",
        jungle: "Лес",
        middle: "Мид",
        bottom: "Бот",
        support: "Саппорт",
      },
      spells: {
        flash: "Скачок",
        teleport: "Телепорт",
        ignite: "Поджог",
        ghost: "Призрак",
        smite: "Кара",
        heal: "Исцеление",
        exhaust: "Изнурение",
        barrier: "Барьер",
        cleanse: "Очищение",
      },
    },
  };

  const statBaselines = {
    attackDamage: 50,
    abilityPower: 80,
    health: 400,
    mana: 500,
    armor: 40,
    magicResist: 40,
    attackSpeed: 25,
    critChance: 20,
    moveSpeed: 45,
    percentMoveSpeed: 5,
    abilityHaste: 20,
    lifeSteal: 10,
    omnivamp: 8,
    lethality: 18,
    armorPenetration: 20,
    percentArmorPenetration: 30,
    magicPenetration: 15,
    percentMagicPenetration: 30,
    healShieldPower: 10,
    baseHealthRegen: 100,
    baseManaRegen: 100,
    tenacity: 30,
  };

  const roleProfiles = {
    top: {
      minimum: 2.4,
      stats: {
        health: 2.2,
        armor: 1.5,
        magicResist: 1.5,
        attackDamage: 1.9,
        abilityPower: 0.8,
        abilityHaste: 1.4,
        attackSpeed: 0.9,
        lifeSteal: 0.8,
        omnivamp: 0.8,
        tenacity: 1.1,
        percentMoveSpeed: 0.8,
      },
      tags: {
        Health: 1.2,
        Armor: 0.9,
        SpellBlock: 0.9,
        Damage: 1,
        CooldownReduction: 0.8,
        AbilityHaste: 0.8,
        Tenacity: 0.8,
        LifeSteal: 0.7,
      },
      penalties: {
        baseManaRegen: 3,
        healShieldPower: 2.2,
      },
    },
    jungle: {
      minimum: 2.4,
      stats: {
        attackDamage: 1.7,
        abilityPower: 1.2,
        health: 1.3,
        armor: 0.9,
        magicResist: 0.8,
        abilityHaste: 1.4,
        attackSpeed: 1.1,
        lifeSteal: 0.9,
        omnivamp: 0.9,
        lethality: 1.1,
        percentMoveSpeed: 1,
        moveSpeed: 0.6,
      },
      tags: {
        Damage: 1,
        SpellDamage: 0.9,
        Health: 0.9,
        CooldownReduction: 0.8,
        AbilityHaste: 0.8,
        AttackSpeed: 0.6,
        NonbootsMovement: 0.7,
      },
      penalties: {
        baseManaRegen: 2.8,
        healShieldPower: 2,
      },
    },
    middle: {
      minimum: 2.5,
      stats: {
        abilityPower: 2.3,
        mana: 1.1,
        abilityHaste: 1.7,
        magicPenetration: 1.8,
        percentMagicPenetration: 1.6,
        attackDamage: 0.9,
        lethality: 1,
        percentMoveSpeed: 0.9,
        health: 0.4,
      },
      tags: {
        SpellDamage: 1.4,
        Mana: 0.8,
        CooldownReduction: 0.9,
        AbilityHaste: 0.9,
        MagicPenetration: 1.1,
        Damage: 0.5,
        NonbootsMovement: 0.5,
      },
      penalties: {
        armor: 0.6,
        magicResist: 0.3,
        baseManaRegen: 3,
        healShieldPower: 2.5,
        critChance: 1,
      },
    },
    bottom: {
      minimum: 2.8,
      stats: {
        attackDamage: 2.5,
        attackSpeed: 2.2,
        critChance: 2.2,
        lifeSteal: 1.6,
        armorPenetration: 1.4,
        percentArmorPenetration: 1.5,
        lethality: 0.8,
        percentMoveSpeed: 0.8,
        moveSpeed: 0.5,
      },
      tags: {
        Damage: 1.3,
        AttackSpeed: 1.2,
        CriticalStrike: 1.4,
        LifeSteal: 1,
        ArmorPenetration: 0.9,
        NonbootsMovement: 0.5,
      },
      penalties: {
        abilityPower: 2.2,
        baseManaRegen: 4,
        healShieldPower: 3.5,
        health: 0.4,
        armor: 0.6,
        magicResist: 0.6,
      },
    },
    support: {
      minimum: 2.1,
      stats: {
        healShieldPower: 2.6,
        baseManaRegen: 2.2,
        abilityHaste: 1.6,
        health: 1.1,
        armor: 0.8,
        magicResist: 0.8,
        abilityPower: 0.9,
        percentMoveSpeed: 1.2,
        moveSpeed: 0.5,
      },
      tags: {
        ManaRegen: 1.7,
        GoldPer: 1.6,
        SpellDamage: 0.7,
        Health: 0.7,
        CooldownReduction: 0.9,
        AbilityHaste: 0.9,
        NonbootsMovement: 0.7,
      },
      penalties: {
        attackDamage: 1.8,
        critChance: 2.8,
        lifeSteal: 2,
        lethality: 1.8,
      },
    },
  };

  const bootPreferences = {
    top: {
      "Plated Steelcaps": 6,
      "Mercury's Treads": 6,
      "Ionian Boots of Lucidity": 4,
      "Berserker's Greaves": 2,
      "Boots of Swiftness": 2,
    },
    jungle: {
      "Ionian Boots of Lucidity": 5,
      "Plated Steelcaps": 4,
      "Mercury's Treads": 4,
      "Berserker's Greaves": 3,
      "Sorcerer's Shoes": 3,
      "Boots of Swiftness": 2,
    },
    middle: {
      "Sorcerer's Shoes": 6,
      "Ionian Boots of Lucidity": 5,
      "Mercury's Treads": 2,
      "Boots of Swiftness": 2,
    },
    bottom: {
      "Berserker's Greaves": 7,
      "Plated Steelcaps": 2,
      "Mercury's Treads": 2,
      "Boots of Swiftness": 2,
    },
    support: {
      "Ionian Boots of Lucidity": 6,
      "Boots of Swiftness": 4,
      "Mercury's Treads": 2,
      "Plated Steelcaps": 2,
      "Sorcerer's Shoes": 2,
    },
  };

  const spellFileNames = {
    flash: "SummonerFlash.png",
    teleport: "SummonerTeleport.png",
    ignite: "SummonerDot.png",
    ghost: "SummonerHaste.png",
    smite: "SummonerSmite.png",
    heal: "SummonerHeal.png",
    exhaust: "SummonerExhaust.png",
    barrier: "SummonerBarrier.png",
    cleanse: "SummonerBoost.png",
  };

  const summonerProfiles = {
    top: { fixed: ["flash"], flex: ["teleport", "ignite", "ghost"] },
    jungle: { fixed: ["smite"], flex: ["flash", "ghost"] },
    middle: { fixed: ["flash"], flex: ["ignite", "teleport", "barrier", "cleanse"] },
    bottom: { fixed: ["flash"], flex: ["heal", "cleanse", "barrier", "ghost"] },
    support: { fixed: ["flash"], flex: ["ignite", "exhaust", "heal", "barrier"] },
  };

  const elements = {
    languageSwitch: document.querySelector("#language-switch"),
    roleTableBody: document.querySelector("#role-table-body"),
    rollRolesButton: document.querySelector("#roll-roles"),
    rolePicker: document.querySelector("#build-role-picker"),
    rollBuildButton: document.querySelector("#roll-build"),
    buildItems: document.querySelector("#build-items"),
    buildSummoners: document.querySelector("#build-summoners"),
    spinBuyButton: document.querySelector("#spin-buy"),
    buySpeedPicker: document.querySelector("#buy-speed-picker"),
    buyWheel: document.querySelector("#buy-wheel"),
    buyTrack: document.querySelector("#buy-wheel-track"),
    buyResult: document.querySelector("#buy-result"),
  };

  let language = readLanguage();
  let selectedBuildRole = readStorage(BUILD_ROLE_KEY, "bottom");
  let spinSpeed = readSpinSpeed();
  let allItems = [];
  let completedItems = [];
  let buyPool = [];
  let currentBuildItems = [];
  let currentSummoners = [];
  let currentBuyItem = null;
  let isSpinning = false;
  let roleRollTimer = 0;
  let buySpinTimer = 0;

  function t() {
    return translations[language] || translations[DEFAULT_LANGUAGE];
  }

  function readLanguage() {
    const stored = readStorage(LANGUAGE_KEY, DEFAULT_LANGUAGE);
    return SUPPORTED_LANGUAGES.includes(stored) ? stored : DEFAULT_LANGUAGE;
  }

  function readStorage(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch {
      return fallback;
    }
  }

  function readSpinSpeed() {
    const saved = Number(readStorage(SPIN_SPEED_KEY, String(DEFAULT_SPIN_SPEED)));
    return SPIN_SPEEDS.includes(saved) ? saved : DEFAULT_SPIN_SPEED;
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Local storage is optional for the page to keep working.
    }
  }

  function readPlayers() {
    try {
      const parsed = JSON.parse(localStorage.getItem(PLAYERS_KEY));
      if (Array.isArray(parsed)) {
        return parsed.slice(0, ROLE_COUNT).map((name) => String(name || ""));
      }
    } catch {
      return Array.from({ length: ROLE_COUNT }, () => "");
    }

    return Array.from({ length: ROLE_COUNT }, () => "");
  }

  function savePlayers() {
    const names = Array.from(elements.roleTableBody.querySelectorAll(".player-input")).map((input) => {
      return input.value.trim();
    });

    try {
      localStorage.setItem(PLAYERS_KEY, JSON.stringify(names));
    } catch {
      // Names are a convenience, not a dependency.
    }
  }

  function shuffle(list) {
    const result = [...list];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }

    return result;
  }

  function sample(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function roleLabel(roleKey) {
    return t().roles[roleKey] || roleKey;
  }

  function spellLabel(spellKey) {
    return t().spells[spellKey] || spellKey;
  }

  function spellIcon(spellKey) {
    return `https://ddragon.leagueoflegends.com/cdn/${DATA_DRAGON_VERSION}/img/spell/${spellFileNames[spellKey]}`;
  }

  function applyLanguage() {
    const copy = t();
    document.documentElement.lang = copy.htmlLang;
    document.title = copy.documentTitle;

    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.dataset.i18n;
      if (typeof copy[key] === "string") {
        node.textContent = copy[key];
      }
    });

    document.querySelectorAll("[data-mode-link]").forEach((link) => {
      const modeKey = link.dataset.modeLink;
      link.textContent = copy.modes[modeKey] || link.textContent;
    });

    if (elements.languageSwitch) {
      elements.languageSwitch.setAttribute("aria-label", language === "ru" ? "Язык" : "Language");
    }

    elements.buySpeedPicker.setAttribute("aria-label", copy.spinSpeedAria);

    document.querySelectorAll(".language-option").forEach((button) => {
      const isActive = button.dataset.language === language;
      button.classList.toggle("language-option-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    updatePlayerPlaceholders();
    updateRoleAssignments();
    renderRolePicker();
    renderSpinSpeedPicker();
    renderBuildOutput();
    renderBuyResult();
  }

  function setLanguage(nextLanguage) {
    if (!SUPPORTED_LANGUAGES.includes(nextLanguage)) {
      return;
    }

    language = nextLanguage;
    writeStorage(LANGUAGE_KEY, language);
    applyLanguage();
  }

  function renderRoleRows() {
    const storedNames = readPlayers();
    const rows = Array.from({ length: ROLE_COUNT }, (_, index) => {
      const row = document.createElement("tr");

      const playerCell = document.createElement("td");
      const input = document.createElement("input");
      input.className = "player-input";
      input.type = "text";
      input.autocomplete = "off";
      input.dataset.index = String(index);
      input.value = storedNames[index] || "";
      input.addEventListener("input", savePlayers);
      playerCell.append(input);

      const roleCell = document.createElement("td");
      const roleBadge = document.createElement("span");
      roleBadge.className = "role-badge";
      roleBadge.dataset.roleCell = String(index);
      roleBadge.textContent = t().noRole;
      roleCell.append(roleBadge);

      row.append(playerCell, roleCell);
      return row;
    });

    elements.roleTableBody.replaceChildren(...rows);
    updatePlayerPlaceholders();
  }

  function updatePlayerPlaceholders() {
    elements.roleTableBody.querySelectorAll(".player-input").forEach((input, index) => {
      input.placeholder = t().playerPlaceholder(index + 1);
      input.setAttribute("aria-label", t().playerPlaceholder(index + 1));
    });
  }

  function getRoleParticipants() {
    const filled = Array.from(elements.roleTableBody.querySelectorAll(".player-input"))
      .map((input, index) => ({
        index,
        name: input.value.trim(),
      }))
      .filter((player) => player.name);

    if (filled.length > 0) {
      return filled;
    }

    return Array.from({ length: ROLE_COUNT }, (_, index) => ({
      index,
      name: t().playerPlaceholder(index + 1),
    }));
  }

  function updateRoleAssignments() {
    elements.roleTableBody.querySelectorAll(".role-badge").forEach((cell) => {
      const roleKey = cell.dataset.roleKey;
      cell.textContent = roleKey ? roleLabel(roleKey) : t().noRole;
    });
  }

  function rollRoles() {
    window.clearTimeout(roleRollTimer);

    const participants = getRoleParticipants();
    const rolesForPlayers = shuffle(roles).slice(0, participants.length);
    const roleCells = elements.roleTableBody.querySelectorAll(".role-badge");
    const totalTicks = 34;

    elements.rollRolesButton.disabled = true;
    roleCells.forEach((cell) => {
      delete cell.dataset.roleKey;
      cell.textContent = t().noRole;
      cell.classList.remove("role-badge-filled", "role-badge-rolling");
    });

    let tick = 0;
    const step = () => {
      participants.forEach((participant, index) => {
        const cell = roleCells[participant.index];
        const rollingRole = roles[(tick + index) % roles.length];
        cell.textContent = roleLabel(rollingRole.key);
        cell.classList.add("role-badge-rolling");
      });

      tick += 1;
      if (tick >= totalTicks) {
        participants.forEach((participant, index) => {
          const cell = roleCells[participant.index];
          const finalRole = rolesForPlayers[index];
          cell.dataset.roleKey = finalRole.key;
          cell.textContent = roleLabel(finalRole.key);
          cell.classList.remove("role-badge-rolling");
          cell.classList.add("role-badge-filled");
        });
        elements.rollRolesButton.disabled = false;
        return;
      }

      const progress = tick / totalTicks;
      const delay = 34 + easeOutCubic(progress) * 142;
      roleRollTimer = window.setTimeout(step, delay);
    };

    step();
  }

  function easeOutCubic(progress) {
    return 1 - Math.pow(1 - progress, 3);
  }

  function renderRolePicker() {
    const buttons = roles.map((role) => {
      const button = document.createElement("button");
      button.className = "role-chip";
      button.classList.toggle("role-chip-active", role.key === selectedBuildRole);
      button.type = "button";
      button.dataset.buildRole = role.key;
      button.setAttribute("aria-pressed", String(role.key === selectedBuildRole));
      button.textContent = roleLabel(role.key);
      return button;
    });

    elements.rolePicker.setAttribute("aria-label", t().buildRoleAria);
    elements.rolePicker.replaceChildren(...buttons);
  }

  function normalizeItems(rawItems) {
    const byName = new Map();
    const normalized = rawItems
      .map((item) => ({
        id: String(item.id),
        name: String(item.name || ""),
        icon: String(item.icon || ""),
        gold: Number(item.gold || 0),
        tags: Array.isArray(item.tags) ? item.tags : [],
        plaintext: String(item.plaintext || ""),
        stats: item.stats && typeof item.stats === "object" ? item.stats : {},
      }))
      .filter((item) => item.name && item.icon && item.gold > 0 && Object.keys(item.stats).length > 0)
      .sort((left, right) => itemQualityScore(right) - itemQualityScore(left));

    normalized.forEach((item) => {
      if (!byName.has(item.name)) {
        byName.set(item.name, item);
      }
    });

    return Array.from(byName.values()).sort((left, right) => left.name.localeCompare(right.name));
  }

  function itemQualityScore(item) {
    const id = String(item.id);
    let score = item.gold / 100;
    if (id.length <= 4) {
      score += 80;
    }
    if (item.tags.includes("Boots")) {
      score += 20;
    }

    return score;
  }

  function isBoots(item) {
    return item.tags.includes("Boots");
  }

  function isCompletedItem(item) {
    const tags = new Set(item.tags);
    if (tags.has("Consumable") || tags.has("Trinket") || tags.has("Vision")) {
      return false;
    }

    if (item.name.includes("Enchantment:")) {
      return false;
    }

    if (isBoots(item)) {
      return item.gold >= 900;
    }

    return item.gold >= 2200;
  }

  function statValue(item, statKey) {
    return Number(item.stats[statKey] || 0);
  }

  function normalizedStat(item, statKey) {
    const value = statValue(item, statKey);
    if (!Number.isFinite(value) || value <= 0) {
      return 0;
    }

    return value / (statBaselines[statKey] || 1);
  }

  function itemScoreForRole(item, roleKey) {
    const profile = roleProfiles[roleKey] || roleProfiles.bottom;
    const tags = new Set(item.tags);
    let score = item.gold >= 2600 ? 0.8 : 0;

    Object.entries(profile.stats).forEach(([statKey, weight]) => {
      score += normalizedStat(item, statKey) * weight;
    });

    Object.entries(profile.tags).forEach(([tag, weight]) => {
      if (tags.has(tag)) {
        score += weight;
      }
    });

    Object.entries(profile.penalties).forEach(([statKey, weight]) => {
      score -= normalizedStat(item, statKey) * weight;
    });

    if (tags.has("Boots")) {
      score += bootPreferences[roleKey]?.[item.name] || 0;
    }

    return score;
  }

  function weightedSample(scoredItems, count) {
    const pool = scoredItems.map((entry) => ({ ...entry }));
    const picks = [];

    while (pool.length > 0 && picks.length < count) {
      const total = pool.reduce((sum, entry) => sum + Math.max(0.1, entry.score), 0);
      let ticket = Math.random() * total;
      let selectedIndex = 0;

      for (let index = 0; index < pool.length; index += 1) {
        ticket -= Math.max(0.1, pool[index].score);
        if (ticket <= 0) {
          selectedIndex = index;
          break;
        }
      }

      picks.push(pool[selectedIndex].item);
      pool.splice(selectedIndex, 1);
    }

    return picks;
  }

  function selectRoleBuild(roleKey) {
    const profile = roleProfiles[roleKey] || roleProfiles.bottom;
    const boots = completedItems
      .filter(isBoots)
      .map((item) => ({ item, score: itemScoreForRole(item, roleKey) }))
      .sort((left, right) => right.score - left.score);
    const boot = weightedSample(boots.slice(0, 7), 1)[0];
    const scoredCore = completedItems
      .filter((item) => !isBoots(item))
      .map((item) => ({ item, score: itemScoreForRole(item, roleKey) }))
      .filter((entry) => entry.score >= profile.minimum)
      .sort((left, right) => right.score - left.score);
    const sampleSize = Math.max(24, Math.ceil(scoredCore.length * 0.55));
    const picks = weightedSample(scoredCore.slice(0, sampleSize), 5);
    const fallback = completedItems
      .filter((item) => !isBoots(item) && !picks.includes(item))
      .map((item) => ({ item, score: itemScoreForRole(item, roleKey) }))
      .sort((left, right) => right.score - left.score);

    while (picks.length < 5 && fallback.length > 0) {
      picks.push(fallback.shift().item);
    }

    return boot ? [boot, ...picks] : picks;
  }

  function selectSummoners(roleKey) {
    const profile = summonerProfiles[roleKey] || summonerProfiles.bottom;
    const picks = [...profile.fixed];
    const flexPool = shuffle(profile.flex.filter((spellKey) => !picks.includes(spellKey)));

    while (picks.length < 2 && flexPool.length > 0) {
      picks.push(flexPool.shift());
    }

    return picks.slice(0, 2);
  }

  function generateBuild() {
    if (completedItems.length === 0) {
      return;
    }

    currentBuildItems = selectRoleBuild(selectedBuildRole);
    currentSummoners = selectSummoners(selectedBuildRole);
    renderBuildOutput();
  }

  function createIcon(src, label, className) {
    const icon = document.createElement("span");
    icon.className = className;

    const fallback = document.createElement("span");
    fallback.className = "icon-fallback";
    fallback.textContent = label.trim().charAt(0).toUpperCase();

    const image = document.createElement("img");
    image.src = src;
    image.alt = "";
    image.decoding = "async";
    image.addEventListener("load", () => icon.classList.add("icon-loaded"));
    image.addEventListener("error", () => icon.classList.add("icon-error"));

    icon.append(image, fallback);
    return icon;
  }

  function createLootCard(item, className = "loot-card") {
    const card = document.createElement("article");
    card.className = className;

    const iconClassName = className === "roulette-card" ? "roulette-icon" : "loot-icon";
    const icon = createIcon(item.icon, item.name, iconClassName);

    const name = document.createElement("strong");
    name.textContent = item.name;

    const price = document.createElement("span");
    price.textContent = `${item.gold} ${t().gold}`;

    card.append(icon, name, price);
    return card;
  }

  function createSummonerCard(spellKey) {
    const card = document.createElement("article");
    card.className = "summoner-card";

    const icon = createIcon(spellIcon(spellKey), spellLabel(spellKey), "summoner-icon");

    const name = document.createElement("strong");
    name.textContent = spellLabel(spellKey);

    card.append(icon, name);
    return card;
  }

  function renderBuildOutput() {
    if (!elements.buildItems || !elements.buildSummoners) {
      return;
    }

    if (completedItems.length === 0) {
      elements.buildItems.innerHTML = `<p class="random-status">${t().loading}</p>`;
      elements.buildSummoners.innerHTML = "";
      return;
    }

    elements.buildItems.replaceChildren(...currentBuildItems.map((item) => createLootCard(item)));
    elements.buildSummoners.replaceChildren(...currentSummoners.map((spellKey) => createSummonerCard(spellKey)));
  }

  function renderInitialWheel() {
    if (buyPool.length === 0) {
      elements.buyTrack.innerHTML = "";
      return;
    }

    const previewItems = Array.from({ length: 12 }, () => sample(buyPool));
    elements.buyTrack.style.transition = "none";
    elements.buyTrack.style.transform = "translateX(0)";
    elements.buyTrack.replaceChildren(...previewItems.map((item) => createLootCard(item, "roulette-card")));
  }

  function renderSpinSpeedPicker() {
    elements.buySpeedPicker.querySelectorAll("[data-spin-speed]").forEach((button) => {
      const buttonSpeed = Number(button.dataset.spinSpeed);
      const isActive = buttonSpeed === spinSpeed;
      button.classList.toggle("speed-chip-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
      button.textContent = String(buttonSpeed);
    });
  }

  function setSpinSpeed(nextSpeed) {
    if (!SPIN_SPEEDS.includes(nextSpeed)) {
      return;
    }

    spinSpeed = nextSpeed;
    writeStorage(SPIN_SPEED_KEY, String(spinSpeed));
    renderSpinSpeedPicker();
  }

  function spinBuy() {
    if (isSpinning || buyPool.length === 0) {
      return;
    }

    window.clearTimeout(buySpinTimer);
    isSpinning = true;
    currentBuyItem = null;
    elements.spinBuyButton.disabled = true;
    renderBuyResult();

    const selectedItem = sample(buyPool);
    const settings = spinSettings[spinSpeed] || spinSettings[DEFAULT_SPIN_SPEED];
    const selectedIndex = settings.selectedIndex;
    const stripItems = [
      ...Array.from({ length: selectedIndex }, () => sample(buyPool)),
      selectedItem,
      ...Array.from({ length: 8 }, () => sample(buyPool)),
    ];

    elements.buyTrack.style.transition = "none";
    elements.buyTrack.style.transform = "translateX(0)";
    elements.buyTrack.replaceChildren(...stripItems.map((item) => createLootCard(item, "roulette-card")));

    const selectedCard = elements.buyTrack.children[selectedIndex];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => {
      const offset = selectedCard.offsetLeft + selectedCard.offsetWidth / 2 - elements.buyWheel.clientWidth / 2;
      elements.buyTrack.style.transition = reducedMotion
        ? "none"
        : `transform ${settings.duration}ms cubic-bezier(0.08, 0.78, 0.05, 1)`;
      elements.buyTrack.style.transform = `translateX(${-offset}px)`;

      buySpinTimer = window.setTimeout(
        () => {
          currentBuyItem = selectedItem;
          isSpinning = false;
          elements.spinBuyButton.disabled = false;
          renderBuyResult();
        },
        reducedMotion ? 40 : settings.duration + 120,
      );
    };

    requestAnimationFrame(() => requestAnimationFrame(finish));
  }

  function renderBuyResult() {
    if (!elements.buyResult) {
      return;
    }

    if (!currentBuyItem) {
      elements.buyResult.textContent = "";
      return;
    }

    const label = document.createElement("span");
    label.textContent = t().buyResult;

    const name = document.createElement("strong");
    name.textContent = currentBuyItem.name;

    elements.buyResult.replaceChildren(label, name);
  }

  function setItemsLoading(isLoading) {
    elements.rollBuildButton.disabled = isLoading;
    elements.spinBuyButton.disabled = isLoading;
    if (isLoading) {
      renderBuildOutput();
    }
  }

  async function loadItems() {
    setItemsLoading(true);

    try {
      const response = await fetch(ITEM_DATA_URL);
      if (!response.ok) {
        throw new Error(`Items request failed with ${response.status}`);
      }

      const data = await response.json();
      allItems = normalizeItems(data.items || []);
      completedItems = allItems.filter(isCompletedItem);
      buyPool = completedItems.filter((item) => !item.tags.includes("Consumable"));
      generateBuild();
      renderInitialWheel();
    } catch (error) {
      elements.buildItems.innerHTML = `<p class="random-status random-status-error">${t().loadError}</p>`;
      elements.buyResult.textContent = t().loadError;
      // eslint-disable-next-line no-console
      console.error(error);
    } finally {
      setItemsLoading(false);
    }
  }

  function bindEvents() {
    document.querySelectorAll(".language-option").forEach((button) => {
      button.addEventListener("click", () => setLanguage(button.dataset.language));
    });

    elements.rollRolesButton.addEventListener("click", rollRoles);
    elements.rolePicker.addEventListener("click", (event) => {
      const button = event.target.closest("[data-build-role]");
      if (!button) {
        return;
      }

      selectedBuildRole = button.dataset.buildRole;
      writeStorage(BUILD_ROLE_KEY, selectedBuildRole);
      renderRolePicker();
      generateBuild();
    });

    elements.rollBuildButton.addEventListener("click", generateBuild);
    elements.buySpeedPicker.addEventListener("click", (event) => {
      const button = event.target.closest("[data-spin-speed]");
      if (!button || isSpinning) {
        return;
      }

      setSpinSpeed(Number(button.dataset.spinSpeed));
    });
    elements.spinBuyButton.addEventListener("click", spinBuy);
  }

  renderRoleRows();
  renderRolePicker();
  applyLanguage();
  bindEvents();
  loadItems();
})();
