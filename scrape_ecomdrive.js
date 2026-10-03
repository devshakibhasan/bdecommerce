const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        console.log('Navigating to login page...');
        await page.goto('https://portal.ecomdrivebd.com/', { waitUntil: 'networkidle2' });
        
        console.log('Finding inputs and logging in...');
        // Standard inputs are usually type="email" or name="email" and type="password"
        await page.evaluate(() => {
            let email = document.querySelector('input[type="email"]') || document.querySelector('input[name="email"]') || document.querySelector('input[type="text"]');
            let pass = document.querySelector('input[type="password"]') || document.querySelector('input[name="password"]');
            if (email) email.value = 'test@gmail.com';
            if (pass) pass.value = 'Fahim135790.';
        });
        
        // Ensure values are registered by react/vue if any
        await page.type('input[type="password"]', ' ');
        await page.keyboard.press('Backspace');

        console.log('Submitting form...');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(()=>console.log('Navigation timeout, continuing...')),
            page.click('button[type="submit"], input[type="submit"], button')
        ]);
        
        console.log('Logged in. Waiting a bit for dashboard to load...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Extract all menu links
        const menuLinks = await page.evaluate(() => {
            // Find all anchor tags that look like sidebar links
            const anchors = Array.from(document.querySelectorAll('a[href]'));
            return anchors
                .map(a => ({ href: a.href, text: a.innerText.trim() }))
                .filter(a => a.href.includes(window.location.hostname) && !a.href.includes('#') && a.text.length > 2)
                .filter((v, i, a) => a.findIndex(t => t.href === v.href) === i); // unique
        });
        
        console.log(`Found ${menuLinks.length} links. Scanning pages...`);
        let report = '--- ECOMDRIVE BD PORTAL FEATURES ---\n\n';
        
        for (let i = 0; i < Math.min(menuLinks.length, 50); i++) {
            const link = menuLinks[i];
            console.log(`[${i+1}/${menuLinks.length}] Scraping: ${link.text} (${link.href})`);
            try {
                await page.goto(link.href, { waitUntil: 'networkidle2', timeout: 10000 });
                const pageData = await page.evaluate(() => {
                    const headings = Array.from(document.querySelectorAll('h1, h2, h3, .card-title, .page-title, th')).map(h => h.innerText.trim()).filter(t => t);
                    const buttons = Array.from(document.querySelectorAll('button, .btn')).map(b => b.innerText.trim()).filter(t => t);
                    return {
                        headings: [...new Set(headings)].slice(0, 10).join(', '),
                        buttons: [...new Set(buttons)].slice(0, 10).join(', ')
                    };
                });
                report += `### Menu: ${link.text}\n`;
                report += `URL: ${link.href}\n`;
                report += `Headings/Data: ${pageData.headings}\n`;
                report += `Actions/Buttons: ${pageData.buttons}\n\n`;
            } catch (e) {
                report += `### Menu: ${link.text}\nFailed to load.\n\n`;
            }
        }
        
        fs.writeFileSync('ecomdrive_report.txt', report);
        console.log('Report saved to ecomdrive_report.txt');
        await browser.close();
    } catch (e) {
        console.error('Error:', e);
    }
})();
