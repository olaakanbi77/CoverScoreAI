const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec('for i in $(seq 1 15); do s=$(docker ps --filter name=coverscore-ai --format "{{.Status}}" 2>&1); echo "$i: $s"; echo "$s" | grep -q healthy && break; sleep 3; done; echo "==="; docker logs coverscore-ai --tail 5 2>&1', (e, s) => {
    if (e) { console.error(e.message); c.end(); return; }
    let o = '';
    s.on('data', d => o += d.toString());
    s.stderr.on('data', d => process.stderr.write(d.toString()));
    s.on('close', () => { console.log(o); c.end(); });
  });
});
c.on('error', e => console.error(e.message));
c.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
