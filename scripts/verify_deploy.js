const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:3016/health', (err, stream) => {
    if (err) { console.error('exec:', err.message); return conn.end(); }
    stream.on('close', () => conn.end());
    stream.on('data', d => process.stdout.write('Health: HTTP ' + d.toString() + '\n'));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
});
conn.on('error', e => console.error('SSH error:', e.message));
conn.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
