import {expect, Locator, Page, test} from '@playwright/test';

const domain = "www.1parrainage.com";

const adNames = [
    "revolut",
    "cookut",
    "inga",
    "stello",
    "dailyn",
    "le fourgon",
    "songmics home",
    "cybex",
    "smala",
    "bankin",
    "aime",
    "choose",
    "moo",
    "gamingamine"
];

const imageNames = {
    "dailyn": "daylin2",
    "songmics home": "songmicshome2",
    "hp instantink": "hpinstantinc",
}

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

async function findAd(ads: Array<Locator>, imageName: string) {
    for (const ad of ads) {
        const imageSource = await ad.locator("..").locator("..").locator("..").locator("div").first().locator("img").getAttribute("src")
        if (imageSource.toLowerCase().includes(imageName.replace(" ", "").toLowerCase())) {
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
    try {
        await page.getByRole('button', {name: 'Tout accepter'}).click();
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

        try {
            await expect(page.getByText("Code promo de parrainage").first()).toBeVisible();
        } catch (e) {
            await expect(page.getByText("Codes Parrainage").first()).toBeVisible();
        }

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
            await page.getByRole('link', {name: 'Se connecter'}).click();
            await page.locator('#_username').click();
            await page.locator('#_username').fill(account.email);
            await page.locator('#_password').click();
            await page.locator('#_password').fill(account.password);
            await page.getByRole('button', {name: 'Je me connecte'}).click();
            await page.getByRole('link', {name: 'Gérer mes annonces'}).click();
            const ads = await page.getByRole('link', {name: 'Voir plus'}).all();
            let imageName = imageNames[adName] || adName;
            const ad = await findAd(ads, imageName);
            if (!ad) {
                console.log(`[${adName}] Ad not found for pseudo [${account.pseudo}] - aborting`)
                await page.getByRole('link', {name: 'Se déconnecter'}).first().click();
                continue
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
        console.log(`[${adName}] Unable to modify ad with any account - aborting`)
    });
}
