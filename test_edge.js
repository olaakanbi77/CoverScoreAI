const { spawnSync } = require('child_process');
const fs = require('fs');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('/app/data/coverscore.db');

db.get("SELECT content FROM academy_modules WHERE id=50", (err, row) => {
  if (err) { console.error('DB err:', err.message); process.exit(1); }
  const plain = row.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  console.log('Content length:', plain.length, 'chars');

  // Test 1: plain text short
  console.log('\n--- Test 1: plain text 200 chars ---');
  let r = spawnSync('edge-tts', ['--voice','en-GB-SoniaNeural','--text', plain.substring(0,200), '--write-media','/app/data/videos/t1.mp3'], { stdio: 'pipe', timeout: 30000 });
  console.log('stderr:', r.stderr.toString().slice(0,500));
  console.log('status:', r.status, 'file:', fs.existsSync('/app/data/videos/t1.mp3'));

  // Test 2: SSML breaks
  console.log('\n--- Test 2: SSML with breaks 200 chars ---');
  let txt = plain.substring(0,200);
  let ssml = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis">' + txt + '</speak>';
  r = spawnSync('edge-tts', ['--voice','en-GB-SoniaNeural','--text', ssml, '--write-media','/app/data/videos/t2.mp3'], { stdio: 'pipe', timeout: 30000 });
  console.log('stderr:', r.stderr.toString().slice(0,500));
  console.log('status:', r.status, 'file:', fs.existsSync('/app/data/videos/t2.mp3'));

  // Test 3: full content
  console.log('\n--- Test 3: full content ~2000 chars ---');
  r = spawnSync('edge-tts', ['--voice','en-GB-SoniaNeural','--text', plain.substring(0,2000), '--write-media','/app/data/videos/t3.mp3'], { stdio: 'pipe', timeout: 120000 });
  console.log('stderr:', r.stderr.toString().slice(0,500));
  console.log('status:', r.status, 'file:', fs.existsSync('/app/data/videos/t3.mp3'));

  db.close();
});
