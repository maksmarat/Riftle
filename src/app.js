const DATA_URL = "./data/champions.json";
const DATA_DRAGON_VERSION = "16.15.1";
const SAVE_KEY = "riftle-classic-state-v1";
const STATS_KEY = "riftle-classic-stats-v1";
const LANGUAGE_KEY = "riftle-language-v1";
const DEFAULT_LANGUAGE = "en";
const SUPPORTED_LANGUAGES = ["en", "ru"];
const MAX_SUGGESTIONS = 8;

const columns = [
  { key: "champion" },
  { key: "gender" },
  { key: "position" },
  { key: "species" },
  { key: "resource" },
  { key: "rangeType" },
  { key: "region" },
  { key: "releaseYear" },
];

const translations = {
  en: {
    htmlLang: "en",
    title: "Riftle Classic",
    languageAria: "Language",
    modesAria: "Modes",
    guessPanelAria: "Guess form",
    inputLabel: "Champion name",
    inputPlaceholder: "Enter champion name",
    boardAria: "Guesses",
    victoryModesAria: "Next mode",
    heroTitle: "Guess the champion",
    modes: {
      classic: "Classic",
      ability: "Ability",
      quote: "Quote",
      splash: "Splash",
    },
    columns: {
      champion: "Champion",
      gender: "Gender",
      position: "Position",
      species: "Species",
      resource: "Resource",
      rangeType: "Range type",
      region: "Region",
      releaseYear: "Year",
    },
    values: {},
    playAgain: "Play again",
    messages: {
      loadError: "Could not load the champion list.",
      newRound: "New champion selected.",
      roundClosed: "Round complete.",
      unknownChampion: "Champion is not in the list.",
      duplicateChampion: "This champion was already guessed.",
      hit: "Hit.",
      victoryKicker: ({ round, guesses }) => {
        const guessLabel = guesses === 1 ? "guess" : "guesses";
        return `Round ${round} solved in ${guesses} ${guessLabel}`;
      },
    },
  },
  ru: {
    htmlLang: "ru",
    title: "Riftle Classic",
    languageAria: "Язык",
    modesAria: "Режимы",
    guessPanelAria: "Форма угадывания",
    inputLabel: "Имя чемпиона",
    inputPlaceholder: "Введите имя чемпиона",
    boardAria: "Догадки",
    victoryModesAria: "Следующий режим",
    heroTitle: "Угадай чемпиона",
    modes: {
      classic: "Классика",
      ability: "Умение",
      quote: "Цитата",
      splash: "Сплэш",
    },
    columns: {
      champion: "Чемпион",
      gender: "Пол",
      position: "Позиция",
      species: "Вид",
      resource: "Ресурс",
      rangeType: "Тип атаки",
      region: "Регион",
      releaseYear: "Год",
    },
    values: {
      Female: "Женщина",
      Male: "Мужчина",
      Other: "Другое",
      Top: "Топ",
      Jungle: "Лес",
      Middle: "Мид",
      Bottom: "Бот",
      Support: "Саппорт",
      Aspect: "Аспект",
      Baccai: "Баккай",
      Brackern: "Бракен",
      Cat: "Кот",
      Celestial: "Небожитель",
      "Chemically Altered": "Химически измененный",
      Cyborg: "Киборг",
      Darkin: "Даркин",
      Demon: "Демон",
      Dog: "Пес",
      Dragon: "Дракон",
      God: "Бог",
      "God-Warrior": "Бог-воин",
      Golem: "Голем",
      Human: "Человек",
      Iceborn: "Ледорожденный",
      "Magically Altered": "Магически измененный",
      Magicborn: "Магорожденный",
      Minotaur: "Минотавр",
      Plant: "Растение",
      Rat: "Крыса",
      Revenant: "Ревенант",
      Spirit: "Дух",
      Spiritualist: "Спиритуалист",
      Troll: "Тролль",
      Undead: "Нежить",
      Unknown: "Неизвестно",
      Vastayan: "Вастайя",
      "Void-Being": "Существо Бездны",
      Yeti: "Йети",
      Yordle: "Йордл",
      Bloodthirst: "Жажда крови",
      Courage: "Храбрость",
      Energy: "Энергия",
      Ferocity: "Свирепость",
      Flow: "Поток",
      Fury: "Ярость",
      Grit: "Стойкость",
      "Health costs": "Затраты здоровья",
      Heat: "Жар",
      Mana: "Мана",
      Manaless: "Без ресурса",
      Rage: "Ярость",
      Shield: "Щит",
      Ranged: "Дальний",
      Melee: "Ближний",
      "Bandle City": "Бандл-Сити",
      Bilgewater: "Билджвотер",
      Camavor: "Камавор",
      Demacia: "Демасия",
      Freljord: "Фрельйорд",
      Icathia: "Икатия",
      Ionia: "Иония",
      Ixtal: "Иксталь",
      Noxus: "Ноксус",
      Piltover: "Пилтовер",
      Runeterra: "Рунтерра",
      "Shadow Isles": "Сумрачные острова",
      Shurima: "Шурима",
      Targon: "Таргон",
      Void: "Бездна",
      Zaun: "Заун",
    },
    playAgain: "Еще раз",
    messages: {
      loadError: "Не удалось загрузить список чемпионов.",
      newRound: "Новый чемпион выбран.",
      roundClosed: "Раунд закрыт.",
      unknownChampion: "Такого чемпиона нет в списке.",
      duplicateChampion: "Этот чемпион уже был.",
      hit: "Попадание.",
      victoryKicker: ({ round, guesses }) => {
        return `Раунд ${round} закрыт за ${guesses} ${guessWordRu(guesses)}`;
      },
    },
  },
};

const stateDefaults = {
  targetName: "",
  guesses: [],
  solved: false,
  round: 1,
};

let champions = [];
let championByName = new Map();
let championByNormalizedName = new Map();
let state = { ...stateDefaults };
let target = null;
let highlightedSuggestion = -1;
let currentLanguage = getSavedLanguage();
let currentMessage = null;

const dom = {
  form: document.querySelector("#guess-form"),
  input: document.querySelector("#champion-input"),
  inputLabel: document.querySelector("#champion-input-label"),
  suggestions: document.querySelector("#suggestions"),
  message: document.querySelector("#message"),
  mainModes: document.querySelector("#main-modes"),
  modeButtons: document.querySelectorAll("[data-mode-key]"),
  languageSwitch: document.querySelector("#language-switch"),
  languageButtons: document.querySelectorAll("[data-language]"),
  heroTitle: document.querySelector("#page-title"),
  boardHeader: document.querySelector("#board-header"),
  boardShell: document.querySelector("#board-shell"),
  guessList: document.querySelector("#guess-list"),
  guessPanel: document.querySelector("#guess-panel"),
  victoryModal: document.querySelector("#victory-modal"),
  victoryImage: document.querySelector("#victory-image"),
  victoryKicker: document.querySelector("#victory-kicker"),
  victoryTitle: document.querySelector("#victory-title"),
  victoryModes: document.querySelector("#victory-modes"),
  playAgain: document.querySelector("#play-again"),
};

init();

async function init() {
  applyLanguage(false);
  renderBoardHeader();

  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`Champion data failed: ${response.status}`);
    }

    const data = await response.json();
    champions = data.map(normalizeChampion).sort((a, b) => a.name.localeCompare(b.name));
    championByName = new Map(champions.map((champion) => [champion.name, champion]));
    championByNormalizedName = new Map(
      champions.map((champion) => [normalizeText(champion.name), champion]),
    );

    restoreState();
    ensureTarget();
    bindEvents();
    render();
  } catch (error) {
    showMessage("loadError", "error");
    console.error(error);
  }
}

function bindEvents() {
  dom.form.addEventListener("submit", handleSubmit);
  dom.input.addEventListener("input", handleInput);
  dom.input.addEventListener("keydown", handleSuggestionKeys);
  dom.input.addEventListener("focus", handleInput);
  dom.playAgain.addEventListener("click", startNewRound);
  dom.languageButtons.forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.language));
  });
  document.addEventListener("click", closeSuggestionsOutside);
}

function setLanguage(language) {
  if (!SUPPORTED_LANGUAGES.includes(language) || language === currentLanguage) {
    return;
  }

  currentLanguage = language;
  localStorage.setItem(LANGUAGE_KEY, language);
  applyLanguage();
}

function applyLanguage(renderExisting = true) {
  const copy = getCopy();

  document.documentElement.lang = copy.htmlLang;
  document.title = copy.title;
  dom.mainModes.setAttribute("aria-label", copy.modesAria);
  dom.languageSwitch.setAttribute("aria-label", copy.languageAria);
  dom.guessPanel.setAttribute("aria-label", copy.guessPanelAria);
  dom.inputLabel.textContent = copy.inputLabel;
  dom.input.placeholder = copy.inputPlaceholder;
  dom.boardShell.setAttribute("aria-label", copy.boardAria);
  dom.victoryModes.setAttribute("aria-label", copy.victoryModesAria);
  dom.heroTitle.textContent = copy.heroTitle;
  dom.playAgain.textContent = copy.playAgain;

  dom.modeButtons.forEach((button) => {
    const modeKey = button.dataset.modeKey;
    button.textContent = copy.modes[modeKey];
  });

  dom.languageButtons.forEach((button) => {
    const isActive = button.dataset.language === currentLanguage;
    button.classList.toggle("language-option-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  if (currentMessage) {
    dom.message.textContent = translateMessage(currentMessage.key, currentMessage.args);
  }

  renderBoardHeader();

  if (renderExisting && champions.length > 0) {
    render();
  }
}

function getCopy() {
  return translations[currentLanguage] || translations[DEFAULT_LANGUAGE];
}

function getSavedLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return SUPPORTED_LANGUAGES.includes(saved) ? saved : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function normalizeChampion(champion) {
  const iconKey = getIconKey(champion.icon, champion.name);

  return {
    ...champion,
    iconKey,
    icon: `https://ddragon.leagueoflegends.com/cdn/${DATA_DRAGON_VERSION}/img/champion/${iconKey}.png`,
    position: toArray(champion.position),
    species: toArray(champion.species),
    rangeType: toArray(champion.rangeType),
    region: toArray(champion.region),
  };
}

function getIconKey(icon, fallbackName) {
  const match = String(icon || "").match(/champion\/([^/.]+)\.png/i);
  return match ? match[1] : fallbackName.replace(/[^A-Za-z0-9]/g, "");
}

function restoreState() {
  const saved = readStorage(SAVE_KEY, null);
  const stats = readStorage(STATS_KEY, null);

  state = {
    ...stateDefaults,
    ...saved,
    round: Number(saved?.round || stats?.round || 1),
    guesses: Array.isArray(saved?.guesses) ? saved.guesses : [],
  };
}

function ensureTarget() {
  if (!championByName.has(state.targetName)) {
    startNewRound(false);
    return;
  }

  target = championByName.get(state.targetName);
}

function startNewRound(renderAfter = true) {
  const nextTarget = pickRandomChampion(state.targetName);
  state = {
    targetName: nextTarget.name,
    guesses: [],
    solved: false,
    round: Number(state.round || 1) + (state.targetName ? 1 : 0),
  };
  target = nextTarget;
  saveState();
  closeSuggestions();
  dom.input.value = "";

  if (renderAfter) {
    render();
    showMessage("newRound", "success");
    dom.input.focus();
  }
}

function pickRandomChampion(excludeName) {
  const pool = champions.filter((champion) => champion.name !== excludeName);
  const index = crypto.getRandomValues(new Uint32Array(1))[0] % pool.length;
  return pool[index];
}

function handleSubmit(event) {
  event.preventDefault();

  if (!target) {
    return;
  }

  if (state.solved) {
    showMessage("roundClosed", "success");
    return;
  }

  const name = dom.input.value.trim();
  const guess = championByNormalizedName.get(normalizeText(name));
  submitGuess(guess);
}

function submitGuess(guess) {
  if (!guess) {
    showMessage("unknownChampion", "error");
    return;
  }

  if (state.guesses.includes(guess.name)) {
    showMessage("duplicateChampion", "error");
    dom.input.select();
    return;
  }

  state.guesses.push(guess.name);
  dom.input.value = "";
  closeSuggestions();

  if (guess.name === target.name) {
    state.solved = true;
    saveStats();
    showMessage("hit", "success");
  } else if (currentMessage?.tone !== "error") {
    clearMessage();
  }

  saveState();
  render();
}

function handleInput() {
  const rawQuery = dom.input.value.trim();
  const showFullRoster = /^'+$/.test(rawQuery);
  const query = normalizeText(rawQuery);

  if (!showFullRoster && !query) {
    closeSuggestions();
    return;
  }

  const matches = champions
    .filter((champion) => {
      return (
        !state.guesses.includes(champion.name) &&
        (showFullRoster || normalizeText(champion.name).includes(query))
      );
    })
    .slice(0, showFullRoster ? champions.length : MAX_SUGGESTIONS);

  highlightedSuggestion = -1;
  renderSuggestions(matches);
}

function handleSuggestionKeys(event) {
  const options = [...dom.suggestions.querySelectorAll(".suggestion")];

  if (!options.length) {
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    highlightedSuggestion = (highlightedSuggestion + 1) % options.length;
    updateSuggestionHighlight(options);
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    highlightedSuggestion = (highlightedSuggestion - 1 + options.length) % options.length;
    updateSuggestionHighlight(options);
  }

  if (event.key === "Enter") {
    event.preventDefault();
    const selectedIndex = highlightedSuggestion >= 0 ? highlightedSuggestion : 0;
    options[selectedIndex].click();
  }

  if (event.key === "Escape") {
    closeSuggestions();
  }
}

function renderSuggestions(matches) {
  dom.suggestions.innerHTML = "";
  dom.input.setAttribute("aria-expanded", String(matches.length > 0));
  const fragment = document.createDocumentFragment();

  matches.forEach((champion, index) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "suggestion";
    option.setAttribute("role", "option");
    option.style.setProperty("--suggestion-index", index);
    option.innerHTML = `
      <img src="${champion.icon}" alt="">
      <span>${champion.name}</span>
    `;
    option.addEventListener("click", () => {
      dom.input.value = champion.name;
      closeSuggestions();
      submitGuess(champion);
    });
    fragment.append(option);
  });

  dom.suggestions.append(fragment);
}

function updateSuggestionHighlight(options) {
  options.forEach((option, index) => {
    option.classList.toggle("is-highlighted", index === highlightedSuggestion);
  });
}

function closeSuggestionsOutside(event) {
  if (!dom.form.contains(event.target)) {
    closeSuggestions();
  }
}

function closeSuggestions() {
  highlightedSuggestion = -1;
  dom.suggestions.innerHTML = "";
  dom.input.setAttribute("aria-expanded", "false");
}

function render() {
  const guessedChampions = state.guesses
    .map((name) => championByName.get(name))
    .filter(Boolean)
    .reverse();

  dom.input.disabled = state.solved;
  dom.boardHeader.classList.toggle("hidden", guessedChampions.length === 0);
  dom.guessList.innerHTML = "";
  dom.boardShell.classList.toggle("hidden", guessedChampions.length === 0);

  guessedChampions.forEach((guess, index) => {
    const row = document.createElement("div");
    row.className = "guess-row";
    row.classList.toggle("guess-row-latest", index === 0);
    row.style.setProperty("--row-index", index);

    columns.forEach((column) => {
      row.append(renderCell(column, guess));
    });

    dom.guessList.append(row);
  });

  renderVictory();
}

function renderBoardHeader() {
  dom.boardHeader.innerHTML = "";
  const copy = getCopy();

  columns.forEach((column) => {
    const header = document.createElement("div");
    header.className = "board-heading";
    header.textContent = copy.columns[column.key];
    dom.boardHeader.append(header);
  });
}

function renderCell(column, guess) {
  if (column.key === "champion") {
    return renderChampionCell(guess);
  }

  const comparison = compareValue(column.key, guess, target);
  const cell = document.createElement("div");
  cell.className = `cell cell-${comparison.status}`;
  cell.dataset.label = getCopy().columns[column.key];
  cell.style.setProperty("--cell-index", columns.findIndex((item) => item.key === column.key));

  const value = document.createElement("span");
  value.textContent = comparison.text;
  cell.append(value);

  return cell;
}

function renderChampionCell(guess) {
  const cell = document.createElement("div");
  const isMatch = guess.name === target.name;
  cell.className = `cell champion-cell ${isMatch ? "cell-match" : "cell-miss"}`;
  cell.dataset.label = getCopy().columns.champion;
  cell.style.setProperty("--cell-index", "0");
  cell.innerHTML = `
    <img src="${guess.icon}" alt="${guess.name}">
    <span>${guess.name}</span>
  `;
  return cell;
}

function compareValue(key, guess, answer) {
  if (key === "releaseYear") {
    const guessYear = Number(guess.releaseYear);
    const answerYear = Number(answer.releaseYear);
    const arrow = guessYear === answerYear ? "" : guessYear < answerYear ? " ↑" : " ↓";
    return {
      status: guessYear === answerYear ? "match" : "miss",
      text: `${guessYear}${arrow}`,
    };
  }

  if (Array.isArray(guess[key]) || Array.isArray(answer[key])) {
    const guessedValues = toArray(guess[key]);
    const answerValues = toArray(answer[key]);
    const exact = sameSet(guessedValues, answerValues);
    const partial = !exact && guessedValues.some((value) => answerValues.includes(value));

    return {
      status: exact ? "match" : partial ? "partial" : "miss",
      text: formatValue(guessedValues),
    };
  }

  return {
    status: guess[key] === answer[key] ? "match" : "miss",
    text: formatValue(guess[key]),
  };
}

function renderVictory() {
  if (!state.solved || !target) {
    dom.victoryModal.classList.add("hidden");
    return;
  }

  dom.victoryImage.src = target.icon;
  dom.victoryImage.alt = target.name;
  dom.victoryKicker.textContent = translateMessage("victoryKicker", {
    round: state.round,
    guesses: state.guesses.length,
  });
  dom.victoryTitle.textContent = target.name;
  dom.victoryModal.classList.remove("hidden");
}

function showMessage(key, tone = "neutral", args = {}) {
  currentMessage = { key, tone, args };
  dom.message.textContent = translateMessage(key, args);
  dom.message.dataset.tone = tone;
}

function clearMessage() {
  currentMessage = null;
  dom.message.textContent = "";
  delete dom.message.dataset.tone;
}

function translateMessage(key, args = {}) {
  const message = getCopy().messages[key];
  return typeof message === "function" ? message(args) : message || key;
}

function saveState() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function saveStats() {
  const stats = readStorage(STATS_KEY, { solved: 0 });
  stats.solved = Number(stats.solved || 0) + 1;
  stats.round = state.round;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null || value === "") {
    return [];
  }

  return [value];
}

function sameSet(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value) => right.includes(value));
}

function formatValue(value) {
  const values = toArray(value);
  const labels = getCopy().values;
  return values.map((item) => labels[item] || item).join(", ");
}

function guessWordRu(count) {
  const normalized = Math.abs(Number(count)) % 100;
  const lastDigit = normalized % 10;

  if (normalized > 10 && normalized < 20) {
    return "попыток";
  }

  if (lastDigit === 1) {
    return "попытку";
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return "попытки";
  }

  return "попыток";
}

function normalizeText(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9а-яё]/gi, "");
}
