const puppeteer = require('puppeteer');

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        console.log('Navigating to login page...');
        await page.goto('https://majorlifestyles.com/posadmin/', { waitUntil: 'networkidle2' });
        
        // Find inputs
        const inputs = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('input')).map(i => ({ name: i.name, type: i.type }));
        });
        console.log('Inputs found:', inputs);
        
        // Fill credentials
        const emailInput = inputs.find(i => i.name.includes('email') || i.name.includes('username') || i.name === 'id');
        const passInput = inputs.find(i => i.type === 'password' || i.name.includes('password'));
        
        if (emailInput && passInput) {
            await page.type(`input[name="${emailInput.name}"]`, 'shakib');
            await page.type(`input[name="${passInput.name}"]`, '147258369');
            
            console.log('Submitting form...');
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2' }),
                page.click('button[type="submit"], input[type="submit"]')
            ]);
            
            console.log('Logged in. Extracting menu features...');
            
            // Extract all links/menu items in sidebar
            const features = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a'));
                return links
                    .map(a => a.innerText.trim())
                    .filter(t => t.length > 0)
                    .filter((v, i, a) => a.indexOf(v) === i); // unique
            });
            
            console.log('--- FEATURES FOUND ---');
            console.log(features.join('\n'));
        } else {
            console.log('Could not find login inputs.');
        }
        
        await browser.close();
    } catch (e) {
        console.error('Error:', e);
    }
})();
