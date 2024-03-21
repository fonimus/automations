import { test, expect } from '@playwright/test';

test('1parrainage', async ({ page }) => {
  expect(process.env.email).toBeDefined();
  expect(process.env.password).toBeDefined();

  await page.goto('https://www.1parrainage.com/offre_parrainage_Nuki.php?cat=1&catOK=1&texte=Nuki');

  const cookiesButton = page.getByRole('button', { name: 'Accept all' });
  const visible = await cookiesButton.isVisible()
  if (visible) {
    await cookiesButton.click();
  }
  await expect(page.getByRole('link', { name: 'Nuki', exact: true })).toBeVisible();

  const firstGodFather = await page.$$eval("body", (body) => {
    return body[0].querySelectorAll(".nameParrain").item(1)?.textContent?.replace(/\s/g, "");
  });
  if (firstGodFather === "fonimus" || firstGodFather === "lmuylle") {
    return
  }
  await page.getByRole('link', { name: 'Connexion' }).click();
  await page.locator('#username').click();
  await page.locator('#username').fill(process.env.email);
  await page.getByLabel('Mot de passe :').click();
  await page.getByLabel('Mot de passe :').fill(process.env.password);
  await page.getByRole('button', { name: 'Me connecter' }).click();
  await page.getByRole('link', { name: 'Gérer mes annonces de' }).click();
  await page.locator('p').filter({ hasText: 'Code REFEKU8KKA7FR pour avoir' }).getByRole('link').click();
  await page.getByRole('link', { name: 'Modifier' }).click();
  await page.getByRole('button', { name: 'Envoyer' }).click();
});
