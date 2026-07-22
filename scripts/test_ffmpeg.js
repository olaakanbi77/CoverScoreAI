const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec('docker exec gen-runner sh -c "time ffmpeg -y -loop 1 -i /app/data/videos/slide_50.png -i /app/data/videos/audio_50.mp3 -c:v libx264 -preset ultrafast -crf 40 -t 245.976 -pix_fmt yuv420p -vf scale=480:270 -c:a aac -b:a 64k -shortest /app/data/videos/test_simple.mp4 2>&1; echo EXIT:$?"', (e, s) => {
    if (e) { console.error(e); c.end(); return; }
    let o = '';
    s.on('data', d => o += d.toString());
    s.stderr.on('data', d => process.stderr.write(d.toString()));
    s.on('close', () => { console.log(o); c.end(); });
  });
});
c.on('error', e => console.error(e.message));
c.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
