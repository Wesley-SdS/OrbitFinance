
PS C:\Users\wesle\Downloads\orbifinance-mvp (1)> cd whatsapp-service
PS C:\Users\wesle\Downloads\orbifinance-mvp (1)\whatsapp-service> pnpm i
 WARN  Moving express that was installed by a different package manager to "node_modules/.ignored"
 WARN  Moving venom-bot that was installed by a different package manager to "node_modules/.ignored"
 WARN  Moving qrcode that was installed by a different package manager to "node_modules/.ignored"
 WARN  Moving cors that was installed by a different package manager to "node_modules/.ignored"
 WARN  Moving axios that was installed by a different package manager to "node_modules/.ignored"
 WARN  1 other warnings
 WARN  12 deprecated subdependencies found: @npmcli/move-file@2.0.1, are-we-there-yet@3.0.1, fstream@1.0.12, gauge@4.0.4, glob@7.2.3, glob@8.1.0, inflight@1.0.6, npmlog@6.0.2, puppeteer@21.11.0, read-package-json@6.0.4, rimraf@2.7.1, rimraf@3.0.2
Packages: +625
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 644, reused 391, downloaded 235, added 625, done

dependencies:
+ axios 1.13.2
+ cors 2.8.5
+ dotenv 16.6.1 (17.2.3 is available)
+ express 4.21.2 (5.1.0 is available)
+ qrcode 1.5.4
+ venom-bot 5.3.0

╭ Warning ───────────────────────────────────────────────────────────────────────────────────╮
│                                                                                            │
│   Ignored build scripts: puppeteer, sharp, sleep.                                          │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.   │
│                                                                                            │
╰────────────────────────────────────────────────────────────────────────────────────────────╯

Done in 32.9s using pnpm v10.18.0
PS C:\Users\wesle\Downloads\orbifinance-mvp (1)\whatsapp-service> pnpm start

> orbi-whatsapp-service@1.0.0 start C:\Users\wesle\Downloads\orbifinance-mvp (1)\whatsapp-service
> node index.js

🌐 Server running on http://localhost:8080
🚀 Initializing Venom...
- ....
- Help Keep This Project Going! Know more: https://github.com/orkestral/venom/blob/master/docs/getting-started/donate.md
- Help Keep This Project Going! Know more: https://github.com/orkestral/venom/blob/master/docs/getting-started/donate.md
- check nodeJs version...
- Help Keep This Project Going! Know more: https://github.com/orkestral/venom/blob/master/docs/getting-started/donate.md
- Node.js version verified successfully!
You're up to date 🎉🎉🎉
📊 Status: initBrowser
- Help Keep This Project Going! Know more: https://github.com/orkestral/venom/blob/master/docs/getting-started/donate.md
- Node.js version verified successfully!
- Waiting... checking the browser...
- Help Keep This Project Going! Know more: https://github.com/orkestral/venom/blob/master/docs/getting-started/donate.md
- Node.js version verified successfully!
- Waiting... checking the browser...
- ...
- Help Keep This Project Going! Know more: https://github.com/orkestral/venom/blob/master/docs/getting-started/donate.md
- Node.js version verified successfully!
- Waiting... checking the browser...
- Executable path browser: C:\Program Files\Google\Chrome\Application\chrome.exe
- Help Keep This Project Going! Know more: https://github.com/orkestral/venom/blob/master/docs/getting-started/donate.md
- Node.js version verified successfully!
- Waiting... checking the browser...
- Executable path browser: C:\Program Files\Google\Chrome\Application\chrome.exe
- ...
- Help Keep This Project Going! Know more: https://github.com/orkestral/venom/blob/master/docs/getting-started/donate.md
- Node.js version verified successfully!
- Waiting... checking the browser...
- Executable path browser: C:\Program Files\Google\Chrome\Application\chrome.exe
- Platform: win32
- Help Keep This Project Going! Know more: https://github.com/orkestral/venom/blob/master/docs/getting-started/donate.md
- Node.js version verified successfully!
- Waiting... checking the browser...
- Executable path browser: C:\Program Files\Google\Chrome\Application\chrome.exe
- Platform: win32
- ...
- Help Keep This Project Going! Know more: https://github.com/orkestral/venom/blob/master/docs/getting-started/donate.md
- Node.js version verified successfully!
- Waiting... checking the browser...
- Executable path browser: C:\Program Files\Google\Chrome\Application\chrome.exe
- Platform: win32
- Browser Version: Chrome/142.0.7444.135
📊 Status: openBrowser
- Help Keep This Project Going! Know more: https://github.com/orkestral/venom/blob/master/docs/getting-started/donate.md
- Node.js version verified successfully!
- Browser successfully opened
- Executable path browser: C:\Program Files\Google\Chrome\Application\chrome.exe
- Platform: win32
- Browser Version: Chrome/142.0.7444.135
- Help Keep This Project Going! Know more: https://github.com/orkestral/venom/blob/master/docs/getting-started/donate.md
- Node.js version verified successfully!
- checking headless...
- Executable path browser: C:\Program Files\Google\Chrome\Application\chrome.exe
- Platform: win32
- Browser Version: Chrome/142.0.7444.135
- Help Keep This Project Going! Know more: https://github.com/orkestral/venom/blob/master/docs/getting-started/donate.md
- Node.js version verified successfully!
- headless option is disabled, browser visible
- Executable path browser: C:\Program Files\Google\Chrome\Application\chrome.exe
- Platform: win32
- Browser Version: Chrome/142.0.7444.135
- Help Keep This Project Going! Know more: https://github.com/orkestral/venom/blob/master/docs/getting-started/donate.md
- Node.js version verified successfully!
- headless option is disabled, browser visible
- Executable path browser: C:\Program Files\Google\Chrome\Application\chrome.exe
- Platform: win32
- Browser Version: Chrome/142.0.7444.135
- Checking page to whatzapp...
📊 Status: initWhatsapp
TargetCloseError: Protocol error (Page.setBypassCSP): Session closed. Most likely the page has been closed.
    at CdpCDPSession.send (C:\Users\wesle\Downloads\orbifinance-mvp (1)\whatsapp-service\node_modules\.pnpm\puppeteer-core@21.11.0_encoding@0.1.13\node_modules\puppeteer-core\lib\cjs\puppeteer\cdp\CDPSession.js:64:35)
    at CdpPage.setBypassCSP (C:\Users\wesle\Downloads\orbifinance-mvp (1)\whatsapp-service\node_modules\.pnpm\puppeteer-core@21.11.0_encoding@0.1.13\node_modules\puppeteer-core\lib\cjs\puppeteer\cdp\Page.js:716:41)
    at initWhatsapp (C:\Users\wesle\Downloads\orbifinance-mvp (1)\whatsapp-service\node_modules\.pnpm\venom-bot@5.3.0_encoding@0.1.13\node_modules\venom-bot\dist\controllers\browser.js:55:22)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async C:\Users\wesle\Downloads\orbifinance-mvp (1)\whatsapp-service\node_modules\.pnpm\venom-bot@5.3.0_encoding@0.1.13\node_modules\venom-bot\dist\controllers\initializer.js:152:26
Error: Protocol error: Connection closed. Most likely the page has been closed.
    at assert (C:\Users\wesle\Downloads\orbifinance-mvp (1)\whatsapp-service\node_modules\.pnpm\puppeteer-core@21.11.0_encoding@0.1.13\node_modules\puppeteer-core\lib\cjs\puppeteer\util\assert.js:18:15)
    at CdpPage.close (C:\Users\wesle\Downloads\orbifinance-mvp (1)\whatsapp-service\node_modules\.pnpm\puppeteer-core@21.11.0_encoding@0.1.13\node_modules\puppeteer-core\lib\cjs\puppeteer\cdp\Page.js:848:32)
    at initWhatsapp (C:\Users\wesle\Downloads\orbifinance-mvp (1)\whatsapp-service\node_modules\.pnpm\venom-bot@5.3.0_encoding@0.1.13\node_modules\venom-bot\dist\controllers\browser.js:117:22)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async C:\Users\wesle\Downloads\orbifinance-mvp (1)\whatsapp-service\node_modules\.pnpm\venom-bot@5.3.0_encoding@0.1.13\node_modules\venom-bot\dist\controllers\initializer.js:152:26
