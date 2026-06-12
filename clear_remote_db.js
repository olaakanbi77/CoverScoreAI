const ftp = require("basic-ftp");
const { Client } = require("ssh2");

const config = {
  host: "server392.web-hosting.com",
  user: "coveqmxf",
  password: "UoIfd1U6g848",
  port: 21098
};

async function wipeRemoteDb() {
  const client = new ftp.Client();
  try {
    console.log("Connecting via FTP...");
    await client.access({
      host: config.host,
      user: config.user,
      password: config.password,
      secure: false
    });
    
    await client.cd("coverscore-ai");
    console.log("Uploading clear_db.js...");
    await client.uploadFrom("clear_db.js", "clear_db.js");
    console.log("FTP Upload complete!");
  } catch (err) {
    console.error("FTP Error:", err);
  } finally {
    client.close();
  }

  // Run SSH
  console.log("Attempting SSH connection to run clear_db.js and restart...");
  const conn = new Client();
  conn.on('ready', () => {
    console.log('SSH Client :: ready');
    const cmd = `cd /home/coveqmxf/coverscore-ai && /opt/cpanel/ea-nodejs20/bin/node clear_db.js && touch tmp/restart.txt`;
    console.log("Running command:", cmd);
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
  }).on('error', (err) => {
    console.log("SSH Error:", err.message);
  }).connect(config);
}

wipeRemoteDb();
