const { spawn } = require('child_process');
const fs = require('fs');

async function test() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=9226', '--disable-gpu']);
  await new Promise(r => setTimeout(r, 1200));
  const json = await fetch('http://127.0.0.1:9226/json/new', { method: 'PUT' }).then(r => r.json());
  const ws = new WebSocket(json.webSocketDebuggerUrl);

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const msgId = id++;
    const handler = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.id === msgId) {
        ws.removeEventListener('message', handler);
        resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:3001' });
  await new Promise(r => setTimeout(r, 3500));

  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const banner = document.querySelector('.header-banner-image img');
      const bRect = banner ? banner.getBoundingClientRect() : null;
      
      const leftDragon = document.querySelector('img[alt="Banner Header Left"]');
      const lRect = leftDragon ? leftDragon.getBoundingClientRect() : null;

      const rightDragon = document.querySelector('img[alt="Banner Header Right"]');
      const rRect = rightDragon ? rightDragon.getBoundingClientRect() : null;

      const menu = document.querySelectorAll('.nav-menu-giapha ul li');
      const menuTexts = Array.from(menu).map(m => m.innerText.trim());

      const canvas = document.querySelector('#pha-do-canvas');
      const cRect = canvas ? canvas.getBoundingClientRect() : null;

      const nodes = document.querySelectorAll('#pha-do-canvas svg g');

      return {
        banner: bRect ? { width: Math.round(bRect.width), height: Math.round(bRect.height), top: Math.round(bRect.top) } : null,
        leftDragon: lRect ? { width: Math.round(lRect.width), height: Math.round(lRect.height), top: Math.round(lRect.top) } : null,
        rightDragon: rRect ? { width: Math.round(rRect.width), height: Math.round(rRect.height), top: Math.round(rRect.top) } : null,
        menuItems: menuTexts,
        canvas: cRect ? { width: Math.round(cRect.width), height: Math.round(cRect.height), top: Math.round(cRect.top) } : null,
        svgNodesCount: nodes.length
      };
    })()`,
    returnByValue: true
  });

  console.log('Final Layout Stats:', JSON.stringify(res.result.value, null, 2));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Admin/.gemini/antigravity/brain/5781a984-7423-42d8-95ad-fd0f6a42c600/guest_view_verification_v2.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved guest_view_verification_v2.png, bytes:', shot.data.length);

  ws.close();
  chrome.kill();
}
test().catch(console.error);
