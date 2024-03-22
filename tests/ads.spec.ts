import {expect, Locator, test} from '@playwright/test';


type Account = {
    pseudo: string,
    email: string,
    password: string
}

expect(process.env.ACCOUNTS).toBeDefined();
const accounts: Account[] = []
for (let account of process.env.ACCOUNTS.split(",")) {
    const [pseudo, email, password] = account.split("|")
    accounts.push({pseudo, email, password})
}
const pseudoList = accounts.map(a => a.pseudo);

const domain = "www.1parrainage.com";

const adNames = ["Nuki", "Boursobank"];

async function findAd(ads: Array<Locator>, adName: string) {
    for (const ad of ads) {
        const imageSource = await ad.locator("..").locator("..").locator("..").locator("div").first().locator("img").getAttribute("src")
        if (imageSource.toLowerCase().includes(adName.toLowerCase())) {
            return ad
        }
    }
}

for (let adName of adNames) {
    test(`1parrainage - ${adName}`, async ({page, context}) => {
        await context.addCookies([{
            domain,
            httpOnly: false,
            name: "euconsent-v2",
            path: "/",
            sameSite: "Lax",
            secure: true,
            value: "CP70rUAP70rUABcAJBENAtEgAP_gAEPgAAqIIyQLQABAALAAeABUADIAIAAVAAtgBoAGoARAAmgBbgDCAMQAcoBBgEIAJ0AXAAxwB6AD9AIGAQgAjoBPACrgF1AMCAYQA0ABogDXgG0AR6Al4BMQCfwFGALmAXmAxcBjIDJAHUAQHAjICMkBcABYADwAKgAggBoAGoARAAxAB-AEIAP0AhABFgCOgFXALqAaIA14BtAEegJiAXmAwQBkgAA.x_e5N3A.4YpAMgBZAC6AGwAYgBxQD1gJLAeqBEQCUQEsQJagTOAwsBzIDpwJDIUFhQYCs8FmYLRwW-gudBeSDFIAJgA4AEAASACEAEwATAAwAIAAkA",
        }])

        await page.goto(`https://${domain}/offre_parrainage_${adName}.php`);

        await expect(page.getByRole('link', {
            name: adName,
            exact: true
        })).toBeVisible();

        const firstGodFather = await page.$$eval("body", (body) => {
            return body[0].querySelectorAll(".nameParrain").item(1)?.textContent?.replace(/\s/g, "");
        });
        if (pseudoList.includes(firstGodFather)) {
            return
        }

        for (let account of accounts) {
            await page.getByRole('link', {name: 'Connexion'}).click();
            await page.locator('#username').click();
            await page.locator('#username').fill(account.email);
            await page.getByLabel('Mot de passe :').click();
            await page.getByLabel('Mot de passe :').fill(account.password);
            await page.getByRole('button', {name: 'Me connecter'}).click();
            await page.getByRole('link', {name: 'Gérer mes annonces de parrainage'}).click();
            const ads = await page.getByRole('link', {name: 'Voir plus'}).all();
            const ad = await findAd(ads, adName);
            if (!ad) {
                expect(ad, `Should find add for name ${adName}`).toBeDefined();
            }
            await ad.click()
            await page.getByRole('link', {name: 'Modifier'}).click();
            try {
                await page.getByRole('button', {name: 'Envoyer'}).click();
                // if found button everything is ok
                return
            } catch (e) {
                // next account
                await page.getByRole('link', {name: 'Quitter'}).first().click();
            }
        }
    });
}