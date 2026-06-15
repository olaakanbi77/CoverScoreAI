const http = require('http');
const req = http.request({
  hostname: 'localhost',
  port: 3016,
  path: '/api/webhook/evolution',
  method: 'POST',
  headers: {'Content-Type': 'application/json'}
}, (res) => {
  console.log('Status:', res.statusCode);
  res.on('data', d => process.stdout.write(d));
});
req.on('error', e => console.error(e));
req.write(JSON.stringify({
  data: {
    key: { remoteJid: "2349165304629@s.whatsapp.net", fromMe: false },
    message: { conversation: "RESTART" }
  }
}));
req.end();
