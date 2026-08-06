const { expect, test } = require("@playwright/test");

const BASE_URL = process.env.BASE_URL || "http://localhost:4173";

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
  await expect(page.locator("#moreless-item-count")).toHaveText("233");
  await expect(page.locator("#moreless-left-card img")).toBeVisible();
  await expect(page.locator("#moreless-right-card img")).toBeVisible();
  await expect(page.locator("#moreless-left-card .item-stat")).toHaveCount(1);
  await expect(page.locator("#moreless-right-card .item-stat")).toHaveCount(1);
  await expect(page.locator("#moreless-right-card .item-stat-focus strong")).toHaveText("???");
  await expect(page.locator("#moreless-left-card")).toHaveAttribute("role", "button");
  await expect(page.locator("#moreless-right-card")).toHaveAttribute("role", "button");

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

test("random tools page rolls roles, build, and next item", async ({ page }) => {
  await page.goto(`${BASE_URL}/random.html`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page.locator("#random-title")).toHaveText("Random Tools");
  await expect(page.locator("#build-items .loot-card")).toHaveCount(6);
  await expect(page.locator("#build-summoners .summoner-card")).toHaveCount(2);

  await page.locator("[data-language='ru']").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.locator("#random-title")).toHaveText("Рандом для игры");

  const names = ["Maks", "Dima", "Lena", "Ari", "Niko"];
  for (const [index, name] of names.entries()) {
    await page.locator(".player-input").nth(index).fill(name);
  }

  await page.locator("#roll-roles").click();
  await expect(page.locator(".role-badge-filled")).toHaveCount(5);

  const assignedRoles = await page.locator(".role-badge-filled").allTextContents();
  expect(new Set(assignedRoles).size).toBe(5);

  await page.locator("[data-language='en']").click();
  await page.locator("[data-build-role='jungle']").click();
  await expect(page.locator("[data-build-role='jungle']")).toHaveClass(/role-chip-active/);
  await expect(page.locator("#build-items .loot-card")).toHaveCount(6);

  const summoners = await page.locator("#build-summoners .summoner-card").allTextContents();
  expect(summoners.join(" ")).toContain("Smite");

  await page.locator("#spin-buy").click();
  await expect(page.locator("#buy-result strong")).not.toHaveText("", { timeout: 3000 });
  await expect(page.locator(".roulette-marker")).toBeVisible();
});

test("direct duel pages open their modes on static hosting", async ({ page }) => {
  await page.goto(`${BASE_URL}/item-duel.html`);
  await expect(page.locator("#page-title")).toHaveText("Item Duel");
  await expect(page.locator("#moreless-item-count")).toHaveText("233");

  await page.goto(`${BASE_URL}/spell-duel.html`);
  await expect(page.locator("#page-title")).toHaveText("Spell Duel");
  await expect(page.locator("#moreless-item-count")).toHaveText("692");
});
