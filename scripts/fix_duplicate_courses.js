const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  const cmds = [
    'cd /root/CoverScoreAI',
    'docker compose stop app',
    'sleep 2',
    'echo "=== DELETE DUPLICATE COURSES (keep first 8) ==="',
    'sqlite3 /root/CoverScoreAI/data/coverscore.db "DELETE FROM academy_courses WHERE id NOT IN (SELECT MIN(id) FROM academy_courses GROUP BY code);" 2>&1',
    'echo "=== ADD UNIQUE CONSTRAINT ==="',
    'sqlite3 /root/CoverScoreAI/data/coverscore.db "CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_code ON academy_courses(code);" 2>&1',
    'echo "=== VERIFY ==="',
    'sqlite3 /root/CoverScoreAI/data/coverscore.db "SELECT COUNT(*), COUNT(DISTINCT code) FROM academy_courses;" 2>&1',
    'echo "=== CORRECT MODULES WITH WRONG COURSE_ID ==="',
    'sqlite3 /root/CoverScoreAI/data/coverscore.db "SELECT id, course_id, title FROM academy_modules WHERE id >= 50 AND (course_id > 8 OR course_id IS NULL);" 2>&1',
    'echo "=== FIX MODULES ==="',
    'sqlite3 /root/CoverScoreAI/data/coverscore.db "UPDATE academy_modules SET course_id = ((id - 50) / 8) + 1 WHERE id >= 50;" 2>&1',
    'echo "=== FIX LESSON NUMBERS ==="',
    'sqlite3 /root/CoverScoreAI/data/coverscore.db "UPDATE academy_modules SET lesson_number = ((id - 50) % 8) + 1 WHERE id >= 50;" 2>&1',
    'docker compose up -d app',
    'echo "=== DONE ==="'
  ].join('; ');
  c.exec(cmds, (e, s) => {
    if (e) { console.error(e); c.end(); return; }
    s.on('data', d => process.stdout.write(d.toString()));
    s.stderr.on('data', d => process.stderr.write(d.toString()));
    s.on('close', () => c.end());
  });
});
c.on('error', e => console.error(e.message));
c.connect({ host: '163.245.210.111', username: 'root', password: 'RUlTzXC1Onrmw' });
