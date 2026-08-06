const { expect, test } = require("@playwright/test");

test("classic flow uses suggestions and victory menu", async ({ page }) => {
  await page.goto("http://127.0.0.1:4173/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("#page-title")).toHaveText("Guess the champion");
  await expect(page.locator(".board-heading").first()).toHaveText("Champion");
  await expect(page.locator(".primary-button")).toHaveCount(0);
  await expect(page.locator("#next-round")).toHaveCount(0);

  await page.locator("[data-language='ru']").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.locator("#page-title")).toHaveText("Угадай чемпиона");
  await expect(page.locator("#champion-input")).toHaveAttribute("placeholder", "Введите имя чемпиона");
  await expect(page.locator(".board-heading").first()).toHaveText("Чемпион");

  await page.locator("[data-language='en']").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("#page-title")).toHaveText("Guess the champion");

  await page.locator("#champion-input").fill("'");
  await expect(page.locator(".suggestion")).toHaveCount(173);
  await expect(page.locator(".suggestion").first()).toContainText("Aatrox");

  await page.keyboard.press("Enter");
  await expect(page.locator(".guess-row")).toHaveCount(1);

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
