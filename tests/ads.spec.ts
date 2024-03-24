import {expect, Locator, Page, test} from '@playwright/test';

const domain = "www.1parrainage.com";

const adNames = ["Nuki", "Boursobank", "Boursorama Banque"];
const imageNames = {"Boursorama Banque": "Boursobank"}

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

async function findAd(ads: Array<Locator>, adName: string) {
    for (const ad of ads) {
        const imageSource = await ad.locator("..").locator("..").locator("..").locator("div").first().locator("img").getAttribute("src")
        if (imageSource.toLowerCase().includes(adName.toLowerCase())) {
            return ad
        }
    }
    return undefined
}

async function closeCookiesBanner(page: Page) {
    try {
        await page.getByRole('button', {name: 'Tout accepter et continuer'}).click();
        return
    } catch (e) {
        // nothing to do
    }
    await page.evaluate(() => {
        document.querySelector("#sd-cmp")?.remove();
    });
}

test.use({locale: 'fr-FR'});

for (let adName of adNames) {
    test(`1parrainage - ${adName}`, async ({page}) => {
        await page.goto(`https://${domain}/offre_parrainage_${adName.replace(" ", "-")}.php`);

        await closeCookiesBanner(page);

        await expect(page.getByRole('link', {
            name: adName,
            exact: true
        })).toBeVisible();

        const firstGodFather = await page.evaluate(() => {
            const ads = document.querySelectorAll(".coupon-list")
            if (ads.length) {
                for (let i = 0; i < ads.length; i++) {
                    const ad = ads.item(i);
                    const pseudo = ad.querySelectorAll(".nameParrain")?.item(1)?.textContent?.replace(/\s/g, "");
                    if (pseudo) {
                        let boosted = false;
                        const images = ad.querySelectorAll("img");
                        if (images.length) {
                            for (let i = 0; i < images.length; i++) {
                                const image = images.item(i);
                                if (image?.getAttribute("src")?.includes("annonceboostee")) {
                                    boosted = true;
                                }
                            }
                        }
                        if (boosted) {
                            continue
                        }
                        return pseudo;
                    }
                }
            }
        });

        if (pseudoList.includes(firstGodFather)) {
            console.log(`[${adName}] First pseudo is [${firstGodFather}] - nothing to do`)
            return
        }

        for (let account of accounts) {
            console.log(`[${adName}] Trying with account [${account.pseudo}]...`)
            await page.getByRole('link', {name: 'Connexion'}).click();
            await page.locator('#username').click();
            await page.locator('#username').fill(account.email);
            await page.getByLabel('Mot de passe :').click();
            await page.getByLabel('Mot de passe :').fill(account.password);
            await page.getByRole('button', {name: 'Me connecter'}).click();
            await page.getByRole('link', {name: 'Gérer mes annonces de parrainage'}).click();
            const ads = await page.getByRole('link', {name: 'Voir plus'}).all();
            let imageName = imageNames[adName] || adName;
            const ad = await findAd(ads, imageName);
            if (!ad) {
                console.log(`[${adName}] Ad not found for pseudo [${account.pseudo}] - aborting`)
                return
            }
            await ad.click()
            await page.getByRole('link', {name: 'Modifier'}).click();
            try {
                await page.getByRole('button', {name: 'Envoyer'}).click();
                console.log(`[${adName}] Account [${account.pseudo}] modified ad with success`)
                return
            } catch (e) {
                // next account
                console.log(`[${adName}] Unable to modify ad with account [${account.pseudo}] - retrying with another account...`)
                await page.getByRole('link', {name: 'Quitter'}).first().click();
            }
        }
    });
}
