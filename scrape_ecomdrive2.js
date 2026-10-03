const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        console.log('Navigating to login page...');
        await page.goto('https://portal.ecomdrivebd.com/', { waitUntil: 'networkidle2' });
        
        // Wait for inputs to render
        await page.waitForTimeout(2000);
        
        console.log('Finding inputs and logging in...');
        const inputs = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('input')).map(i => ({ type: i.type, name: i.name, id: i.id, placeholder: i.placeholder }));
        });
        console.log('Inputs found:', inputs);

        // Try to type using general selectors
        let emailTyped = false;
        let passTyped = false;
        
        for (let i of inputs) {
            if (!emailTyped && (i.type === 'email' || i.name === 'email' || i.name === 'username' || (i.placeholder && i.placeholder.toLowerCase().includes('email')))) {
                await page.type(`input[name="${i.name}"]`, 'test@gmail.com');
                emailTyped = true;
            } else if (!passTyped && (i.type === 'password' || i.name === 'password')) {
                await page.type(`input[name="${i.name}"]`, 'Fahim135790.');
                passTyped = true;
            }
        }
        
        console.log('Submitting form...');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(()=>console.log('Nav timeout')),
            page.evaluate(() => {
                let btn = document.querySelector('button[type="submit"]') || document.querySelector('button');
                if (btn) btn.click();
            })
        ]);
        
        console.log('Logged in. Waiting for dashboard...');
        await page.waitForTimeout(5000);
        
        const menuLinks = await page.evaluate(() => {
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
            console.log(`[${i+1}/${menuLinks.length}] Scraping: ${link.text}`);
            try {
                await page.goto(link.href, { waitUntil: 'networkidle2', timeout: 10000 });
                await page.waitForTimeout(1000);
                const pageData = await page.evaluate(() => {
                    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, .card-title, .title, th')).map(h => h.innerText.trim()).filter(t => t);
                    const buttons = Array.from(document.querySelectorAll('button, .btn, a.btn')).map(b => b.innerText.trim()).filter(t => t);
                    return {
                        headings: [...new Set(headings)].slice(0, 15).join(' | '),
                        buttons: [...new Set(buttons)].slice(0, 10).join(' | ')
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
