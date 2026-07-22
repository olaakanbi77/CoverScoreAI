const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec('docker exec coverscore-ai sh -c "wget -qO- http://localhost:3016/videos/lesson_50_What_Is_Risk_The_Foundation_of_Protection.mp4 -o /dev/null -w \"%{http_code}\"" 2>&1; echo ""; echo "==="; docker exec coverscore-ai sh -c "wget -qO- http://localhost:3016/health" 2>&1; echo "==="; docker logs coverscore-ai --tail 10 2>&1', (e, s) => {
    if (e) { console.error(e.message); c.end(); return; }
    let o = '';
    s.on('data', d => o += d.toString());
    s.stderr.on('data', d => process.stderr.write(d.toString()));
    s.on('close', () => { console.log(o); c.end(); });
  });
});
c.on('error', e => console.error(e.message));
c.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
