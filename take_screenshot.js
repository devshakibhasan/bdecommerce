const puppeteer = require('puppeteer');

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        console.log('Navigating to login page...');
        await page.goto('https://portal.ecomdrivebd.com/', { waitUntil: 'networkidle2' });
        
        await new Promise(r => setTimeout(r, 5000));
        
        await page.screenshot({ path: 'screenshot.png' });
        console.log('Screenshot saved to screenshot.png');
        
        const html = await page.content();
        require('fs').writeFileSync('page.html', html);
        console.log('HTML saved to page.html');
        
        await browser.close();
    } catch (e) {
        console.error('Error:', e);
    }
})();
