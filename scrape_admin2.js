const puppeteer = require('puppeteer');

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        console.log('Navigating to login page...');
        await page.goto('https://majorlifestyles.com/posadmin/', { waitUntil: 'networkidle2' });
        
        console.log('Filling credentials...');
        await page.type('input[name="name"]', 'shakib');
        await page.type('input[name="password"]', '147258369');
        
        console.log('Submitting form...');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.click('button[type="submit"], input[type="submit"]')
        ]);
        
        console.log('Logged in. Extracting menu features...');
        
        // Extract all text inside the sidebar or main menu (usually inside a nav or sidebar element, but we can just grab all links on the dashboard)
        const features = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a, .nav-link, .menu-title'));
            return links
                .map(a => a.innerText.trim())
                .filter(t => t.length > 2)
                .filter((v, i, a) => a.indexOf(v) === i); // unique
        });
        
        console.log('--- FEATURES FOUND ---');
        console.log(features.join('\n'));
        
        await browser.close();
    } catch (e) {
        console.error('Error:', e);
    }
})();
