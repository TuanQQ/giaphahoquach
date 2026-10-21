const { spawn } = require('child_process');
const fs = require('fs');

async function test() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=9227', '--disable-gpu']);
  await new Promise(r => setTimeout(r, 1200));
  const json = await fetch('http://127.0.0.1:9227/json/new', { method: 'PUT' }).then(r => r.json());
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
  await send('Page.navigate', { url: 'https://giaphahoquach.vercel.app' });
  await new Promise(r => setTimeout(r, 4000));

  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const title = document.title;
      const banner = document.querySelector('.header-banner-image img');
      const nodes = document.querySelectorAll('#pha-do-canvas svg g');
      return {
        title,
        hasBanner: !!banner,
        svgNodesCount: nodes.length
      };
    })()`,
    returnByValue: true
  });

  console.log('LIVE VERCEL SITE TEST:', JSON.stringify(res.result.value, null, 2));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('D:/Project/giaphahoquach/public/live_vercel_screenshot.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved live_vercel_screenshot.png');

  ws.close();
  chrome.kill();
}
test().catch(console.error);
