import {expect, Locator, test} from '@playwright/test';

type Account = {
    pseudo: string,
    email: string,
    password: string
}

expect(process.env.ACCOUNTS).toBeDefined();
const accounts: Account[] = []
for (let account of process.env.ACCOUNTS.split(",")) {
    const [pseudo, email, password] = account.split(":")
    accounts.push({pseudo, email, password})
}
const pseudoList = accounts.map(a => a.pseudo);

const domain = "www.1parrainage.com";

const adNames = ["Nuki", "Boursobank", "Boursorama Banque"];

async function findAd(ads: Array<Locator>, adName: string) {
    const ad = undefined
    for (const ad of ads) {
        const imageSource = await ad.locator("..").locator("..").locator("..").locator("div").first().locator("img").getAttribute("src")
        if (imageSource.toLowerCase().includes(adName.toLowerCase())) {
            return ad
        }
    }
    expect(ad, `Should find add image for name ${adName}`).toBeDefined();
}

test.use({locale: 'fr-FR'});

for (let adName of adNames) {
    test(`1parrainage - ${adName}`, async ({page, context}) => {
        await page.goto(`https://${domain}/offre_parrainage_${adName.replace(" ", "-")}.php`);

        try {
            await page.getByRole('button', {name: 'Tout accepter et continuer'}).click();
        } catch (e) {
            // nothing to do
        }

        const closeButtons = await page.getByTitle('close').all();
        for (let closeButton of closeButtons) {
            await closeButton.click()
        }

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
            let imageName = adName;
            if (adName === "Boursorama Banque") {
                imageName = "Boursobank";
            }
            const ad = await findAd(ads, imageName);
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
