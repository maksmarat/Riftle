const { expect, test } = require("@playwright/test");

const BASE_URL = process.env.BASE_URL || "http://localhost:4173";
const CLASSIC_ITEM_COUNT = "194";
const FORBIDDEN_CLASSIC_ITEMS = [
  "Atma's Reckoning",
  "Cloak of Starry Night",
  "Crown of the Shattered Queen",
  "Cruelty",
  "Flesheater",
  "Gambler's Blade",
  "Guardian's Blade",
  "Guardian's Hammer",
  "Guardian's Horn",
  "Guardian's Orb",
  "Shield of Molten Stone",
  "Sword of Blossoming Dawn",
  "Sword of the Divine",
];
const UPGRADED_BOOT_NAMES = [
  "Armored Advance",
  "Chainlaced Crushers",
  "Crimson Lucidity",
  "Gunmetal Greaves",
  "Immortal Path",
  "Spellslinger's Shoes",
  "Swiftmarch",
];

async function auditClassicItems(page) {
  return page.evaluate(async (forbiddenItems) => {
    const response = await fetch("./data/items.json");
    const data = await response.json();
    const names = new Set(data.items.map((item) => item.name));

    return {
      forbiddenItems: forbiddenItems.filter((name) => names.has(name)),
      longIds: data.items.filter((item) => String(item.id).length > 4).map((item) => item.name),
    };
  }, FORBIDDEN_CLASSIC_ITEMS);
}

async function auditRandomBuildForUpgradedBoots(page) {
  const texts = await page.locator("#build-items .loot-card, #build-slots .slot-card").allTextContents();

  return UPGRADED_BOOT_NAMES.filter((name) => texts.some((text) => text.includes(name)));
}

async function expectNoAdjacentRouletteDuplicates(page) {
  const names = await page.locator("#buy-wheel-track .roulette-card strong").allTextContents();
  expect(names.length).toBeGreaterThan(0);

  for (let index = 1; index < names.length; index += 1) {
    expect(names[index]).not.toBe(names[index - 1]);
  }
}

async function seedDuelState(page, mode, storageKey, state) {
  await page.goto(`${BASE_URL}/`);
  await page.evaluate(
    ({ storageKey, state }) => {
      localStorage.clear();
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          ...state,
          streak: 0,
          best: 0,
          gameOver: false,
          revealed: false,
          lastAnswer: null,
          seenItemIds: [state.currentItemId, state.challengerItemId],
        }),
      );
    },
    { storageKey, state },
  );
  await page.goto(`${BASE_URL}/?mode=${mode}`);
}

test("classic flow uses suggestions and victory menu", async ({ page }) => {
  await page.goto(`${BASE_URL}/`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("#page-title")).toHaveText("Guess the champion");
  await expect(page.locator("#hero-eyebrow")).toHaveCount(0);
  await expect(page.locator("#board-shell")).toBeHidden();
  await expect(page.locator("#moreless-shell")).toBeHidden();
  await expect(page.locator(".primary-button")).toHaveCount(0);
  await expect(page.locator("#next-round")).toHaveCount(0);
  await expect(page.locator("[data-mode-key='ability']")).toHaveCount(0);
  await expect(page.locator("[data-mode-key='quote']")).toHaveCount(0);
  await expect(page.locator("[data-mode-key='splash']")).toHaveCount(0);
  await expect(page.locator("[data-mode-link='moreLess']")).toHaveAttribute("href", "./?mode=moreLess");
  await expect(page.locator("[data-mode-link='spellDuel']")).toHaveAttribute("href", "./?mode=spellDuel");
  await expect(page.locator("[data-mode-link='statDuel']")).toHaveAttribute("href", "./?mode=statDuel");
  await expect(page.locator("[data-page-key='riftRun']")).toHaveAttribute("href", "./rift-run.html");

  await page.locator("[data-language='ru']").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.locator("#page-title")).toHaveText("Угадай чемпиона");
  await expect(page.locator("[data-page-key='random']")).toHaveText("Рандом");
  await expect(page.locator("#champion-input")).toHaveAttribute("placeholder", "Введите имя чемпиона");
  await expect(page.locator("#board-shell")).toBeHidden();

  await page.locator("[data-language='en']").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("#page-title")).toHaveText("Guess the champion");

  await page.locator("#champion-input").fill("'");
  await expect(page.locator(".suggestion")).toHaveCount(173);
  await expect(page.locator(".suggestion").first()).toContainText("Aatrox");

  await page.keyboard.press("Enter");
  await expect(page.locator(".guess-row")).toHaveCount(1);
  await expect(page.locator(".champion-cell").first()).not.toHaveClass(/cell-miss/);
  await expect(page.locator(".champion-cell span")).toHaveCount(0);
  await page.waitForTimeout(700);
  const championIconBox = await page.locator(".champion-cell img").first().boundingBox();
  expect(Math.abs(championIconBox.width - championIconBox.height)).toBeLessThan(1);
  expect(championIconBox.width).toBeGreaterThan(80);
  await expect(page.locator("#board-shell")).toBeVisible();
  await expect(page.locator(".board-heading").first()).toHaveText("Champion");
  await expect(page.locator("#message")).not.toContainText(/older|newer|release year/i);

  const alreadySolved = await page.locator("#victory-modal:not(.hidden)").count();
  if (!alreadySolved) {
    const targetName = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem("riftle-classic-state-v1")).targetName;
    });

    await page.locator("#champion-input").fill(targetName);
    await page.keyboard.press("Enter");
  }

  await expect(page.locator("#victory-modal")).toBeVisible();
  await expect(page.locator("#play-again")).toHaveText("Play again");

  await page.locator("#play-again").click();
  await expect(page.locator("#victory-modal")).toHaveClass(/hidden/);
  await expect(page.locator("#champion-input")).toBeEnabled();
});

test("item duel mode renders item comparison", async ({ page }) => {
  await page.goto(`${BASE_URL}/`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.locator("[data-mode-link='moreLess']").click();

  await expect(page.locator("#page-title")).toHaveText("Item Duel");
  await expect(page.locator("#guess-panel")).toBeHidden();
  await expect(page.locator("#board-shell")).toBeHidden();
  await expect(page.locator("#moreless-shell")).toBeVisible();
  await expect(page.locator("#moreless-item-count")).toHaveText(CLASSIC_ITEM_COUNT);
  await expect(page.locator("#moreless-left-card img")).toBeVisible();
  await expect(page.locator("#moreless-right-card img")).toBeVisible();
  await expect(page.locator("#moreless-left-card .item-stat")).toHaveCount(1);
  await expect(page.locator("#moreless-right-card .item-stat")).toHaveCount(1);
  await expect(page.locator("#moreless-right-card .item-stat-focus strong")).toHaveText("???");
  await expect(page.locator("#moreless-left-card")).toHaveAttribute("role", "button");
  await expect(page.locator("#moreless-right-card")).toHaveAttribute("role", "button");
  await expect(await auditClassicItems(page)).toEqual({ forbiddenItems: [], longIds: [] });

  const previousState = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem("riftle-moreless-state-v1"));
  });
  const correctSide = await page.evaluate(async () => {
    const state = JSON.parse(localStorage.getItem("riftle-moreless-state-v1"));
    const response = await fetch("./data/items.json");
    const data = await response.json();
    const itemById = new Map(data.items.map((item) => [String(item.id), item]));
    const current = itemById.get(state.currentItemId);
    const challenger = itemById.get(state.challengerItemId);

    return challenger.stats[state.statKey] > current.stats[state.statKey] ? "right" : "left";
  });

  await page.locator(`#moreless-${correctSide}-card`).click();

  await expect(page.locator("#moreless-right-card .item-stat-focus strong")).not.toHaveText("???");

  await page.waitForTimeout(1100);

  const nextState = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem("riftle-moreless-state-v1"));
  });

  expect(nextState.currentItemId).toBe(previousState.challengerItemId);
  expect(nextState.challengerItemId).not.toBe(previousState.currentItemId);
  expect(nextState.seenItemIds).toContain(previousState.currentItemId);
  expect(nextState.seenItemIds).toContain(previousState.challengerItemId);
  expect(nextState.seenItemIds).toContain(nextState.challengerItemId);

  const repeatCheck = await page.evaluate(
    async ({ previousState, nextState }) => {
      const response = await fetch("./data/items.json");
      const data = await response.json();
      const itemById = new Map(data.items.map((item) => [String(item.id), item]));
      const current = itemById.get(nextState.currentItemId);
      const previousSeenIds = new Set(previousState.seenItemIds || []);
      const leftValue = current.stats[nextState.statKey];
      const allCandidates = data.items.filter((item) => {
        const id = String(item.id);

        return (
          id !== nextState.currentItemId &&
          Number.isFinite(Number(item.stats[nextState.statKey])) &&
          item.stats[nextState.statKey] !== leftValue
        );
      });
      const withoutPreviousCurrent = allCandidates.filter((item) => {
        return String(item.id) !== previousState.currentItemId;
      });
      const candidates = withoutPreviousCurrent.length > 0 ? withoutPreviousCurrent : allCandidates;
      const freshCandidates = candidates.filter((item) => !previousSeenIds.has(String(item.id)));

      return {
        freshCount: freshCandidates.length,
        selectedWasFresh: !previousSeenIds.has(nextState.challengerItemId),
      };
    },
    { previousState, nextState },
  );

  if (repeatCheck.freshCount > 0) {
    expect(repeatCheck.selectedWasFresh).toBe(true);
  }
});

test("spell duel mode renders ability comparison", async ({ page }) => {
  await page.goto(`${BASE_URL}/`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.locator("[data-mode-link='spellDuel']").click();

  await expect(page.locator("#page-title")).toHaveText("Spell Duel");
  await expect(page.locator("#guess-panel")).toBeHidden();
  await expect(page.locator("#board-shell")).toBeHidden();
  await expect(page.locator("#moreless-shell")).toBeVisible();
  await expect(page.locator("#moreless-item-count")).toHaveText("692");
  await expect(page.locator("#moreless-item-count-label")).toHaveText("abilities");
  await expect(page.locator("#moreless-left-card img")).toBeVisible();
  await expect(page.locator("#moreless-right-card img")).toBeVisible();
  await expect(page.locator("#moreless-left-card .item-stat")).toHaveCount(1);
  await expect(page.locator("#moreless-right-card .item-stat")).toHaveCount(1);
  await expect(page.locator("#moreless-right-card .item-stat-focus strong")).toHaveText("???");
  await expect(page.locator("#moreless-left-card")).toHaveAttribute("data-kind", "ability");
  await expect(page.locator("#moreless-right-card")).toHaveAttribute("data-kind", "ability");

  const previousState = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem("riftle-spell-duel-state-v1"));
  });
  const correctSide = await page.evaluate(async () => {
    const state = JSON.parse(localStorage.getItem("riftle-spell-duel-state-v1"));
    const response = await fetch("./data/abilities.json");
    const data = await response.json();
    const abilityById = new Map(data.abilities.map((ability) => [String(ability.id), ability]));
    const current = abilityById.get(state.currentItemId);
    const challenger = abilityById.get(state.challengerItemId);

    return challenger.stats[state.statKey] > current.stats[state.statKey] ? "right" : "left";
  });

  await page.locator(`#moreless-${correctSide}-card`).click();

  await expect(page.locator("#moreless-right-card .item-stat-focus strong")).not.toHaveText("???");

  await page.waitForTimeout(1100);

  const nextState = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem("riftle-spell-duel-state-v1"));
  });

  expect(nextState.currentItemId).toBe(previousState.challengerItemId);
  expect(nextState.challengerItemId).not.toBe(previousState.currentItemId);
});

test("stat duel mode renders champion stat comparison", async ({ page }) => {
  await page.goto(`${BASE_URL}/`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.locator("[data-mode-link='statDuel']").click();

  await expect(page.locator("#page-title")).toHaveText("Stat Duel");
  await expect(page.locator("#guess-panel")).toBeHidden();
  await expect(page.locator("#board-shell")).toBeHidden();
  await expect(page.locator("#moreless-shell")).toBeVisible();
  await expect(page.locator("#moreless-item-count")).toHaveText("173");
  await expect(page.locator("#moreless-item-count-label")).toHaveText("champions");
  await expect(page.locator("#moreless-left-card img")).toBeVisible();
  await expect(page.locator("#moreless-right-card img")).toBeVisible();
  await expect(page.locator("#moreless-left-card .item-stat")).toHaveCount(1);
  await expect(page.locator("#moreless-right-card .item-stat")).toHaveCount(1);
  await expect(page.locator("#moreless-right-card .item-stat-focus strong")).toHaveText("???");
  await expect(page.locator("#moreless-left-card")).toHaveAttribute("data-kind", "championStat");
  await expect(page.locator("#moreless-right-card")).toHaveAttribute("data-kind", "championStat");

  const statAudit = await page.evaluate(async () => {
    const response = await fetch("./data/champion-stats.json");
    const data = await response.json();
    const keys = new Set();
    data.champions.forEach((champion) => {
      Object.keys(champion.stats).forEach((key) => keys.add(key));
    });

    return {
      count: data.champions.length,
      hasHealth18: keys.has("healthLevel18"),
      hasAttackDamageGrowth: keys.has("attackDamageGrowth"),
      hasAttackRange: keys.has("attackRange"),
      attackDamageGrowthValues: new Set(
        data.champions.map((champion) => champion.stats.attackDamageGrowth),
      ).size,
    };
  });

  expect(statAudit).toEqual({
    count: 173,
    hasHealth18: true,
    hasAttackDamageGrowth: true,
    hasAttackRange: true,
    attackDamageGrowthValues: 34,
  });

  const previousState = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem("riftle-stat-duel-state-v1"));
  });
  const correctSide = await page.evaluate(async () => {
    const state = JSON.parse(localStorage.getItem("riftle-stat-duel-state-v1"));
    const response = await fetch("./data/champion-stats.json");
    const data = await response.json();
    const championById = new Map(data.champions.map((champion) => [String(champion.id), champion]));
    const current = championById.get(state.currentItemId);
    const challenger = championById.get(state.challengerItemId);

    return challenger.stats[state.statKey] > current.stats[state.statKey] ? "right" : "left";
  });

  await page.locator(`#moreless-${correctSide}-card`).click();
  await expect(page.locator("#moreless-right-card .item-stat-focus strong")).not.toHaveText("???");

  await page.waitForTimeout(1100);

  const nextState = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem("riftle-stat-duel-state-v1"));
  });

  expect(nextState.currentItemId).toBe(previousState.challengerItemId);
  expect(nextState.challengerItemId).not.toBe(previousState.currentItemId);
});

test("duel result highlight follows the left correct answer", async ({ page }) => {
  const leftCorrectCases = [
    {
      mode: "moreLess",
      storageKey: "riftle-moreless-state-v1",
      title: "Item Duel",
      state: { currentItemId: "2522", challengerItemId: "3113", statKey: "abilityPower" },
    },
    {
      mode: "spellDuel",
      storageKey: "riftle-spell-duel-state-v1",
      title: "Spell Duel",
      state: { currentItemId: "Aatrox-W", challengerItemId: "Aatrox-Q", statKey: "abilityCooldown" },
    },
    {
      mode: "statDuel",
      storageKey: "riftle-stat-duel-state-v1",
      title: "Stat Duel",
      state: { currentItemId: "Aatrox", challengerItemId: "Ahri", statKey: "attackDamageLevel1" },
    },
  ];

  for (const config of leftCorrectCases) {
    await seedDuelState(page, config.mode, config.storageKey, config.state);

    await expect(page.locator("#page-title")).toHaveText(config.title);
    await expect(page.locator("#moreless-right-card .item-stat-focus strong")).toHaveText("???");

    await page.locator("#moreless-left-card").click();

    await expect(page.locator("#moreless-left-card")).toHaveClass(/moreless-card-correct/, { timeout: 500 });
    await expect(page.locator("#moreless-right-card")).not.toHaveClass(/moreless-card-correct/, { timeout: 500 });
    await expect(page.locator("#moreless-right-card .item-stat-focus strong")).not.toHaveText("???", { timeout: 500 });
  }
});

test("rift run starts, scores an encounter, and resumes active runs", async ({ page }) => {
  await page.goto(`${BASE_URL}/rift-run.html`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page.locator(".mode-active")).toHaveText("Rift Run");
  await expect(page.locator("#rift-run-root")).toContainText("Rift Run");
  await expect(page.locator("[data-action='start']")).toBeVisible();

  await page.locator("[data-action='start']").click();
  await expect(page.locator(".run-hud")).toBeVisible();
  await expect(page.locator(".rift-run-board")).toBeVisible();

  const correctAnswer = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem("riftle.riftRun.v1.activeRun")).currentChallenge.correctAnswer;
  });

  await page.locator(`[data-answer='${correctAnswer}']`).click();
  await expect(page.locator(".rift-run-feedback")).toBeVisible();
  await expect(page.locator(".rift-run-feedback")).toContainText("Correct");

  await page.reload();
  await expect(page.locator("[data-action='resume']")).toBeVisible();
  await page.locator("[data-action='resume']").click();
  await expect(page.locator(".rift-run-feedback")).toBeVisible();
});

test("random tools page rolls roles, build, and next item", async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto(`${BASE_URL}/random.html`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page.locator("#random-title")).toHaveText("Random Tools");
  await expect(await auditClassicItems(page)).toEqual({ forbiddenItems: [], longIds: [] });
  await expect(page.locator(".modes [data-mode-link]")).toHaveCount(6);
  await expect(page.locator("[data-mode-link='classic']")).toHaveText("Classic");
  await expect(page.locator("[data-mode-link='moreLess']")).toHaveText("Item Duel");
  await expect(page.locator("[data-mode-link='spellDuel']")).toHaveText("Spell Duel");
  await expect(page.locator("[data-mode-link='statDuel']")).toHaveText("Stat Duel");
  await expect(page.locator("[data-mode-link='riftRun']")).toHaveText("Rift Run");
  await expect(page.locator("[data-mode-link='random']")).toHaveClass(/mode-active/);
  await expect(page.locator("[data-spin-speed='1']")).toHaveClass(/speed-chip-active/);
  await expect(page.locator("#build-items .loot-card")).toHaveCount(6);
  await expect(page.locator("#build-summoners .summoner-card")).toHaveCount(2);
  await expect(page.locator("#build-slots .slot-card")).toHaveCount(1);
  await expect(page.locator("#build-slots .slot-card")).toContainText("Boot slot");
  expect(await auditRandomBuildForUpgradedBoots(page)).toEqual([]);
  await expectNoAdjacentRouletteDuplicates(page);

  await page.locator("[data-language='ru']").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.locator("#random-title")).toHaveText("Рандом для игры");
  await expect(page.locator("[data-mode-link='classic']")).toHaveText("Классика");
  await expect(page.locator("[data-mode-link='statDuel']")).toHaveText("Статы");
  await expect(page.locator("[data-mode-link='riftRun']")).toHaveText("Rift Run");
  await expect(page.locator("[data-mode-link='random']")).toHaveText("Рандом");

  const names = ["Maks", "Dima", "Lena", "Ari", "Niko"];
  for (const [index, name] of names.entries()) {
    await page.locator(".player-input").nth(index).fill(name);
  }

  await page.locator("#roll-roles").click();
  await expect(page.locator(".role-badge-filled")).toHaveCount(5, { timeout: 8000 });

  const assignedRoles = await page.locator(".role-badge-filled").allTextContents();
  expect(new Set(assignedRoles).size).toBe(5);

  await page.locator("[data-language='en']").click();
  await page.locator("[data-build-role='jungle']").click();
  await expect(page.locator("[data-build-role='jungle']")).toHaveClass(/role-chip-active/);
  await expect(page.locator("#build-items .loot-card")).toHaveCount(6);
  await expect(page.locator("#build-slots .slot-card")).toHaveCount(0);
  expect(await auditRandomBuildForUpgradedBoots(page)).toEqual([]);

  const summoners = await page.locator("#build-summoners .summoner-card").allTextContents();
  expect(summoners.join(" ")).toContain("Smite");

  await page.locator("[data-build-role='support']").click();
  await expect(page.locator("[data-build-role='support']")).toHaveClass(/role-chip-active/);
  await expect(page.locator("#build-items .loot-card")).toHaveCount(6);
  await expect(page.locator("#build-slots .slot-card")).toHaveCount(0);
  expect(await auditRandomBuildForUpgradedBoots(page)).toEqual([]);

  const supportItems = await page.locator("#build-items .loot-card").allTextContents();
  expect(supportItems.some((text) => /Bloodsong|Celestial Opposition|Dream Maker|Solstice Sleigh|Zaz'Zak/.test(text))).toBe(true);

  await page.locator("[data-spin-speed='4']").click();
  await expect(page.locator("[data-spin-speed='4']")).toHaveClass(/speed-chip-active/);
  await page.locator("#spin-buy").click();
  await expect(page.locator("#buy-result strong")).not.toHaveText("", { timeout: 3000 });
  await expect(page.locator(".roulette-marker")).toBeVisible();
  await expectNoAdjacentRouletteDuplicates(page);

  const firstBuyResult = await page.locator("#buy-result strong").textContent();
  await page.locator("#spin-buy").click();
  await expect(page.locator("#buy-result strong")).not.toHaveText("", { timeout: 3000 });
  const secondBuyResult = await page.locator("#buy-result strong").textContent();

  expect(secondBuyResult).not.toBe(firstBuyResult);
  await expectNoAdjacentRouletteDuplicates(page);
});

test("direct duel pages open their modes on static hosting", async ({ page }) => {
  await page.goto(`${BASE_URL}/item-duel.html`);
  await expect(page.locator("#page-title")).toHaveText("Item Duel");
  await expect(page.locator("#moreless-item-count")).toHaveText(CLASSIC_ITEM_COUNT);

  await page.goto(`${BASE_URL}/spell-duel.html`);
  await expect(page.locator("#page-title")).toHaveText("Spell Duel");
  await expect(page.locator("#moreless-item-count")).toHaveText("692");

  await page.goto(`${BASE_URL}/stat-duel.html`);
  await expect(page.locator("#page-title")).toHaveText("Stat Duel");
  await expect(page.locator("#moreless-item-count")).toHaveText("173");
  await expect(page.locator("#moreless-item-count-label")).toHaveText("champions");

  await page.goto(`${BASE_URL}/rift-run.html`);
  await expect(page.locator(".mode-active")).toHaveText("Rift Run");
  await expect(page.locator("[data-action='start']")).toBeVisible();
});
