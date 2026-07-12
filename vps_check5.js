const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec("ls -la /root/coverscore-ai/*.js 2>&1 | head -20; echo '---'; ls -d /root/coverscore-ai/test_zip 2>&1; echo '---'; ls -d /root/coverscore-ai/temp_deploy 2>&1; echo '---'; head -5 /root/coverscore-ai/webhook.js 2>/dev/null", (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => conn.end())
    .on('data', (d) => process.stdout.write(d.toString()))
    .stderr.on('data', (d) => process.stderr.write(d.toString()));
  });
}).on('error', (e) => console.error('SSH Error:', e.message))
.connect({ host: '163.245.210.111', port: 22, username: 'root', password: 'RUlTzXC1Onrmw', readyTimeout: 15000 });
