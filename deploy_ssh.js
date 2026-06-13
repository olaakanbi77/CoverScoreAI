const { Client } = require('ssh2');
const fs = require('fs');

const VPS_HOST = '163.245.210.111';
const VPS_USER = 'root';
const VPS_PASS = 'RUlTzXC1Onrmw';

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Client :: ready');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    console.log('Uploading deployment.zip...');
    sftp.fastPut('deployment.zip', '/root/coverscore-ai/deployment.zip', (err) => {
      if (err) throw err;
      console.log('Upload complete. Extracting and restarting...');
      
      const cmd = `cd /root/coverscore-ai && unzip -o deployment.zip && rm -f deployment.zip && pm2 restart coverscore`;
      conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
          console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
          
          console.log('Clearing the remote database...');
          const clearCmd = `cd /root/coverscore-ai && node clear_db.js`;
          conn.exec(clearCmd, (err, stream2) => {
            if (err) throw err;
            stream2.on('close', (code, signal) => {
               console.log('Database cleared!');
               conn.end();
            }).on('data', (data) => console.log('STDOUT2: ' + data)).stderr.on('data', (data) => console.log('STDERR2: ' + data));
          });
          
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
