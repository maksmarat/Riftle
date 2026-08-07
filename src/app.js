const DATA_URL = "./data/champions.json";
const ITEM_DATA_URL = "./data/items.json";
const ABILITY_DATA_URL = "./data/abilities.json";
const CHAMPION_STAT_DATA_URL = "./data/champion-stats.json";
const DATA_DRAGON_VERSION = "16.15.1";
const SAVE_KEY = "riftle-classic-state-v1";
const STATS_KEY = "riftle-classic-stats-v1";
const MODE_KEY = "riftle-mode-v1";
const LANGUAGE_KEY = "riftle-language-v1";
const MORELESS_SAVE_KEY = "riftle-moreless-state-v1";
const MORELESS_STATS_KEY = "riftle-moreless-stats-v1";
const MORELESS_BEST_COOKIE = "riftle_moreless_best";
const SPELL_DUEL_SAVE_KEY = "riftle-spell-duel-state-v1";
const SPELL_DUEL_STATS_KEY = "riftle-spell-duel-stats-v1";
const SPELL_DUEL_BEST_COOKIE = "riftle_spell_duel_best";
const STAT_DUEL_SAVE_KEY = "riftle-stat-duel-state-v1";
const STAT_DUEL_STATS_KEY = "riftle-stat-duel-stats-v1";
const STAT_DUEL_BEST_COOKIE = "riftle_stat_duel_best";
const DEFAULT_LANGUAGE = "en";
const SUPPORTED_LANGUAGES = ["en", "ru"];
const DEFAULT_MODE = "classic";
const PLAYABLE_MODES = ["classic", "moreLess", "spellDuel", "statDuel"];
const DUEL_MODES = ["moreLess", "spellDuel", "statDuel"];
const MAX_SUGGESTIONS = 8;

const itemStatOrder = [
  "healthLevel1",
  "healthLevel18",
  "healthGrowth",
  "manaLevel1",
  "manaLevel18",
  "manaGrowth",
  "armorLevel1",
  "armorLevel18",
  "armorGrowth",
  "magicResistLevel1",
  "magicResistLevel18",
  "magicResistGrowth",
  "attackDamageLevel1",
  "attackDamageLevel18",
  "attackDamageGrowth",
  "attackSpeedLevel1",
  "attackSpeedLevel18",
  "attackSpeedGrowth",
  "attackRange",
  "moveSpeed",
  "healthRegenLevel1",
  "healthRegenLevel18",
  "healthRegenGrowth",
  "manaRegenLevel1",
  "manaRegenLevel18",
  "manaRegenGrowth",
  "acquisitionRange",
  "selectionRadius",
  "pathfindingRadius",
  "attackDamage",
  "abilityPower",
  "health",
  "mana",
  "armor",
  "magicResist",
  "attackSpeed",
  "critChance",
  "moveSpeed",
  "percentMoveSpeed",
  "abilityHaste",
  "lifeSteal",
  "omnivamp",
  "lethality",
  "armorPenetration",
  "percentArmorPenetration",
  "magicPenetration",
  "percentMagicPenetration",
  "healShieldPower",
  "baseHealthRegen",
  "baseManaRegen",
  "tenacity",
  "abilityDamage",
  "abilityCooldown",
  "abilityCost",
  "abilityRange",
  "abilityShield",
  "abilityHealing",
  "abilitySlow",
  "abilityMoveSpeed",
  "abilityAttackSpeed",
  "abilityDamageReduction",
  "abilityAttackDamage",
  "abilityArmor",
  "abilityMagicResist",
  "abilityCharges",
];

const percentStats = new Set([
  "attackSpeed",
  "critChance",
  "percentMoveSpeed",
  "lifeSteal",
  "omnivamp",
  "percentArmorPenetration",
  "percentMagicPenetration",
  "healShieldPower",
  "baseHealthRegen",
  "baseManaRegen",
  "tenacity",
  "abilitySlow",
  "abilityMoveSpeed",
  "abilityAttackSpeed",
  "abilityDamageReduction",
  "attackSpeedGrowth",
]);

const secondsStats = new Set(["abilityCooldown"]);
const preciseStats = new Set(["attackSpeedLevel1", "attackSpeedLevel18"]);

const duelStorage = {
  moreLess: {
    saveKey: MORELESS_SAVE_KEY,
    statsKey: MORELESS_STATS_KEY,
    bestCookie: MORELESS_BEST_COOKIE,
    countLabelKey: "items",
  },
  spellDuel: {
    saveKey: SPELL_DUEL_SAVE_KEY,
    statsKey: SPELL_DUEL_STATS_KEY,
    bestCookie: SPELL_DUEL_BEST_COOKIE,
    countLabelKey: "abilities",
  },
  statDuel: {
    saveKey: STAT_DUEL_SAVE_KEY,
    statsKey: STAT_DUEL_STATS_KEY,
    bestCookie: STAT_DUEL_BEST_COOKIE,
    countLabelKey: "champions",
  },
};

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
    titles: {
      classic: "Riftle Classic",
      moreLess: "Riftle Item Duel",
      spellDuel: "Riftle Spell Duel",
      statDuel: "Riftle Stat Duel",
    },
    languageAria: "Language",
    modesAria: "Modes",
    guessPanelAria: "Guess form",
    moreLessAria: "More or Less",
    inputLabel: "Champion name",
    inputPlaceholder: "Enter champion name",
    boardAria: "Guesses",
    victoryModesAria: "Next mode",
    heroTitle: "Guess the champion",
    heroTitles: {
      classic: "Guess the champion",
      moreLess: "Item Duel",
      spellDuel: "Spell Duel",
      statDuel: "Stat Duel",
    },
    modes: {
      classic: "Classic",
      moreLess: "Item Duel",
      spellDuel: "Spell Duel",
      statDuel: "Stat Duel",
      riftRun: "Rift Run",
      random: "Random",
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
    statLabels: {
      healthLevel1: "Health at level 1",
      healthLevel18: "Health at level 18",
      healthGrowth: "Health Growth",
      manaLevel1: "Mana at level 1",
      manaLevel18: "Mana at level 18",
      manaGrowth: "Mana Growth",
      armorLevel1: "Armor at level 1",
      armorLevel18: "Armor at level 18",
      armorGrowth: "Armor Growth",
      magicResistLevel1: "Magic Resist at level 1",
      magicResistLevel18: "Magic Resist at level 18",
      magicResistGrowth: "Magic Resist Growth",
      attackDamageLevel1: "Attack Damage at level 1",
      attackDamageLevel18: "Attack Damage at level 18",
      attackDamageGrowth: "Attack Damage Growth",
      attackSpeedLevel1: "Attack Speed at level 1",
      attackSpeedLevel18: "Attack Speed at level 18",
      attackSpeedGrowth: "Attack Speed Growth",
      attackRange: "Attack Range",
      acquisitionRange: "Acquisition Range",
      selectionRadius: "Selection Radius",
      pathfindingRadius: "Collision Radius",
      healthRegenLevel1: "Health Regen at level 1",
      healthRegenLevel18: "Health Regen at level 18",
      healthRegenGrowth: "Health Regen Growth",
      manaRegenLevel1: "Mana Regen at level 1",
      manaRegenLevel18: "Mana Regen at level 18",
      manaRegenGrowth: "Mana Regen Growth",
      attackDamage: "Attack Damage",
      abilityPower: "Ability Power",
      health: "Health",
      mana: "Mana",
      armor: "Armor",
      magicResist: "Magic Resist",
      attackSpeed: "Attack Speed",
      critChance: "Crit Chance",
      moveSpeed: "Move Speed",
      percentMoveSpeed: "Move Speed",
      abilityHaste: "Ability Haste",
      lifeSteal: "Life Steal",
      omnivamp: "Omnivamp",
      lethality: "Lethality",
      armorPenetration: "Armor Penetration",
      percentArmorPenetration: "Armor Penetration",
      magicPenetration: "Magic Penetration",
      percentMagicPenetration: "Magic Penetration",
      healShieldPower: "Heal and Shield Power",
      baseHealthRegen: "Base Health Regen",
      baseManaRegen: "Base Mana Regen",
      tenacity: "Tenacity",
      abilityDamage: "Damage",
      abilityCooldown: "Cooldown",
      abilityCost: "Cost",
      abilityRange: "Range",
      abilityShield: "Shield",
      abilityHealing: "Healing",
      abilitySlow: "Slow",
      abilityMoveSpeed: "Move Speed",
      abilityAttackSpeed: "Attack Speed",
      abilityDamageReduction: "Damage Reduction",
      abilityAttackDamage: "Attack Damage",
      abilityArmor: "Armor",
      abilityMagicResist: "Magic Resist",
      abilityCharges: "Charges",
    },
    moreLess: {
      streak: "streak",
      best: "best",
      items: "items",
      abilities: "abilities",
      champions: "champions",
      championStats: "champion stats",
      compareStat: "Compare stat",
      currentItem: "current item",
      nextItem: "next item",
      gold: "gold",
      higher: "Higher",
      lower: "Lower",
      higherAction: "Higher",
      lowerAction: "Lower",
      hiddenValue: "???",
      gameOver: "Game over",
      tryAgain: "Try again",
      resultCopy: ({ streak, best }) => `Your streak: ${streak}. Best: ${best}.`,
      referenceValue: ({ item, stat, value }) => `${item}: ${stat} ${value}`,
    },
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
    titles: {
      classic: "Riftle Classic",
      moreLess: "Riftle Item Duel",
      spellDuel: "Riftle Spell Duel",
      statDuel: "Riftle Stat Duel",
    },
    languageAria: "Язык",
    modesAria: "Режимы",
    guessPanelAria: "Форма угадывания",
    moreLessAria: "Больше или меньше",
    inputLabel: "Имя чемпиона",
    inputPlaceholder: "Введите имя чемпиона",
    boardAria: "Догадки",
    victoryModesAria: "Следующий режим",
    heroTitle: "Угадай чемпиона",
    heroTitles: {
      classic: "Угадай чемпиона",
      moreLess: "Дуэль предметов",
      spellDuel: "Дуэль умений",
      statDuel: "Дуэль статов",
    },
    modes: {
      classic: "Классика",
      moreLess: "Предметы",
      spellDuel: "Умения",
      statDuel: "Статы",
      riftRun: "Rift Run",
      random: "Рандом",
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
    statLabels: {
      healthLevel1: "Здоровье на 1-м",
      healthLevel18: "Здоровье на 18-м",
      healthGrowth: "Прирост здоровья",
      manaLevel1: "Мана на 1-м",
      manaLevel18: "Мана на 18-м",
      manaGrowth: "Прирост маны",
      armorLevel1: "Броня на 1-м",
      armorLevel18: "Броня на 18-м",
      armorGrowth: "Прирост брони",
      magicResistLevel1: "Сопротивление магии на 1-м",
      magicResistLevel18: "Сопротивление магии на 18-м",
      magicResistGrowth: "Прирост сопротивления магии",
      attackDamageLevel1: "Сила атаки на 1-м",
      attackDamageLevel18: "Сила атаки на 18-м",
      attackDamageGrowth: "Прирост силы атаки",
      attackSpeedLevel1: "Скорость атаки на 1-м",
      attackSpeedLevel18: "Скорость атаки на 18-м",
      attackSpeedGrowth: "Прирост скорости атаки",
      attackRange: "Дальность атаки",
      acquisitionRange: "Радиус захвата цели",
      selectionRadius: "Радиус выбора",
      pathfindingRadius: "Радиус коллизии",
      healthRegenLevel1: "Регенерация здоровья на 1-м",
      healthRegenLevel18: "Регенерация здоровья на 18-м",
      healthRegenGrowth: "Прирост регенерации здоровья",
      manaRegenLevel1: "Регенерация маны на 1-м",
      manaRegenLevel18: "Регенерация маны на 18-м",
      manaRegenGrowth: "Прирост регенерации маны",
      attackDamage: "Сила атаки",
      abilityPower: "Сила умений",
      health: "Здоровье",
      mana: "Мана",
      armor: "Броня",
      magicResist: "Сопротивление магии",
      attackSpeed: "Скорость атаки",
      critChance: "Шанс крит. удара",
      moveSpeed: "Скорость передвижения",
      percentMoveSpeed: "Скорость передвижения",
      abilityHaste: "Ускорение умений",
      lifeSteal: "Вампиризм",
      omnivamp: "Всесторонний вампиризм",
      lethality: "Летальность",
      armorPenetration: "Пробивание брони",
      percentArmorPenetration: "Пробивание брони",
      magicPenetration: "Магическое пробивание",
      percentMagicPenetration: "Магическое пробивание",
      healShieldPower: "Сила лечения и щитов",
      baseHealthRegen: "Базовое восстановление здоровья",
      baseManaRegen: "Базовое восстановление маны",
      tenacity: "Стойкость",
      abilityDamage: "Урон",
      abilityCooldown: "Перезарядка",
      abilityCost: "Стоимость",
      abilityRange: "Дальность",
      abilityShield: "Щит",
      abilityHealing: "Лечение",
      abilitySlow: "Замедление",
      abilityMoveSpeed: "Скорость передвижения",
      abilityAttackSpeed: "Скорость атаки",
      abilityDamageReduction: "Снижение урона",
      abilityAttackDamage: "Сила атаки",
      abilityArmor: "Броня",
      abilityMagicResist: "Сопротивление магии",
      abilityCharges: "Заряды",
    },
    moreLess: {
      streak: "стрик",
      best: "лучший",
      items: "предметов",
      abilities: "умений",
      champions: "чемпионов",
      championStats: "статы чемпиона",
      compareStat: "Сравни стат",
      currentItem: "текущий предмет",
      nextItem: "следующий предмет",
      gold: "золота",
      higher: "Больше",
      lower: "Меньше",
      higherAction: "Больше",
      lowerAction: "Меньше",
      hiddenValue: "???",
      gameOver: "Поражение",
      tryAgain: "Еще раз",
      resultCopy: ({ streak, best }) => `Стрик: ${streak}. Лучший: ${best}.`,
      referenceValue: ({ item, stat, value }) => `${item}: ${stat} ${value}`,
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

const moreLessDefaults = {
  currentItemId: "",
  challengerItemId: "",
  statKey: "",
  streak: 0,
  best: 0,
  gameOver: false,
  revealed: false,
  lastAnswer: null,
  seenItemIds: [],
};

let champions = [];
let championByName = new Map();
let championByNormalizedName = new Map();
let items = [];
let itemById = new Map();
let itemStatsByKey = new Map();
let abilities = [];
let abilityById = new Map();
let abilityStatsByKey = new Map();
let championStats = [];
let championStatById = new Map();
let championStatStatsByKey = new Map();
let state = { ...stateDefaults };
let moreLessState = { ...moreLessDefaults };
let spellDuelState = { ...moreLessDefaults };
let statDuelState = { ...moreLessDefaults };
let target = null;
let highlightedSuggestion = -1;
let currentLanguage = getSavedLanguage();
let currentMode = getSavedMode();
let currentMessage = null;
let moreLessAdvanceTimer = null;

const dom = {
  form: document.querySelector("#guess-form"),
  input: document.querySelector("#champion-input"),
  inputLabel: document.querySelector("#champion-input-label"),
  suggestions: document.querySelector("#suggestions"),
  message: document.querySelector("#message"),
  mainModes: document.querySelector("#main-modes"),
  modeButtons: document.querySelectorAll("button[data-mode-key]"),
  modeLinks: document.querySelectorAll("[data-mode-link]"),
  pageLinks: document.querySelectorAll("[data-page-key]"),
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
  moreLessShell: document.querySelector("#moreless-shell"),
  moreLessStage: document.querySelector("#moreless-stage"),
  moreLessStreak: document.querySelector("#moreless-streak"),
  moreLessStreakLabel: document.querySelector("#moreless-streak-label"),
  moreLessBest: document.querySelector("#moreless-best"),
  moreLessBestLabel: document.querySelector("#moreless-best-label"),
  moreLessItemCount: document.querySelector("#moreless-item-count"),
  moreLessItemCountLabel: document.querySelector("#moreless-item-count-label"),
  moreLessLeftCard: document.querySelector("#moreless-left-card"),
  moreLessRightCard: document.querySelector("#moreless-right-card"),
  moreLessResult: document.querySelector("#moreless-result"),
  moreLessResultTitle: document.querySelector("#moreless-result-title"),
  moreLessResultCopy: document.querySelector("#moreless-result-copy"),
  moreLessRetry: document.querySelector("#moreless-retry"),
};

init();

async function init() {
  applyLanguage(false);
  renderBoardHeader();

  try {
    const [championData, itemData, abilityData, championStatData] = await Promise.all([
      fetchJson(DATA_URL, "Champion data"),
      fetchJson(ITEM_DATA_URL, "Item data"),
      fetchJson(ABILITY_DATA_URL, "Ability data"),
      fetchJson(CHAMPION_STAT_DATA_URL, "Champion stat data"),
    ]);

    champions = championData.map(normalizeChampion).sort((a, b) => a.name.localeCompare(b.name));
    championByName = new Map(champions.map((champion) => [champion.name, champion]));
    championByNormalizedName = new Map(
      champions.map((champion) => [normalizeText(champion.name), champion]),
    );
    items = (itemData.items || []).map(normalizeItem).filter((item) => item.statEntries.length > 0);
    itemById = new Map(items.map((item) => [item.id, item]));
    itemStatsByKey = buildItemStatsByKey(items);
    abilities = (abilityData.abilities || [])
      .map(normalizeAbility)
      .filter((ability) => ability.statEntries.length > 0);
    abilityById = new Map(abilities.map((ability) => [ability.id, ability]));
    abilityStatsByKey = buildItemStatsByKey(abilities);
    championStats = (championStatData.champions || [])
      .map(normalizeChampionStat)
      .filter((champion) => champion.statEntries.length > 0);
    championStatById = new Map(championStats.map((champion) => [champion.id, champion]));
    championStatStatsByKey = buildItemStatsByKey(championStats);

    restoreState();
    restoreMoreLessState("moreLess");
    restoreMoreLessState("spellDuel");
    restoreMoreLessState("statDuel");
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
  dom.modeButtons.forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.modeKey));
  });
  dom.languageButtons.forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.language));
  });
  dom.moreLessLeftCard.addEventListener("click", () => answerMoreLess("less"));
  dom.moreLessRightCard.addEventListener("click", () => answerMoreLess("more"));
  dom.moreLessLeftCard.addEventListener("keydown", (event) => handleMoreLessCardKey(event, "less"));
  dom.moreLessRightCard.addEventListener("keydown", (event) => handleMoreLessCardKey(event, "more"));
  dom.moreLessRetry.addEventListener("click", () => startMoreLessGame(true));
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
  document.title = copy.titles?.[currentMode] || copy.title;
  dom.mainModes.setAttribute("aria-label", copy.modesAria);
  dom.languageSwitch.setAttribute("aria-label", copy.languageAria);
  dom.guessPanel.setAttribute("aria-label", copy.guessPanelAria);
  dom.moreLessShell.setAttribute("aria-label", copy.heroTitles?.[currentMode] || copy.moreLessAria);
  dom.inputLabel.textContent = copy.inputLabel;
  dom.input.placeholder = copy.inputPlaceholder;
  dom.boardShell.setAttribute("aria-label", copy.boardAria);
  dom.victoryModes.setAttribute("aria-label", copy.victoryModesAria);
  dom.heroTitle.textContent = copy.heroTitles?.[currentMode] || copy.heroTitle;
  dom.playAgain.textContent = copy.playAgain;
  dom.moreLessStreakLabel.textContent = copy.moreLess.streak;
  dom.moreLessBestLabel.textContent = copy.moreLess.best;
  dom.moreLessItemCountLabel.textContent = getDuelCountLabel();
  dom.moreLessRetry.textContent = copy.moreLess.tryAgain;

  dom.modeButtons.forEach((button) => {
    const modeKey = button.dataset.modeKey;
    button.textContent = copy.modes[modeKey];
    const activeClass = button.classList.contains("mode-choice") ? "mode-choice-active" : "mode-active";
    button.classList.toggle(activeClass, modeKey === currentMode);
    button.setAttribute("aria-pressed", String(modeKey === currentMode));
  });

  dom.modeLinks.forEach((link) => {
    const modeKey = link.dataset.modeLink;
    const isActive = modeKey === currentMode;
    link.textContent = copy.modes[modeKey] || link.textContent;
    link.classList.toggle("mode-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  dom.pageLinks.forEach((link) => {
    const pageKey = link.dataset.pageKey;
    link.textContent = copy.modes[pageKey] || link.textContent;
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

  if (
    renderExisting &&
    (champions.length > 0 || items.length > 0 || abilities.length > 0 || championStats.length > 0)
  ) {
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

function getSavedMode() {
  try {
    const requestedMode = new URLSearchParams(window.location.search).get("mode");
    if (PLAYABLE_MODES.includes(requestedMode)) {
      localStorage.setItem(MODE_KEY, requestedMode);
      return requestedMode;
    }

    const saved = localStorage.getItem(MODE_KEY);
    return PLAYABLE_MODES.includes(saved) ? saved : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

function isDuelMode(mode) {
  return DUEL_MODES.includes(mode);
}

function getDuelStorage(mode = currentMode) {
  return duelStorage[mode] || duelStorage.moreLess;
}

function getDuelState(mode = currentMode) {
  if (mode === "spellDuel") {
    return spellDuelState;
  }

  if (mode === "statDuel") {
    return statDuelState;
  }

  return moreLessState;
}

function setDuelState(nextState, mode = currentMode) {
  if (mode === "spellDuel") {
    spellDuelState = nextState;
    return;
  }

  if (mode === "statDuel") {
    statDuelState = nextState;
    return;
  }

  moreLessState = nextState;
}

function getDuelEntries(mode = currentMode) {
  if (mode === "spellDuel") {
    return abilities;
  }

  if (mode === "statDuel") {
    return championStats;
  }

  return items;
}

function getDuelById(mode = currentMode) {
  if (mode === "spellDuel") {
    return abilityById;
  }

  if (mode === "statDuel") {
    return championStatById;
  }

  return itemById;
}

function getDuelStatsByKey(mode = currentMode) {
  if (mode === "spellDuel") {
    return abilityStatsByKey;
  }

  if (mode === "statDuel") {
    return championStatStatsByKey;
  }

  return itemStatsByKey;
}

function getDuelCountLabel(mode = currentMode) {
  const labelKey = getDuelStorage(mode).countLabelKey;
  return getCopy().moreLess[labelKey];
}

function setMode(mode) {
  if (!PLAYABLE_MODES.includes(mode) || mode === currentMode) {
    return;
  }

  currentMode = mode;
  localStorage.setItem(MODE_KEY, mode);
  closeSuggestions();
  clearMessage();

  if (isDuelMode(currentMode)) {
    ensureMoreLessRound(false);
  }

  applyLanguage(false);
  render();
}

async function fetchJson(url, label) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${label} failed: ${response.status}`);
  }

  return response.json();
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

function normalizeItem(item) {
  const stats = Object.fromEntries(
    Object.entries(item.stats || {})
      .map(([key, value]) => [key, Number(value)])
      .filter(([, value]) => Number.isFinite(value) && value !== 0),
  );
  const statEntries = sortItemStats(Object.entries(stats));

  return {
    ...item,
    kind: "item",
    id: String(item.id),
    gold: Number(item.gold || 0),
    tags: toArray(item.tags),
    stats,
    statEntries,
  };
}

function normalizeAbility(ability) {
  const stats = Object.fromEntries(
    Object.entries(ability.stats || {})
      .map(([key, value]) => [key, Number(value)])
      .filter(([, value]) => Number.isFinite(value) && value !== 0),
  );
  const statEntries = sortItemStats(Object.entries(stats));

  return {
    ...ability,
    kind: "ability",
    id: String(ability.id),
    stats,
    statEntries,
  };
}

function normalizeChampionStat(champion) {
  const stats = Object.fromEntries(
    Object.entries(champion.stats || {})
      .map(([key, value]) => [key, Number(value)])
      .filter(([, value]) => Number.isFinite(value)),
  );
  const statEntries = sortItemStats(Object.entries(stats));

  return {
    ...champion,
    kind: "championStat",
    id: String(champion.id),
    stats,
    statEntries,
  };
}

function buildItemStatsByKey(list) {
  const statsByKey = new Map();

  list.forEach((item) => {
    Object.keys(item.stats).forEach((statKey) => {
      if (!statsByKey.has(statKey)) {
        statsByKey.set(statKey, []);
      }

      statsByKey.get(statKey).push(item);
    });
  });

  return statsByKey;
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

function restoreMoreLessState(mode = "moreLess") {
  const saved = readStorage(getDuelStorage(mode).saveKey, null);
  const best = readMoreLessBest(mode);

  const restoredState = {
    ...moreLessDefaults,
    ...saved,
    streak: Number(saved?.streak || 0),
    best,
    gameOver: Boolean(saved?.gameOver),
    revealed: Boolean(saved?.revealed),
    lastAnswer: saved?.lastAnswer || null,
    seenItemIds: normalizeSeenItemIds(saved?.seenItemIds, mode),
  };

  if (restoredState.revealed && !restoredState.gameOver) {
    restoredState.revealed = false;
    restoredState.lastAnswer = null;
  }

  restoredState.seenItemIds = addSeenItemIds(
    restoredState.seenItemIds,
    [restoredState.currentItemId, restoredState.challengerItemId],
    mode,
  );

  setDuelState(restoredState, mode);
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
  return pickRandom(pool);
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
  updateModeControls();
  syncModeView();

  if (isDuelMode(currentMode)) {
    renderMoreLess();
    return;
  }

  renderClassic();
}

function renderClassic() {
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

function syncModeView() {
  const isClassic = currentMode === "classic";
  const isDuel = isDuelMode(currentMode);
  document.body.dataset.mode = currentMode;
  dom.guessPanel.classList.toggle("hidden", !isClassic);
  dom.moreLessShell.classList.toggle("hidden", !isDuel);

  if (isDuel) {
    dom.boardShell.classList.add("hidden");
    dom.victoryModal.classList.add("hidden");
    closeSuggestions();
  }
}

function updateModeControls() {
  dom.modeButtons.forEach((button) => {
    const modeKey = button.dataset.modeKey;
    const activeClass = button.classList.contains("mode-choice") ? "mode-choice-active" : "mode-active";
    button.classList.toggle(activeClass, modeKey === currentMode);
    button.setAttribute("aria-pressed", String(modeKey === currentMode));
  });
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
  cell.className = `cell champion-cell ${isMatch ? "cell-match" : "champion-cell-neutral"}`;
  cell.dataset.label = getCopy().columns.champion;
  cell.style.setProperty("--cell-index", "0");
  cell.innerHTML = `
    <img src="${guess.icon}" alt="${guess.name}">
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
  if (currentMode !== "classic" || !state.solved || !target) {
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

function ensureMoreLessRound(renderAfterRepair = true, mode = currentMode) {
  if (!isDuelMode(mode) || !getDuelEntries(mode).length) {
    return;
  }

  if (!isValidMoreLessState(mode)) {
    startMoreLessGame(renderAfterRepair, mode);
  }
}

function startMoreLessGame(renderAfter = true, mode = currentMode) {
  window.clearTimeout(moreLessAdvanceTimer);
  const round = createMoreLessRound(null, [], [], mode);

  if (!round) {
    return;
  }

  const nextState = {
    ...moreLessDefaults,
    currentItemId: round.current.id,
    challengerItemId: round.challenger.id,
    statKey: round.statKey,
    best: readMoreLessBest(mode),
    seenItemIds: addSeenItemIds([], [round.current.id, round.challenger.id], mode),
  };

  setDuelState(nextState, mode);
  saveMoreLessState(mode);

  if (renderAfter && mode === currentMode) {
    render();
  }
}

function answerMoreLess(answer) {
  const mode = currentMode;
  const duelState = getDuelState(mode);
  const entryById = getDuelById(mode);

  if (!isDuelMode(mode) || duelState.gameOver || duelState.revealed) {
    return;
  }

  const currentItem = entryById.get(duelState.currentItemId);
  const challengerItem = entryById.get(duelState.challengerItemId);
  const statKey = duelState.statKey;

  if (!currentItem || !challengerItem || !statKey) {
    startMoreLessGame(true, mode);
    return;
  }

  const leftValue = currentItem.stats[statKey];
  const rightValue = challengerItem.stats[statKey];
  const correctAnswer = rightValue > leftValue ? "more" : "less";
  const correct = answer === correctAnswer;

  const nextState = {
    ...duelState,
    revealed: true,
    gameOver: !correct,
    seenItemIds: addSeenItemIds(duelState.seenItemIds, [currentItem.id, challengerItem.id], mode),
    lastAnswer: {
      choice: answer,
      correct,
    },
  };

  if (correct) {
    nextState.streak += 1;
    nextState.best = Math.max(nextState.best, nextState.streak);
    setDuelState(nextState, mode);
    saveMoreLessBest(mode);
    saveMoreLessState(mode);
    renderMoreLess();

    moreLessAdvanceTimer = window.setTimeout(() => {
      advanceMoreLessRound(true, mode);
    }, 920);
    return;
  }

  nextState.best = Math.max(nextState.best, nextState.streak);
  setDuelState(nextState, mode);
  saveMoreLessBest(mode);
  saveMoreLessState(mode);
  renderMoreLess();
}

function handleMoreLessCardKey(event, answer) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  answerMoreLess(answer);
}

function advanceMoreLessRound(renderAfter = true, mode = currentMode) {
  window.clearTimeout(moreLessAdvanceTimer);

  const duelState = getDuelState(mode);
  const entryById = getDuelById(mode);
  const previousCurrentId = duelState.currentItemId;
  const nextCurrent = entryById.get(duelState.challengerItemId);
  const seenItemIds = addSeenItemIds(
    duelState.seenItemIds,
    [duelState.currentItemId, duelState.challengerItemId],
    mode,
  );
  const round = nextCurrent
    ? createMoreLessRound(nextCurrent, [previousCurrentId], seenItemIds, mode)
    : createMoreLessRound(null, [], seenItemIds, mode);

  if (!round) {
    startMoreLessGame(renderAfter, mode);
    return;
  }

  const nextState = {
    ...duelState,
    currentItemId: round.current.id,
    challengerItemId: round.challenger.id,
    statKey: round.statKey,
    gameOver: false,
    revealed: false,
    lastAnswer: null,
    seenItemIds: addSeenItemIds(seenItemIds, [round.current.id, round.challenger.id], mode),
  };

  setDuelState(nextState, mode);
  saveMoreLessState(mode);

  if (renderAfter && mode === currentMode) {
    render();
  }
}

function renderMoreLess() {
  ensureMoreLessRound(false);

  const mode = currentMode;
  const duelState = getDuelState(mode);
  const entryById = getDuelById(mode);
  const currentItem = entryById.get(duelState.currentItemId);
  const challengerItem = entryById.get(duelState.challengerItemId);
  const statKey = duelState.statKey;

  if (!currentItem || !challengerItem || !statKey) {
    return;
  }

  const copy = getCopy();
  const answered = Boolean(duelState.lastAnswer);
  const correct = duelState.lastAnswer?.correct === true;
  const disabled = duelState.gameOver || duelState.revealed;
  const leftValue = currentItem.stats[statKey];
  const rightValue = challengerItem.stats[statKey];
  const correctAnswer = rightValue > leftValue ? "more" : "less";
  const getResultTone = (answer) => {
    if (!answered) {
      return "";
    }

    if (answer === correctAnswer) {
      return "correct";
    }

    return duelState.lastAnswer?.choice === answer ? "wrong" : "";
  };

  dom.moreLessStreak.textContent = duelState.streak;
  dom.moreLessBest.textContent = Math.max(duelState.best, duelState.streak);
  dom.moreLessItemCount.textContent = getDuelEntries(mode).length;
  dom.moreLessItemCountLabel.textContent = getDuelCountLabel(mode);
  dom.moreLessStage.classList.toggle("is-revealed", duelState.revealed);
  dom.moreLessStage.classList.toggle("is-correct", answered && correct);
  dom.moreLessStage.classList.toggle("is-wrong", answered && !correct);

  renderMoreLessItem(dom.moreLessLeftCard, currentItem, {
    side: "left",
    answer: "less",
    answerLabel: copy.moreLess.lowerAction,
    statKey,
    revealSelectedValue: true,
    disabled,
    picked: duelState.lastAnswer?.choice === "less",
    resultTone: getResultTone("less"),
  });
  renderMoreLessItem(dom.moreLessRightCard, challengerItem, {
    side: "right",
    answer: "more",
    answerLabel: copy.moreLess.higherAction,
    statKey,
    revealSelectedValue: duelState.revealed,
    disabled,
    picked: duelState.lastAnswer?.choice === "more",
    resultTone: getResultTone("more"),
  });

  dom.moreLessResult.classList.toggle("hidden", !duelState.gameOver);
  dom.moreLessResultTitle.textContent = copy.moreLess.gameOver;
  dom.moreLessResultCopy.textContent = copy.moreLess.resultCopy({
    streak: duelState.streak,
    best: duelState.best,
  });
}

function renderMoreLessItem(root, entry, options) {
  const copy = getCopy();
  root.innerHTML = "";
  root.className = `moreless-card moreless-card-${options.side}`;
  root.dataset.answer = options.answer;
  root.dataset.kind = entry.kind || "item";
  root.tabIndex = options.disabled ? -1 : 0;
  root.setAttribute("aria-disabled", String(options.disabled));
  root.setAttribute("aria-label", `${options.answerLabel}: ${getEntryName(entry)}`);

  if (options.resultTone) {
    root.classList.add(`moreless-card-${options.resultTone}`);
  }

  if (options.disabled) {
    root.classList.add("moreless-card-disabled");
  }

  if (options.picked) {
    root.classList.add("moreless-card-picked");
  }

  const head = document.createElement("div");
  head.className = "item-head";

  const image = document.createElement("img");
  image.src = entry.icon;
  image.alt = getEntryName(entry);

  const copyBlock = document.createElement("div");
  const title = document.createElement("h2");
  title.textContent = getEntryName(entry);

  const meta = document.createElement("p");
  meta.textContent = getEntryMeta(entry, copy);

  copyBlock.append(title, meta);
  head.append(image, copyBlock);

  const statList = document.createElement("div");
  statList.className = "item-stat-list";

  entry.statEntries
    .filter(([statKey]) => statKey === options.statKey)
    .forEach(([statKey, value]) => {
      const stat = document.createElement("div");
      stat.className = "item-stat";

      stat.classList.add("item-stat-focus");

      const label = document.createElement("span");
      label.textContent = getStatLabel(statKey);

      const amount = document.createElement("strong");
      const shouldHide = !options.revealSelectedValue;
      amount.textContent = shouldHide ? copy.moreLess.hiddenValue : formatStatValue(statKey, value);

      if (shouldHide) {
        stat.classList.add("item-stat-hidden");
      }

      stat.append(label, amount);
      statList.append(stat);
    });

  root.append(head, statList);
}

function isValidMoreLessState(mode = currentMode) {
  const duelState = getDuelState(mode);
  const entryById = getDuelById(mode);
  const currentItem = entryById.get(duelState.currentItemId);
  const challengerItem = entryById.get(duelState.challengerItemId);
  const statKey = duelState.statKey;

  if (!currentItem || !challengerItem || !statKey) {
    return false;
  }

  const leftValue = currentItem.stats[statKey];
  const rightValue = challengerItem.stats[statKey];
  return Number.isFinite(leftValue) && Number.isFinite(rightValue) && leftValue !== rightValue;
}

function createMoreLessRound(anchorItem = null, excludedIds = [], seenIds = [], mode = currentMode) {
  const seenSet = new Set(seenIds.map(String));

  if (anchorItem) {
    const anchoredRound =
      createMoreLessRoundForItem(anchorItem, new Set(excludedIds), seenSet, mode) ||
      createMoreLessRoundForItem(anchorItem, new Set(), seenSet, mode);

    if (anchoredRound) {
      return anchoredRound;
    }
  }

  const candidates = shuffleArray(getDuelEntries(mode));

  for (const item of candidates) {
    const round = createMoreLessRoundForItem(item, new Set(), seenSet, mode);

    if (round) {
      return round;
    }
  }

  return null;
}

function createMoreLessRoundForItem(currentItem, excludedIds, seenIds, mode = currentMode) {
  const statKeys = getPrioritizedComparableStats(currentItem, excludedIds, seenIds, mode);

  for (const statKey of statKeys) {
    const candidates = getPrioritizedItemCandidatesForStat(
      currentItem,
      statKey,
      excludedIds,
      seenIds,
      mode,
    );

    if (candidates.length > 0) {
      return {
        current: currentItem,
        challenger: pickRandom(candidates),
        statKey,
      };
    }
  }

  return null;
}

function getPrioritizedComparableStats(item, excludedIds, seenIds, mode = currentMode) {
  const statKeys = shuffleArray(Object.keys(item.stats));
  const freshStatKeys = statKeys.filter((statKey) => {
    const candidates = getItemCandidatesForStat(item, statKey, excludedIds, mode);
    return candidates.some((candidate) => !seenIds.has(candidate.id));
  });

  if (freshStatKeys.length > 0) {
    return freshStatKeys;
  }

  return statKeys.filter((statKey) => {
    return getItemCandidatesForStat(item, statKey, excludedIds, mode).length > 0;
  });
}

function getPrioritizedItemCandidatesForStat(item, statKey, excludedIds, seenIds, mode = currentMode) {
  const candidates = getItemCandidatesForStat(item, statKey, excludedIds, mode);
  const freshCandidates = candidates.filter((candidate) => !seenIds.has(candidate.id));

  return freshCandidates.length > 0 ? freshCandidates : candidates;
}

function getItemCandidatesForStat(item, statKey, excludedIds, mode = currentMode) {
  const leftValue = item.stats[statKey];

  return (getDuelStatsByKey(mode).get(statKey) || []).filter((candidate) => {
    return (
      candidate.id !== item.id &&
      !excludedIds.has(candidate.id) &&
      Number.isFinite(candidate.stats[statKey]) &&
      candidate.stats[statKey] !== leftValue
    );
  });
}

function normalizeSeenItemIds(value, mode = currentMode) {
  if (!Array.isArray(value)) {
    return [];
  }

  const entryById = getDuelById(mode);
  const ids = value
    .map((id) => String(id || ""))
    .filter((id) => id && (!entryById.size || entryById.has(id)));

  return [...new Set(ids)];
}

function addSeenItemIds(existingIds, nextIds, mode = currentMode) {
  const nextList = Array.isArray(nextIds) ? nextIds : [nextIds];
  return normalizeSeenItemIds([...normalizeSeenItemIds(existingIds, mode), ...nextList], mode);
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

function saveMoreLessState(mode = currentMode) {
  localStorage.setItem(getDuelStorage(mode).saveKey, JSON.stringify(getDuelState(mode)));
}

function readMoreLessBest(mode = currentMode) {
  const storage = getDuelStorage(mode);
  const stats = readStorage(storage.statsKey, null);
  const localBest = Number(stats?.best || 0);
  const cookieBest = Number(readCookie(storage.bestCookie) || 0);
  return Math.max(localBest, cookieBest);
}

function saveMoreLessBest(mode = currentMode) {
  const storage = getDuelStorage(mode);
  const duelState = getDuelState(mode);
  const best = Math.max(Number(duelState.best || 0), Number(duelState.streak || 0));
  localStorage.setItem(storage.statsKey, JSON.stringify({ best }));
  writeCookie(storage.bestCookie, String(best), 365);
}

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function readCookie(name) {
  const prefix = `${encodeURIComponent(name)}=`;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix));

  return match ? decodeURIComponent(match.slice(prefix.length)) : "";
}

function writeCookie(name, value, days) {
  const maxAge = Math.max(1, Number(days || 1)) * 24 * 60 * 60;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; SameSite=Lax`;
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

function getStatLabel(statKey) {
  return getCopy().statLabels[statKey] || statKey;
}

function formatStatValue(statKey, value) {
  const number = Number(value);
  const digits = preciseStats.has(statKey) ? 3 : 1;
  const formatted = Number.isInteger(number)
    ? String(number)
    : number.toFixed(digits).replace(/\.?0+$/, "");

  if (secondsStats.has(statKey)) {
    return `${formatted}s`;
  }

  return percentStats.has(statKey) ? `${formatted}%` : formatted;
}

function getEntryName(entry) {
  return getLocalizedText(entry.name);
}

function getEntryMeta(entry, copy = getCopy()) {
  if (entry.kind === "ability") {
    return `${getLocalizedText(entry.championName)} • ${entry.slot}`;
  }

  if (entry.kind === "championStat") {
    return getLocalizedText(entry.title) || copy.moreLess.championStats;
  }

  return `${entry.gold} ${copy.moreLess.gold}`;
}

function getLocalizedText(value) {
  if (value && typeof value === "object") {
    return value[currentLanguage] || value[DEFAULT_LANGUAGE] || Object.values(value)[0] || "";
  }

  return String(value || "");
}

function sortItemStats(entries) {
  return [...entries].sort(([leftKey], [rightKey]) => {
    const leftIndex = itemStatOrder.indexOf(leftKey);
    const rightIndex = itemStatOrder.indexOf(rightKey);
    const leftOrder = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
    const rightOrder = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return leftKey.localeCompare(rightKey);
  });
}

function pickRandom(values) {
  if (!values.length) {
    return null;
  }

  return values[randomIndex(values.length)];
}

function randomIndex(length) {
  if (window.crypto?.getRandomValues) {
    return window.crypto.getRandomValues(new Uint32Array(1))[0] % length;
  }

  return Math.floor(Math.random() * length);
}

function shuffleArray(values) {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
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
