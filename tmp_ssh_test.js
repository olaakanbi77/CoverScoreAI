const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected');
  const cmd = `curl -s -X POST http://163.245.210.111:8081/message/sendText/CoverScore -H "apikey: CoverScoreEvolution2024SecureKey" -H "Content-Type: application/json" -d '{"number": "2348021279029", "text": "Hello from CoverScore AI! WhatsApp integration test successful."}'`;
  conn.exec(cmd, (err, stream) => {
    if (err) { console.error('Exec error:', err); conn.end(); return; }
    let output = '';
    stream.on('data', d => output += d);
    stream.stderr.on('data', d => output += '[ERR] ' + d);
    stream.on('close', () => { console.log('Output:', output); conn.end(); });
  });
}).on('error', err => {
  console.error('SSH error:', err.message);
}).connect({
  host: 'server392.web-hosting.com',
  port: 21098,
  username: 'coveqmxf',
  password: 'UoIfd1U6g848'
});
