const { Client } = require('ssh2');
const fs = require('fs');

const VPS_HOST = process.env.DEPLOY_HOST || '163.245.210.111';
const VPS_USER = process.env.DEPLOY_USER || 'root';
const VPS_PASS = process.env.DEPLOY_PASS;

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Client :: ready');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    console.log('Uploading deployment.zip...');
    sftp.fastPut('deployment.zip', '/root/coverscore-ai/deployment.zip', (err) => {
      if (err) throw err;
      console.log('Upload complete. Extracting and restarting...');
      
      const cmd = 'cd /root/coverscore-ai && unzip -o deployment.zip 2>/dev/null; rm -f deployment.zip; npm install; pm2 delete coverscore 2>/dev/null; pm2 start ecosystem.config.js --update-env';
      conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
          console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
          conn.end();
        }).on('data', (data) => {
          console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
          console.log('STDERR: ' + data);
        });
      });
    });
  });
}).on('error', (err) => {
  console.log("SSH Error:", err.message);
}).connect({
  host: VPS_HOST,
  port: 22,
  username: VPS_USER,
  password: VPS_PASS
});
