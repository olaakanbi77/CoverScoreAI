const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'coverscore.db');
const VIDEOS_DIR = path.join(__dirname, '..', 'data', 'videos');
const BG_IMAGE = path.join(VIDEOS_DIR, 'bg.png');
const FONT_FILE = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const FONT_REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';

if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });

const db = new sqlite3.Database(DB_PATH);

function checkTool(cmd) {
  try { execSync(`which ${cmd}`, { stdio: 'pipe' }); return true; }
  catch { return false; }
}

function generateBackground() {
  console.log('Creating branded background...');
  const bgPath = BG_IMAGE;
  if (fs.existsSync(bgPath)) return bgPath;

  const svg = `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0b1120"/>
        <stop offset="100%" stop-color="#1e293b"/>
      </linearGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(#bg)"/>
    <circle cx="1600" cy="200" r="400" fill="rgba(124,58,237,0.05)"/>
    <circle cx="300" cy="900" r="300" fill="rgba(16,185,129,0.04)"/>
    <text x="960" y="480" font-family="DejaVu Sans" font-size="64" font-weight="bold" fill="white" text-anchor="middle">CoverScore Academy</text>
    <text x="960" y="560" font-family="DejaVu Sans" font-size="28" fill="#94a3b8" text-anchor="middle">Risk Intelligence Training</text>
    <rect x="760" y="600" width="400" height="4" rx="2" fill="#7c3aed"/>
  </svg>`;

  const svgFile = bgPath.replace('.png', '.svg');
  fs.writeFileSync(svgFile, svg);
  execSync(`convert "${svgFile}" "${bgPath}"`, { stdio: 'pipe' });
  fs.unlinkSync(svgFile);
  return bgPath;
}

function generateSlideImage(lessonNumber, title, courseCode, outputPath) {
  const esc = t => t.replace(/"/g, '\\"').replace(/'/g, "\\'");
  const svg = `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0b1120"/>
        <stop offset="100%" stop-color="#1e293b"/>
      </linearGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(#bg)"/>
    <text x="960" y="380" font-family="DejaVu Sans" font-size="48" font-weight="bold" fill="#7c3aed" text-anchor="middle">${esc(courseCode)}</text>
    <text x="960" y="460" font-family="DejaVu Sans" font-size="52" font-weight="bold" fill="white" text-anchor="middle">Lesson ${lessonNumber}</text>
    <text x="960" y="560" font-family="DejaVu Sans" font-size="36" fill="#cbd5e1" text-anchor="middle" max-width="1600">${esc(title.length > 80 ? title.substring(0, 77) + '...' : title)}</text>
    <rect x="860" y="630" width="200" height="4" rx="2" fill="#10b981"/>
    <text x="960" y="750" font-family="DejaVu Sans" font-size="20" fill="#64748b" text-anchor="middle">coverscore.site/academy</text>
  </svg>`;

  const svgFile = outputPath.replace('.png', '.svg');
  fs.writeFileSync(svgFile, svg);
  execSync(`convert "${svgFile}" "${outputPath}"`, { stdio: 'pipe' });
  fs.unlinkSync(svgFile);
}

async function generateVideo(lesson) {
  const { id, lesson_number, title, course_id, video_script, content, code } = lesson;
  const safeTitle = title.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_').substring(0, 50);
  const videoFile = path.join(VIDEOS_DIR, `lesson_${id}_${safeTitle}.mp4`);
  const audioFile = path.join(VIDEOS_DIR, `audio_${id}.mp3`);
  const slideFile = path.join(VIDEOS_DIR, `slide_${id}.png`);

  if (fs.existsSync(videoFile)) {
    return videoFile;
  }

  const script = video_script || content || `Welcome to ${title}.`;
  const plainText = script.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const truncated = plainText.substring(0, 3000);

  console.log(`  Generating audio for lesson ${id}...`);
  try {
    spawnSync('edge-tts', [
      '--voice', 'en-GB-SoniaNeural',
      '--text', truncated,
      '--write-media', audioFile
    ], { stdio: 'pipe', timeout: 120000 });
  } catch (e) {
    console.error(`  edge-tts failed for lesson ${id}:`, e.message);
    return null;
  }
  if (!fs.existsSync(audioFile)) {
    console.error(`  audio file not created for lesson ${id}`);
    return null;
  }

  const audioDuration = execSync(`ffprobe -i "${audioFile}" -show_entries format=duration -v quiet -of csv="p=0"`).toString().trim();
  const duration = parseFloat(audioDuration) || 30;
  const minDuration = Math.max(duration, 15);

  console.log(`  Creating slide for lesson ${id}...`);
  generateSlideImage(lesson_number, title, code || 'CCA', slideFile);

  console.log(`  Rendering video for lesson ${id} (${Math.round(minDuration)}s)...`);
  try {
    execSync(
      `ffmpeg -y -loop 1 -i "${slideFile}" -i "${audioFile}" ` +
      `-c:v libx264 -t ${minDuration} -pix_fmt yuv420p -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" ` +
      `-c:a aac -b:a 128k -shortest "${videoFile}"`,
      { stdio: 'pipe', timeout: 120000 }
    );
  } catch (e) {
    console.error(`  ffmpeg failed for lesson ${id}:`, e.message);
    return null;
  }

  [audioFile, slideFile].forEach(f => { try { fs.unlinkSync(f); } catch {} });
  return videoFile;
}

async function main() {
  console.log('=== CoverScore Academy Lesson Video Generator ===\n');

  if (!checkTool('ffmpeg')) {
    console.log('FFmpeg not found. Install: apt-get install -y ffmpeg');
    process.exit(1);
  }
  if (!checkTool('convert')) {
    console.log('ImageMagick not found. Install: apt-get install -y imagemagick');
    process.exit(1);
  }
  if (!checkTool('edge-tts')) {
    console.log('edge-tts not found. Install: pip install edge-tts');
    process.exit(1);
  }

  console.log('All tools available.\n');
  generateBackground();

  console.log('Querying lessons without video...');
  const lessons = await new Promise((res, rej) => {
    db.all(`SELECT m.*, c.code FROM academy_modules m LEFT JOIN academy_courses c ON c.id = m.course_id WHERE m.video_url IS NULL AND m.content IS NOT NULL ORDER BY m.course_id, m.lesson_number`, (err, rows) => {
      if (err) rej(err); else res(rows || []);
    });
  });

  console.log(`Found ${lessons.length} lessons to process.\n`);

  let done = 0;
  for (const lesson of lessons) {
    console.log(`[${done + 1}/${lessons.length}] Lesson ${lesson.id}: ${lesson.title}`);
    const videoPath = await generateVideo(lesson);
    if (videoPath) {
      const relPath = `/videos/${path.basename(videoPath)}`;
      await new Promise((res, rej) => {
        db.run("UPDATE academy_modules SET video_url = ? WHERE id = ?", [relPath, lesson.id], (err) => {
          if (err) rej(err); else res();
        });
      });
      console.log(`  ✓ Saved: ${relPath}`);
      done++;
    } else {
      console.log(`  ✗ Failed`);
    }
  }

  console.log(`\nDone. ${done}/${lessons.length} videos generated.`);
  db.close();
}

main().catch(err => { console.error(err); process.exit(1); });
