const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        console.log('Navigating to login page...');
        await page.goto('https://portal.ecomdrivebd.com/', { waitUntil: 'networkidle2' });
        
        await new Promise(r => setTimeout(r, 5000));
        
        console.log('Typing email...');
        // Try to click in the clerk email input
        await page.waitForSelector('.cl-formFieldInput', { timeout: 10000 }).catch(e => console.log('No .cl-formFieldInput'));
        await page.type('.cl-formFieldInput[name="identifier"]', 'test@gmail.com');
        
        console.log('Clicking continue...');
        await page.click('.cl-formButtonPrimary');
        
        await new Promise(r => setTimeout(r, 3000));
        
        console.log('Typing password...');
        await page.type('.cl-formFieldInput[name="password"]', 'Fahim135790.');
        
        await page.click('.cl-formButtonPrimary');
        
        console.log('Waiting for login...');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => console.log('Nav timeout'));
        await new Promise(r => setTimeout(r, 5000));
        
        const html = await page.content();
        fs.writeFileSync('ecomdrive_dash.html', html);
        console.log('Saved dashboard HTML.');
        
        await browser.close();
    } catch (e) {
        console.error('Error:', e);
    }
})();
