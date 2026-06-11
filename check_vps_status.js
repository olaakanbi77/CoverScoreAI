const { Client } = require('ssh2');

const VPS_HOST = '163.245.210.111';
const VPS_USER = 'root';
const VPS_PASS = 'RUlTzXC1Onrmw';

const runCommand = (conn, cmd) => {
  return new Promise((resolve, reject) => {
    console.log(`\n> Running: ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream.on('data', d => stdout += d.toString());
      stream.stderr.on('data', d => stderr += d.toString());
      stream.on('close', (code) => {
        console.log(stdout);
        if (stderr) console.log('[STDERR]', stderr);
        resolve({ stdout: stdout.trim(), stderr: stderr.trim(), code });
      });
    });
  });
};

const main = async () => {
  const conn = new Client();
  
  return new Promise((resolve, reject) => {
    conn.on('ready', async () => {
      console.log('✅ SSH Connected to VPS');
      try {
        console.log('\n═══ Checking PM2 Logs ═══');
        await runCommand(conn, 'pm2 logs coverscore --lines 50 --nostream');
        
        console.log('\n═══ Checking DB Leads Count ═══');
        await runCommand(conn, 'sqlite3 /root/coverscore-ai/data/coverscore.db "SELECT COUNT(*) FROM leads;"');
      } catch (e) {
        console.error('Script error:', e.message);
      }
      conn.end();
      resolve();
    }).on('error', err => {
      console.error('SSH connection failed:', err.message);
      reject(err);
    }).connect({
      host: VPS_HOST,
      port: 22,
      username: VPS_USER,
      password: VPS_PASS
    });
  });
};

main().catch(console.error);
