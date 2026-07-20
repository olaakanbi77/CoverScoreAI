const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('docker logs coverscore-ai --tail 30 2>&1', (err, stream) => {
    if (err) { console.log(err.message); conn.end(); return; }
    let out = '';
    stream.on('data', (d) => out += d.toString());
    stream.stderr.on('data', (d) => out += d.toString());
    stream.on('close', () => { console.log(out); conn.end(); });
  });
}).on('error', (err) => { console.log('SSH Error:', err.message); }).connect({
  host: process.env.DEPLOY_HOST, port: 22,
  username: process.env.DEPLOY_USER,
  password: process.env.DEPLOY_PASS, readyTimeout: 30000
});
