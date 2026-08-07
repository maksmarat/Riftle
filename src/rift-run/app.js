(() => {
  "use strict";

  const { config, engine } = window.RiftRun;
  const { DATA_URLS, STORAGE_KEYS } = config;

  const LANGUAGE_KEY = "riftle-language-v1";
  const DEFAULT_LANGUAGE = "en";
  const SUPPORTED_LANGUAGES = ["en", "ru"];
  const debugEnabled = new URLSearchParams(window.location.search).get("debug") === "rift-run";

  const copy = {
    en: {
      title: "Riftle Rift Run",
      modes: {
        classic: "Classic",
        moreLess: "Item Duel",
        spellDuel: "Spell Duel",
        statDuel: "Stat Duel",
        riftRun: "Rift Run",
        random: "Random",
      },
      start: "Start Run",
      resume: "Resume Run",
      newRun: "New Run",
      seedLabel: "Seed",
      seedPlaceholder: "Random seed",
      randomSeed: "Random seed",
      loading: "Loading Rift Run...",
      loadError: "Could not load Rift Run data.",
      introA: "Clear League knowledge encounters, choose risk, cash out before stability breaks.",
      introB: "No daily timers. No accounts. One clean run.",
      bestScore: "Best score",
      deepest: "Deepest",
      runs: "Runs",
      stage: "Stage",
      score: "Score",
      multiplier: "Multiplier",
      stability: "Stability",
      combo: "Combo",
      choosePath: "Choose the next encounter",
      potential: "Potential",
      difficulty: "Difficulty",
      risk: "Risk",
      special: "Special",
      correct: "Correct",
      partial: "Partial",
      wrong: "Wrong",
      timeLost: "Time lost",
      continue: "Continue",
      cashOut: "Cash out",
      pushDeeper: "Continue",
      runSummary: "Run Summary",
      accuracy: "Accuracy",
      bestCategory: "Best category",
      hardest: "Hardest cleared",
      longestCombo: "Longest combo",
      seed: "Seed",
      muted: "Muted",
      sound: "Sound",
      higher: "Higher",
      lower: "Lower",
      submit: "Lock in",
      reset: "Reset",
      estimatePlaceholder: "Value",
      cashoutTitle: "Cash Out Point",
      cashoutCopy: "Lock the run now, or continue with a stronger multiplier and less room for mistakes.",
      difficultyLabels: {
        calm: "Calm",
        medium: "Medium",
        hard: "Hard",
        brutal: "Brutal",
      },
      chooseChampion: "Choose champion",
      assignedChampion: "Champion",
      identifyChoice: "Answer",
    },
    ru: {
      title: "Riftle Rift Run",
      modes: {
        classic: "Классика",
        moreLess: "Предметы",
        spellDuel: "Умения",
        statDuel: "Статы",
        riftRun: "Rift Run",
        random: "Рандом",
      },
      start: "Начать забег",
      resume: "Продолжить забег",
      newRun: "Новый забег",
      seedLabel: "Сид",
      seedPlaceholder: "Случайный сид",
      randomSeed: "Случайный сид",
      loading: "Загружаю Rift Run...",
      loadError: "Не удалось загрузить данные Rift Run.",
      introA: "Проходи испытания на знание League, выбирай риск и забирай счёт до обвала стабильности.",
      introB: "Без ежедневных таймеров, аккаунтов и онлайна. Один чистый забег.",
      bestScore: "Лучший счёт",
      deepest: "Глубина",
      runs: "Забеги",
      stage: "Этап",
      score: "Счёт",
      multiplier: "Множитель",
      stability: "Стабильность",
      combo: "Комбо",
      choosePath: "Выбери следующее испытание",
      potential: "Награда",
      difficulty: "Сложность",
      risk: "Риск",
      special: "Особое",
      correct: "Верно",
      partial: "Частично",
      wrong: "Ошибка",
      timeLost: "Время вышло",
      continue: "Продолжить",
      cashOut: "Забрать счёт",
      pushDeeper: "Продолжить забег",
      runSummary: "Итоги забега",
      accuracy: "Точность",
      bestCategory: "Лучшая категория",
      hardest: "Сложнейшее закрытое",
      longestCombo: "Лучшее комбо",
      seed: "Сид",
      muted: "Звук выкл.",
      sound: "Звук",
      higher: "Больше",
      lower: "Меньше",
      submit: "Ответить",
      reset: "Сброс",
      estimatePlaceholder: "Значение",
      cashoutTitle: "Точка выхода",
      cashoutCopy: "Можно закончить сейчас или продолжить с большим множителем и меньшим запасом на ошибки.",
      difficultyLabels: {
        calm: "Спокойно",
        medium: "Средне",
        hard: "Сложно",
        brutal: "Жёстко",
      },
      chooseChampion: "Выбери чемпиона",
      assignedChampion: "Чемпион",
      identifyChoice: "Ответ",
    },
  };

  const dom = {
    root: document.querySelector("#rift-run-root"),
    modes: document.querySelectorAll("[data-mode-link]"),
    languageButtons: document.querySelectorAll("[data-language]"),
  };

  let language = getLanguage();
  let data = null;
  let rawRecords = readJson(STORAGE_KEYS.records, {});
  let settings = readJson(STORAGE_KEYS.settings, { muted: false });
  let run = null;
  let timer = null;
  let timerDeadline = 0;
  let timerChallengeId = "";
  let orderSelection = [];
  let rapidAnswers = [];
  let matchAnswers = {};
  let activeMatchAbility = "";
  let interactionChallengeId = "";
  let audioContext = null;

  init();

  async function init() {
    applyChrome();
    renderLoading();

    try {
      const [champions, items, itemTranslations, abilities, championStats] = await Promise.all([
        fetchJson(DATA_URLS.champions),
        fetchJson(DATA_URLS.items),
        fetchJson(DATA_URLS.itemTranslations),
        fetchJson(DATA_URLS.abilities),
        fetchJson(DATA_URLS.championStats),
      ]);

      data = engine.buildData({ champions, items, itemTranslations, abilities, championStats });
      run = null;

      bindEvents();
      render();
    } catch (error) {
      console.error(error);
      dom.root.innerHTML = `<section class="rift-run-home"><p class="rift-run-error">${escapeHtml(t().loadError)}</p></section>`;
    }
  }

  function bindEvents() {
    dom.languageButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (!SUPPORTED_LANGUAGES.includes(button.dataset.language)) {
          return;
        }

        language = button.dataset.language;
        localStorage.setItem(LANGUAGE_KEY, language);
        applyChrome();
        render();
      });
    });

    document.addEventListener("keydown", handleKeydown);
  }

  function applyChrome() {
    document.documentElement.lang = language;
    document.title = t().title;

    dom.modes.forEach((link) => {
      const key = link.dataset.modeLink;
      link.textContent = t().modes[key] || link.textContent;
    });

    dom.languageButtons.forEach((button) => {
      const active = button.dataset.language === language;
      button.classList.toggle("language-option-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function renderLoading() {
    dom.root.innerHTML = `<section class="rift-run-home"><p class="rift-run-muted">${escapeHtml(t().loading)}</p></section>`;
  }

  function render() {
    clearTimer();

    if (!run) {
      renderHome();
      renderDebugPanel();
      return;
    }

    if (run.phase === "choice") {
      renderChoice();
      renderDebugPanel();
      return;
    }

    if (run.phase === "feedback") {
      renderFeedback();
      renderDebugPanel();
      return;
    }

    if (run.phase === "cashout") {
      renderCashOut();
      renderDebugPanel();
      return;
    }

    if (run.phase === "results") {
      renderResults();
      renderDebugPanel();
      return;
    }

    renderChallenge();
    renderDebugPanel();
  }

  function renderHome() {
    const activeRun = readJson(STORAGE_KEYS.activeRun, null);
    const canResume = activeRun && activeRun.phase !== "results";
    const records = rawRecords || {};
    const querySeed = new URLSearchParams(window.location.search).get("seed") || "";
    const seedValue = querySeed || settings.seed || "";

    dom.root.innerHTML = `
      <section class="rift-run-home">
        <div class="rift-run-kicker">Rift Run</div>
        <h1>Rift Run</h1>
        <p>${escapeHtml(t().introA)}</p>
        <p>${escapeHtml(t().introB)}</p>
        <form class="seed-start-form" id="seed-start-form">
          <label for="run-seed">${escapeHtml(t().seedLabel)}</label>
          <div class="seed-control-row">
            <input id="run-seed" autocomplete="off" spellcheck="false" placeholder="${escapeAttr(t().seedPlaceholder)}" value="${escapeAttr(seedValue)}">
            <button class="rift-run-secondary" type="button" data-action="random-seed">${escapeHtml(t().randomSeed)}</button>
            <button class="rift-run-primary" type="submit" data-action="start">${escapeHtml(t().start)}</button>
          </div>
        </form>
        <div class="rift-run-actions">
          ${
            canResume
              ? `<button class="rift-run-secondary" type="button" data-action="resume">${escapeHtml(t().resume)}</button>`
              : ""
          }
          ${renderMuteButton()}
        </div>
        <div class="rift-run-records">
          ${recordTile(t().bestScore, formatInteger(records.bestScore || 0))}
          ${recordTile(t().deepest, `${t().stage} ${formatInteger(records.deepestStage || 0)}`)}
          ${recordTile(t().runs, formatInteger(records.totalRuns || 0))}
        </div>
      </section>
    `;

    dom.root.querySelector("#seed-start-form").addEventListener("submit", startRun);
    dom.root.querySelector("[data-action='random-seed']").addEventListener("click", () => {
      const input = dom.root.querySelector("#run-seed");
      input.value = engine.randomSeed();
      input.focus();
    });
    dom.root.querySelector("[data-action='resume']")?.addEventListener("click", () => {
      run = activeRun;
      saveRun();
      render();
    });
    bindMuteButton();
  }

  function renderChoice() {
    dom.root.innerHTML = `
      ${renderHud()}
      <section class="rift-run-choice" aria-labelledby="rift-run-choice-title">
        <div class="section-title-row">
          <div>
            <p class="rift-run-kicker">${escapeHtml(t().stage)} ${run.stage}</p>
            <h1 id="rift-run-choice-title">${escapeHtml(t().choosePath)}</h1>
          </div>
          ${renderMuteButton()}
        </div>
        <div class="encounter-options">
          ${(run.options || []).map(renderOption).join("")}
        </div>
      </section>
    `;

    dom.root.querySelectorAll("[data-option-id]").forEach((button) => {
      button.addEventListener("click", () => {
        playTone("select");
        run = engine.selectOption(run, button.dataset.optionId);
        saveRun();
        render();
      });
    });
    bindMuteButton();
  }

  function renderOption(option, index) {
    return `
      <button class="encounter-card" type="button" data-option-id="${escapeAttr(option.id)}">
        <span class="encounter-index">${index + 1}</span>
        <span class="encounter-meta">${escapeHtml(l(option.categoryLabel))} · ${escapeHtml(l(option.typeLabel))}</span>
        <strong>${escapeHtml(l(option.title))}</strong>
        <span class="encounter-prompt">${escapeHtml(l(option.prompt))}</span>
        <span class="encounter-stats">
          <span>${escapeHtml(t().difficulty)} ${difficultyLabel(option.difficulty)}</span>
          <span>${escapeHtml(t().risk)} ${Math.round(option.risk * 100)}%</span>
          <span>${escapeHtml(t().potential)} ${formatInteger(option.reward)}</span>
        </span>
        ${option.special ? `<span class="encounter-special">${escapeHtml(t().special)}</span>` : ""}
        ${renderModifierList(option.modifierLabels || option.modifiers)}
      </button>
    `;
  }

  function renderChallenge() {
    const challenge = run.currentChallenge;

    if (!challenge) {
      run = engine.advanceRun(run, data);
      saveRun();
      render();
      return;
    }

    resetInteractionState(challenge);

    dom.root.innerHTML = `
      ${renderHud()}
      <section class="rift-run-board ${challenge.special ? "rift-run-board-special" : ""}" data-challenge-type="${escapeAttr(challenge.type)}">
        <div class="section-title-row">
          <div>
            <p class="rift-run-kicker">${escapeHtml(l(challenge.categoryLabel))} · ${escapeHtml(l(challenge.typeLabel))}</p>
            <h1>${escapeHtml(l(challenge.title))}</h1>
          </div>
          <div class="rift-run-board-tools">
            ${challenge.timeLimit ? `<div class="run-timer" id="run-timer">${challenge.timeLimit}s</div>` : ""}
            ${renderMuteButton()}
          </div>
        </div>
        <p class="challenge-prompt">${escapeHtml(l(challenge.prompt))}</p>
        ${renderModifierList(challenge.modifierLabels || challenge.modifiers)}
        <div class="challenge-body" id="challenge-body">${renderChallengeBody(challenge)}</div>
      </section>
    `;

    bindChallenge(challenge);
    bindMuteButton();
    startTimer(challenge);
  }

  function resetInteractionState(challenge) {
    if (interactionChallengeId === challenge.id) {
      return;
    }

    interactionChallengeId = challenge.id;

    if (challenge.type === "order") {
      orderSelection = [];
    }

    if (challenge.type === "rapidFire") {
      rapidAnswers = [];
    }

    if (challenge.type === "match") {
      matchAnswers = {};
      activeMatchAbility = challenge.entities?.[0]?.id || "";
    }
  }

  function renderChallengeBody(challenge) {
    if (challenge.type === "higherLower") {
      return renderHigherLower(challenge);
    }

    if (challenge.type === "order") {
      return renderOrder(challenge);
    }

    if (challenge.type === "exact") {
      return renderExact(challenge);
    }

    if (challenge.type === "identify") {
      return renderIdentify(challenge);
    }

    if (["outlier", "constraint", "pickExtreme"].includes(challenge.type)) {
      return renderChoiceGrid(challenge);
    }

    if (challenge.type === "match") {
      return renderMatch(challenge);
    }

    if (challenge.type === "rapidFire") {
      return renderRapidFire(challenge);
    }

    return "";
  }

  function renderHigherLower(challenge) {
    const [left, right] = challenge.entities;
    const noPortraits = challenge.modifiers.includes("noPortraits");

    return `
      <div class="run-versus run-versus-cards">
        ${entityCard(left, {
          noPortraits,
          value: engine.formatNumber(challenge.values.left, challenge.metric, language),
          label: l(challenge.metric.shortLabelText || challenge.metric.shortLabel),
          answer: "lower",
        })}
        ${entityCard(right, {
          noPortraits,
          value: "???",
          label: l(challenge.metric.shortLabelText || challenge.metric.shortLabel),
          hiddenValue: true,
          answer: "higher",
        })}
      </div>
    `;
  }

  function renderOrder(challenge) {
    const noNames = challenge.modifiers.includes("noNames");
    const noPortraits = challenge.modifiers.includes("noPortraits");

    return `
      <div class="order-grid">
        ${challenge.entities
          .map((entity) => {
            const rank = orderSelection.indexOf(entity.id);
            return entityCard(entity, {
              button: true,
              noNames,
              noPortraits,
              selected: rank !== -1,
              rank: rank === -1 ? "" : String(rank + 1),
            });
          })
          .join("")}
      </div>
      <div class="challenge-actions">
        <button class="rift-run-primary" type="button" data-submit-order ${orderSelection.length === challenge.entities.length ? "" : "disabled"}>${escapeHtml(t().submit)}</button>
        <button class="rift-run-secondary" type="button" data-reset-order>${escapeHtml(t().reset)}</button>
      </div>
    `;
  }

  function renderExact(challenge) {
    const [entity] = challenge.entities;

    return `
      <div class="exact-layout">
        ${entityCard(entity, { value: l(challenge.metric.shortLabelText || challenge.metric.shortLabel), label: l(challenge.categoryShortLabel) })}
        <form class="exact-form" id="exact-form">
          <input class="exact-input" id="exact-input" inputmode="decimal" autocomplete="off" placeholder="${escapeAttr(t().estimatePlaceholder)}">
          <button class="rift-run-primary" type="submit">${escapeHtml(t().submit)}</button>
        </form>
      </div>
    `;
  }

  function renderIdentify(challenge) {
    const [target] = challenge.entities || [];

    return `
      <div class="identify-layout">
        <div class="identify-clue">
          ${target ? entityCard(target, { noNames: true, noMeta: true, noPortraits: challenge.modifiers.includes("noPortraits") }) : ""}
        </div>
        ${renderAnswerChoices(challenge.choices || [], { label: t().identifyChoice })}
      </div>
    `;
  }

  function renderAnswerChoices(choices, options = {}) {
    return `
      <div class="answer-choice-grid">
        ${choices
          .map(
            (entity, index) => `
              <button class="answer-choice" type="button" data-entity-id="${escapeAttr(entity.id)}">
                <span class="answer-choice-index">${index + 1}</span>
                <span class="answer-choice-copy">
                  <strong>${escapeHtml(l(entity.name))}</strong>
                  <small>${escapeHtml(options.label || l(entity.meta || entity.title || ""))}</small>
                </span>
              </button>
            `,
          )
          .join("")}
      </div>
    `;
  }

  function renderChoiceGrid(challenge) {
    const noNames = challenge.modifiers.includes("noNames") && challenge.type !== "constraint";
    const noPortraits = challenge.modifiers.includes("noPortraits");

    return `
      ${challenge.conditions ? renderConditions(challenge.conditions) : ""}
      <div class="choice-grid">
        ${(challenge.choices || challenge.entities)
          .map((entity, index) =>
            entityCard(entity, {
              button: true,
              noNames,
              noPortraits,
              choiceIndex: index + 1,
            }),
          )
          .join("")}
      </div>
    `;
  }

  function renderConditions(conditions) {
    return `
      <div class="condition-list">
        ${conditions.map((condition) => `<span>${escapeHtml(l(condition.text))}</span>`).join("")}
      </div>
    `;
  }

  function renderMatch(challenge) {
    const usedChampionIds = new Set(Object.values(matchAnswers).filter(Boolean));

    return `
      <div class="match-layout">
        <div class="match-board" role="list">
          ${challenge.entities
            .map((ability) => {
              const assigned = challenge.choices.find((champion) => champion.id === matchAnswers[ability.id]);
              const active = activeMatchAbility === ability.id;

              return `
                <button class="match-row${active ? " match-row-active" : ""}${assigned ? " match-row-filled" : ""}" type="button" data-match-row="${escapeAttr(ability.id)}" role="listitem">
                  <span class="match-ability">
                    <img src="${escapeAttr(ability.image)}" alt="" loading="lazy">
                    <span>
                      <strong>${escapeHtml(challenge.modifiers.includes("noNames") ? "???" : l(ability.name))}</strong>
                      <small>${escapeHtml(l(ability.meta))}</small>
                    </span>
                  </span>
                  <span class="match-assignment">
                    <small>${escapeHtml(assigned ? t().assignedChampion : t().chooseChampion)}</small>
                    <strong>${escapeHtml(assigned ? l(assigned.name) : "—")}</strong>
                  </span>
                </button>
              `;
            })
            .join("")}
        </div>
        <div class="match-choice-grid">
          ${challenge.choices
            .map((champion) => {
              const selected = usedChampionIds.has(champion.id);

              return `
                <button class="match-choice${selected ? " match-choice-selected" : ""}" type="button" data-match-choice="${escapeAttr(champion.id)}">
                  <img src="${escapeAttr(champion.image)}" alt="" loading="lazy">
                  <span>${escapeHtml(l(champion.name))}</span>
                </button>
              `;
            })
            .join("")}
        </div>
      </div>
      <div class="challenge-actions">
        <button class="rift-run-primary" type="button" data-submit-match ${challenge.entities.every((ability) => matchAnswers[ability.id]) ? "" : "disabled"}>${escapeHtml(t().submit)}</button>
      </div>
    `;
  }

  function renderRapidFire(challenge) {
    const index = rapidAnswers.length;
    const round = challenge.rounds[index] || challenge.rounds[challenge.rounds.length - 1];

    return `
      <div class="rapid-progress">${index + 1} / ${challenge.rounds.length}</div>
      <div class="run-versus run-versus-cards run-versus-rapid">
        ${entityCard(round.left, {
          value: engine.formatNumber(round.leftValue, challenge.metric, language),
          label: l(challenge.metric.shortLabelText || challenge.metric.shortLabel),
          noPortraits: challenge.modifiers.includes("noPortraits"),
          rapidAnswer: "lower",
        })}
        ${entityCard(round.right, {
          value: "???",
          label: l(challenge.metric.shortLabelText || challenge.metric.shortLabel),
          hiddenValue: true,
          noPortraits: challenge.modifiers.includes("noPortraits"),
          rapidAnswer: "higher",
        })}
      </div>
    `;
  }

  function entityCard(entity, options = {}) {
    const interactive = options.button || options.answer || options.rapidAnswer;
    const tag = interactive ? "button" : "article";
    const selectedClass = options.selected ? " entity-card-selected" : "";
    const answerClass = options.answer || options.rapidAnswer ? " entity-card-answer" : "";
    const buttonAttrs = interactive
      ? ` type="button"${
          options.button ? ` data-entity-id="${escapeAttr(entity.id)}" aria-pressed="${String(Boolean(options.selected))}"` : ""
        }${options.answer ? ` data-answer="${escapeAttr(options.answer)}"` : ""}${options.rapidAnswer ? ` data-rapid-answer="${escapeAttr(options.rapidAnswer)}"` : ""}`
      : "";

    return `
      <${tag} class="entity-card${selectedClass}${answerClass}"${buttonAttrs}>
        ${options.choiceIndex ? `<span class="entity-index">${options.choiceIndex}</span>` : ""}
        ${options.rank ? `<span class="entity-rank">${escapeHtml(options.rank)}</span>` : ""}
        ${
          options.noPortraits
            ? `<div class="entity-no-image">${escapeHtml(entity.kind.slice(0, 1).toUpperCase())}</div>`
            : `<img src="${escapeAttr(entity.image)}" alt="" loading="lazy">`
        }
        <span class="entity-copy">
          <strong>${escapeHtml(options.noNames ? "???" : l(entity.name))}</strong>
          ${options.noMeta ? "" : `<small>${escapeHtml(l(entity.meta || entity.title || ""))}</small>`}
        </span>
        ${
          options.value
            ? `<span class="entity-value ${options.hiddenValue ? "entity-value-hidden" : ""}">
                <small>${escapeHtml(options.label || "")}</small>
                <b>${escapeHtml(options.value)}</b>
              </span>`
            : ""
        }
      </${tag}>
    `;
  }

  function bindChallenge(challenge) {
    dom.root.querySelectorAll("[data-answer]").forEach((button) => {
      button.addEventListener("click", () => submitAnswer(button.dataset.answer));
    });

    dom.root.querySelector("#exact-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      submitAnswer(dom.root.querySelector("#exact-input").value);
    });

    dom.root.querySelectorAll("[data-entity-id]").forEach((button) => {
      button.addEventListener("click", () => {
        if (challenge.type === "order") {
          toggleOrder(button.dataset.entityId);
          return;
        }

        submitAnswer(button.dataset.entityId);
      });
    });

    dom.root.querySelector("[data-submit-order]")?.addEventListener("click", () => submitAnswer([...orderSelection]));
    dom.root.querySelector("[data-reset-order]")?.addEventListener("click", () => {
      orderSelection = [];
      renderChallenge();
    });

    dom.root.querySelectorAll("[data-match-row]").forEach((button) => {
      button.addEventListener("click", () => {
        activeMatchAbility = button.dataset.matchRow;
        renderChallenge();
      });
    });
    dom.root.querySelectorAll("[data-match-choice]").forEach((button) => {
      button.addEventListener("click", () => assignMatchChampion(challenge, button.dataset.matchChoice));
    });
    dom.root.querySelector("[data-submit-match]")?.addEventListener("click", () => submitAnswer({ ...matchAnswers }));

    dom.root.querySelectorAll("[data-rapid-answer]").forEach((button) => {
      button.addEventListener("click", () => {
        rapidAnswers.push(button.dataset.rapidAnswer);
        playTone("select");

        if (rapidAnswers.length >= challenge.rounds.length) {
          submitAnswer([...rapidAnswers]);
          return;
        }

        renderChallenge();
      });
    });

    dom.root.querySelector("#exact-input")?.focus();
  }

  function toggleOrder(entityId) {
    const existing = orderSelection.indexOf(entityId);

    if (existing === -1) {
      orderSelection.push(entityId);
    } else {
      orderSelection.splice(existing, 1);
    }

    renderChallenge();
  }

  function assignMatchChampion(challenge, championId) {
    const abilityId = activeMatchAbility || challenge.entities.find((ability) => !matchAnswers[ability.id])?.id;

    if (!abilityId || !championId) {
      return;
    }

    Object.entries(matchAnswers).forEach(([existingAbilityId, existingChampionId]) => {
      if (existingChampionId === championId && existingAbilityId !== abilityId) {
        delete matchAnswers[existingAbilityId];
      }
    });

    matchAnswers[abilityId] = championId;
    activeMatchAbility = nextUnansweredMatchAbility(challenge, abilityId) || abilityId;
    playTone("select");
    renderChallenge();
  }

  function nextUnansweredMatchAbility(challenge, currentAbilityId) {
    const abilities = challenge.entities || [];
    const startIndex = Math.max(0, abilities.findIndex((ability) => ability.id === currentAbilityId));
    const ordered = [...abilities.slice(startIndex + 1), ...abilities.slice(0, startIndex + 1)];

    return ordered.find((ability) => !matchAnswers[ability.id])?.id || "";
  }

  function submitAnswer(answer, options = {}) {
    clearTimer();
    const result = engine.resolveChallenge(run, run.currentChallenge, answer, options);
    run = result.run;
    playTone(result.outcome.correct ? "correct" : result.outcome.partial > 0 ? "partial" : "wrong");

    if (run.phase === "results") {
      finalizeRun();
    } else {
      saveRun();
    }

    render();
  }

  function renderFeedback() {
    const outcome = run.lastOutcome || {};
    const tone = outcome.correct ? "correct" : outcome.partial > 0 ? "partial" : "wrong";
    const label = outcome.timedOut
      ? t().timeLost
      : outcome.correct
        ? t().correct
        : outcome.partial > 0
          ? t().partial
          : t().wrong;

    dom.root.innerHTML = `
      ${renderHud()}
      <section class="rift-run-feedback rift-run-feedback-${tone}">
        <p class="rift-run-kicker">${escapeHtml(label)}</p>
        <h1>${outcome.reward > 0 ? `+${formatInteger(outcome.reward)}` : outcome.scoreLoss > 0 ? `-${formatInteger(outcome.scoreLoss)}` : "0"}</h1>
        <p>${escapeHtml(l(outcome.explanation || ""))}</p>
        <div class="feedback-facts">
          <span>${escapeHtml(t().stability)} ${outcome.stabilityDelta > 0 ? "+" : ""}${outcome.stabilityDelta || 0}</span>
          <span>${escapeHtml(t().multiplier)} x${Number(outcome.multiplier || run.multiplier).toFixed(2)}</span>
        </div>
        <button class="rift-run-primary" type="button" data-action="continue">${escapeHtml(t().continue)}</button>
      </section>
    `;

    dom.root.querySelector("[data-action='continue']").addEventListener("click", () => {
      run = engine.advanceRun(run, data);
      saveRun();
      render();
    });
  }

  function renderCashOut() {
    dom.root.innerHTML = `
      ${renderHud()}
      <section class="rift-run-cashout">
        <p class="rift-run-kicker">${escapeHtml(t().stage)} ${run.stage - 1}</p>
        <h1>${escapeHtml(t().cashoutTitle)}</h1>
        <p>${escapeHtml(t().cashoutCopy)}</p>
        <div class="rift-run-actions">
          <button class="rift-run-primary" type="button" data-action="cashout">${escapeHtml(t().cashOut)}</button>
          <button class="rift-run-secondary" type="button" data-action="continue">${escapeHtml(t().pushDeeper)}</button>
        </div>
      </section>
    `;

    dom.root.querySelector("[data-action='cashout']").addEventListener("click", () => {
      run = engine.advanceRun(run, data, "cashOut");
      finalizeRun();
      render();
    });
    dom.root.querySelector("[data-action='continue']").addEventListener("click", () => {
      run = engine.advanceRun(run, data, "continue");
      saveRun();
      render();
    });
  }

  function renderResults() {
    const summary = engine.summarizeRun(run);

    dom.root.innerHTML = `
      <section class="rift-run-results">
        <p class="rift-run-kicker">Rift Run</p>
        <h1>${escapeHtml(t().runSummary)}</h1>
        <div class="result-score">${formatInteger(summary.score)}</div>
        <div class="result-grid">
          ${recordTile(t().deepest, `${t().stage} ${formatInteger(summary.depth)}`)}
          ${recordTile(t().accuracy, `${summary.accuracy}%`)}
          ${recordTile(t().bestCategory, l(summary.bestCategory))}
          ${recordTile(t().longestCombo, formatInteger(summary.longestCombo))}
          ${recordTile(t().hardest, summary.hardestCleared ? `${l(summary.hardestCleared.title)} · ${Math.round(summary.hardestCleared.difficulty * 100)}%` : "—")}
          ${recordTile(t().seed, summary.seed)}
        </div>
        <div class="rift-run-actions">
          <button class="rift-run-primary" type="button" data-action="start">${escapeHtml(t().newRun)}</button>
          ${renderMuteButton()}
        </div>
      </section>
    `;

    dom.root.querySelector("[data-action='start']").addEventListener("click", startRun);
    bindMuteButton();
  }

  function renderHud() {
    return `
      <section class="run-hud" aria-live="polite">
        ${hudItem(t().stage, formatInteger(run.stage))}
        ${hudItem(t().score, formatInteger(run.score))}
        ${hudItem(t().multiplier, `x${Number(run.multiplier || 1).toFixed(2)}`)}
        ${hudItem(t().stability, `${Math.round(run.stability)}%`)}
        ${hudItem(t().combo, formatInteger(run.combo))}
      </section>
    `;
  }

  function hudItem(label, value) {
    return `<div class="hud-item"><span>${escapeHtml(value)}</span><small>${escapeHtml(label)}</small></div>`;
  }

  function recordTile(label, value) {
    return `<div class="record-tile"><span>${escapeHtml(value)}</span><small>${escapeHtml(label)}</small></div>`;
  }

  function renderModifierList(modifiers = []) {
    if (!modifiers.length) {
      return "";
    }

    return `
      <div class="modifier-list">
        ${modifiers
          .map((modifier) => {
            if (typeof modifier === "string") {
              return `<span>${escapeHtml(modifier)}</span>`;
            }

            return `<span title="${escapeAttr(l(modifier.description))}">${escapeHtml(l(modifier.label))}</span>`;
          })
          .join("")}
      </div>
    `;
  }

  function startRun(event) {
    event?.preventDefault?.();
    const seed = String(dom.root.querySelector("#run-seed")?.value || "").trim();
    settings = { ...settings, seed };
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    run = engine.createRun(seed || undefined);
    run = engine.advanceRun(run, data);
    saveRun();
    playTone("select");
    render();
  }

  function finalizeRun() {
    rawRecords = engine.mergeRecords(rawRecords, run);
    localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(rawRecords));
    localStorage.removeItem(STORAGE_KEYS.activeRun);
  }

  function saveRun() {
    if (!run || run.phase === "results") {
      return;
    }

    localStorage.setItem(STORAGE_KEYS.activeRun, JSON.stringify(run));
  }

  function startTimer(challenge) {
    if (!challenge.timeLimit) {
      timerChallengeId = "";
      return;
    }

    if (timerChallengeId !== challenge.id) {
      timerChallengeId = challenge.id;
      timerDeadline = Date.now() + challenge.timeLimit * 1000;
    }

    const timerNode = dom.root.querySelector("#run-timer");

    timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));

      if (timerNode) {
        timerNode.textContent = `${remaining}s`;
      }

      if (remaining <= 0) {
        submitAnswer(null, { timedOut: true });
      }
    }, 200);
  }

  function clearTimer() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function handleKeydown(event) {
    if (!run) {
      return;
    }

    if (event.target?.matches("input, textarea, select")) {
      return;
    }

    const key = event.key.toLowerCase();

    if (run.phase === "choice" && /^[1-3]$/.test(key)) {
      const option = run.options[Number(key) - 1];
      if (option) {
        run = engine.selectOption(run, option.id);
        saveRun();
        render();
      }
      return;
    }

    if (run.phase === "feedback" && key === "enter") {
      run = engine.advanceRun(run, data);
      saveRun();
      render();
      return;
    }

    if (run.phase !== "challenge" || !run.currentChallenge) {
      return;
    }

    if (run.currentChallenge.type === "higherLower" || run.currentChallenge.type === "rapidFire") {
      if (["arrowright", "d", "2"].includes(key)) {
        clickFirst("[data-answer='higher'], [data-rapid-answer='higher']");
      }

      if (["arrowleft", "a", "1"].includes(key)) {
        clickFirst("[data-answer='lower'], [data-rapid-answer='lower']");
      }
      return;
    }

    if (["identify", "outlier", "constraint", "pickExtreme"].includes(run.currentChallenge.type) && /^[1-4]$/.test(key)) {
      const button = dom.root.querySelectorAll("[data-entity-id]")[Number(key) - 1];
      button?.click();
    }

    if (run.currentChallenge.type === "match" && /^[1-4]$/.test(key)) {
      const button = dom.root.querySelectorAll("[data-match-choice]")[Number(key) - 1];
      button?.click();
    }
  }

  function clickFirst(selector) {
    dom.root.querySelector(selector)?.click();
  }

  function renderMuteButton() {
    return `<button class="sound-toggle" type="button" data-action="mute" aria-pressed="${String(Boolean(settings.muted))}">${escapeHtml(settings.muted ? t().muted : t().sound)}</button>`;
  }

  function bindMuteButton() {
    dom.root.querySelector("[data-action='mute']")?.addEventListener("click", () => {
      settings = { ...settings, muted: !settings.muted };
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
      render();
    });
  }

  function renderDebugPanel() {
    if (!debugEnabled) {
      return;
    }

    const challenge = run?.currentChallenge;
    const panel = document.createElement("aside");
    panel.className = "rift-run-debug";
    panel.innerHTML = `
      <strong>Debug</strong>
      <span>seed ${escapeHtml(run?.seed || "none")}</span>
      <span>stage ${escapeHtml(run?.stage || "home")}</span>
      <span>phase ${escapeHtml(run?.phase || "home")}</span>
      <span>${escapeHtml(challenge ? `${challenge.type} · ${challenge.category} · ${Math.round(challenge.difficulty * 100)}%` : "no challenge")}</span>
      <label>
        <span>set stage</span>
        <input inputmode="numeric" value="${escapeAttr(run?.stage || 1)}" data-debug-stage>
      </label>
      <button type="button" data-debug-apply-stage>Apply</button>
      <button type="button" data-debug-skip ${run ? "" : "disabled"}>Skip</button>
      <button type="button" data-debug-reset>Reset storage</button>
    `;
    dom.root.append(panel);

    panel.querySelector("[data-debug-apply-stage]").addEventListener("click", () => {
      if (!run) {
        return;
      }

      const stage = Math.max(1, Number(panel.querySelector("[data-debug-stage]").value || 1));
      run = { ...run, stage, phase: "feedback", pendingCashOut: false };
      run = engine.advanceRun(run, data);
      saveRun();
      render();
    });

    panel.querySelector("[data-debug-skip]").addEventListener("click", () => {
      if (!run) {
        return;
      }

      run = { ...run, phase: "feedback", pendingCashOut: false, stage: run.stage + 1 };
      run = engine.advanceRun(run, data);
      saveRun();
      render();
    });

    panel.querySelector("[data-debug-reset]").addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEYS.activeRun);
      localStorage.removeItem(STORAGE_KEYS.records);
      run = null;
      rawRecords = {};
      render();
    });
  }

  function playTone(type) {
    if (settings.muted) {
      return;
    }

    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;
      const frequencies = {
        select: 280,
        correct: 520,
        partial: 380,
        wrong: 150,
      };

      oscillator.frequency.value = frequencies[type] || 260;
      oscillator.type = "sine";
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.035, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.14);
    } catch {
      settings = { ...settings, muted: true };
    }
  }

  function difficultyLabel(value) {
    if (value < 0.28) {
      return t().difficultyLabels.calm;
    }

    if (value < 0.48) {
      return t().difficultyLabels.medium;
    }

    if (value < 0.7) {
      return t().difficultyLabels.hard;
    }

    return t().difficultyLabels.brutal;
  }

  function formatInteger(value) {
    return new Intl.NumberFormat(language === "ru" ? "ru-RU" : "en-US").format(Math.round(Number(value || 0)));
  }

  async function fetchJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`${url} failed: ${response.status}`);
    }

    return response.json();
  }

  function getLanguage() {
    try {
      const saved = localStorage.getItem(LANGUAGE_KEY);
      return SUPPORTED_LANGUAGES.includes(saved) ? saved : DEFAULT_LANGUAGE;
    } catch {
      return DEFAULT_LANGUAGE;
    }
  }

  function t() {
    return copy[language] || copy[DEFAULT_LANGUAGE];
  }

  function l(value) {
    return engine.localize(value, language);
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }
})();
