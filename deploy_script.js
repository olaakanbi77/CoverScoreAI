const ftp = require("basic-ftp");
const { Client } = require("ssh2");
const fs = require("fs");

const config = {
  host: "server392.web-hosting.com",
  user: "coveqmxf",
  password: "UoIfd1U6g848"
};

async function deploy() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  try {
    console.log("Connecting via FTP...");
    await client.access({
      host: config.host,
      user: config.user,
      password: config.password,
      secure: false
    });
    console.log("Connected to FTP.");
    
    console.log("Navigating to coverscore-ai...");
    await client.ensureDir("coverscore-ai");
    
    console.log("Uploading deployment.zip...");
    await client.uploadFrom("deployment.zip", "deployment.zip");
    
    console.log("Uploading env_temp.txt...");
    await client.uploadFrom("env_temp.txt", "env_temp.txt");
    
    console.log("Uploading package.json...");
    await client.uploadFrom("package.json", "package.json");
    
    console.log("FTP Upload complete!");
  } catch (err) {
    console.error("FTP Error:", err);
  } finally {
    client.close();
  }

  // Try SSH
  console.log("Attempting SSH connection to extract and restart...");
  const conn = new Client();
  conn.on('ready', () => {
    console.log('SSH Client :: ready');
    const cmd = `cd /home/coveqmxf/coverscore-ai && unzip -o deployment.zip && mv env_temp.txt .env && /opt/cpanel/ea-nodejs20/bin/npm install && mkdir -p tmp && touch tmp/restart.txt`;
    console.log("Running command over SSH:", cmd);
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
    console.log("SSH Error (SSH might be disabled):", err.message);
    console.log("Please extract 'deployment.zip', rename 'env_temp.txt' to '.env', run NPM Install, and restart the Node.js App manually via cPanel.");
  }).connect({
    host: config.host,
    port: 21098, // Namecheap Shared Hosting SSH port
    username: config.user,
    password: config.password
  });
}

deploy();
