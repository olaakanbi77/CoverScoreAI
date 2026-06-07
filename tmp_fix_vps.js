/**
 * VPS Diagnostic & Fix Script
 * This script SSHs into the VPS and:
 * 1. Shows what's actually running on port 3016
 * 2. Checks if the webhook.js has our fix
 * 3. Kills ALL processes on port 3016
 * 4. Properly restarts PM2
 * 5. Verifies the new process is running
 */

const { Client } = require('ssh2');

const VPS_HOST = '163.245.210.111';
const VPS_USER = 'root';

// We need the root password. The user is logged in as root@vps3416137
// They'll need to provide this or we can try key-based auth.

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
  
  // Try key-based auth first (common for root on VPS)
  const connectOpts = {
    host: VPS_HOST,
    port: 22,
    username: VPS_USER,
    // Try agent-based auth
    agent: process.env.SSH_AUTH_SOCK,
    // Also try common key paths
    tryKeyboard: true,
  };

  // Check if password was passed as argument
  if (process.argv[2]) {
    connectOpts.password = process.argv[2];
  }

  return new Promise((resolve, reject) => {
    conn.on('ready', async () => {
      console.log('✅ SSH Connected to VPS');
      
      try {
        // Step 1: Show what PM2 is doing
        console.log('\n═══ STEP 1: PM2 Status ═══');
        await runCommand(conn, 'pm2 list');
        
        // Step 2: Check what ecosystem file PM2 is using
        console.log('\n═══ STEP 2: PM2 Process Details ═══');
        await runCommand(conn, 'pm2 describe coverscore | head -30');

        // Step 3: Check what's actually on port 3016
        console.log('\n═══ STEP 3: What is on port 3016? ═══');
        await runCommand(conn, 'lsof -i :3016 || ss -tlnp | grep 3016');

        // Step 4: Check if our fix is in the deployed webhook.js
        console.log('\n═══ STEP 4: Does webhook.js have our fix? ═══');
        const checkResult = await runCommand(conn, 'grep "Error details:" /root/coverscore-ai/src/routes/webhook.js || echo "FIX NOT FOUND"');
        
        // Step 5: Check if there's a node_modules/node-fetch
        console.log('\n═══ STEP 5: Check node-fetch dependency ═══');
        await runCommand(conn, 'ls /root/coverscore-ai/node_modules/node-fetch/package.json 2>/dev/null && echo "node-fetch EXISTS" || echo "node-fetch MISSING"');

        // Step 6: Check the actual .env on VPS
        console.log('\n═══ STEP 6: VPS .env file ═══');
        await runCommand(conn, 'cat /root/coverscore-ai/.env');

        // Step 7: Nuclear fix - stop everything, kill port, restart
        console.log('\n═══ STEP 7: NUCLEAR FIX - Stopping everything ═══');
        await runCommand(conn, 'pm2 stop all');
        await runCommand(conn, 'sleep 1');
        await runCommand(conn, 'fuser -k 3016/tcp 2>/dev/null || true');
        await runCommand(conn, 'sleep 1');
        
        // Verify port is free
        const portCheck = await runCommand(conn, 'lsof -i :3016 || echo "PORT IS FREE"');
        
        if (portCheck.stdout.includes('PORT IS FREE')) {
          console.log('\n✅ Port 3016 is free. Starting PM2...');
          await runCommand(conn, 'cd /root/coverscore-ai && pm2 start src/server.js --name coverscore --update-env');
          await runCommand(conn, 'sleep 3');
          await runCommand(conn, 'pm2 logs coverscore --lines 15 --nostream');
        } else {
          console.log('\n❌ Port 3016 is STILL occupied! Killing harder...');
          await runCommand(conn, 'kill -9 $(lsof -t -i:3016) 2>/dev/null || true');
          await runCommand(conn, 'sleep 2');
          await runCommand(conn, 'cd /root/coverscore-ai && pm2 start src/server.js --name coverscore --update-env');
          await runCommand(conn, 'sleep 3');
          await runCommand(conn, 'pm2 logs coverscore --lines 15 --nostream');
        }

        // Step 8: Verify it's running
        console.log('\n═══ STEP 8: Final verification ═══');
        await runCommand(conn, 'pm2 list');
        await runCommand(conn, 'curl -s -o /dev/null -w "HTTP Status: %{http_code}" http://localhost:3016/ || echo "CURL FAILED"');
        
      } catch (e) {
        console.error('Script error:', e.message);
      }
      
      conn.end();
      resolve();
    }).on('error', err => {
      console.error('SSH connection failed:', err.message);
      console.log('\nPlease run this script with your VPS root password:');
      console.log('  node tmp_fix_vps.js YOUR_ROOT_PASSWORD');
      reject(err);
    }).connect(connectOpts);
  });
};

main().catch(console.error);
