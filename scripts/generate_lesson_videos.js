const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'coverscore.db');
const VIDEOS_DIR = path.join(__dirname, '..', 'data', 'videos');
const FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const FONT_REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';

if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });

const db = new sqlite3.Database(DB_PATH);
db.run('PRAGMA busy_timeout = 30000');

const SCENE_NAMES = ['Welcome', 'Learning Objectives', 'Main Concept', 'Deep Dive', 'Practical Application', 'CoverScore Insight', 'Lesson Summary'];

function checkTool(cmd) {
  try { execSync(`which ${cmd}`, { stdio: 'pipe' }); return true; }
  catch { return false; }
}

function esc(t) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function generateSceneSlide(sceneNum, sceneName, slideTitle, lessonNumber, courseCode, moduleLabel, lessonTitle, outputPath) {
  const isInsight = sceneNum === 6;
  const isSummary = sceneNum === 7;
  const bgFrom = isInsight ? '#7c3aed' : '#0b1120';
  const bgTo = isInsight ? '#4c1d95' : '#1e293b';
  const accent = isInsight ? '#fbbf24' : (isSummary ? '#10b981' : '#7c3aed');
  const svg = `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bgFrom}"/>
      <stop offset="100%" stop-color="${bgTo}"/>
    </linearGradient></defs>
    <rect width="1920" height="1080" fill="url(#bg)"/>
    <circle cx="1600" cy="200" r="400" fill="rgba(124,58,237,0.05)"/>
    <circle cx="300" cy="900" r="300" fill="rgba(16,185,129,0.04)"/>
    <text x="960" y="200" font-family="DejaVu Sans" font-size="22" font-weight="bold" fill="#64748b" text-anchor="middle" letter-spacing="3">${esc(sceneName.toUpperCase())}</text>
    ${isInsight ? '' : `<text x="960" y="280" font-family="DejaVu Sans" font-size="18" fill="#94a3b8" text-anchor="middle">${esc(courseCode)} • Module ${moduleLabel} • ${esc(lessonTitle)}</text>`}
    <text x="960" y="${isInsight ? 480 : 440}" font-family="DejaVu Sans" font-size="${isInsight ? 56 : 52}" font-weight="bold" fill="white" text-anchor="middle">${esc(slideTitle)}</text>
    ${isInsight ? `<text x="960" y="560" font-family="DejaVu Sans" font-size="24" fill="#fbbf24" text-anchor="middle" font-style="italic">"Risk is about readiness, not fear."</text>
    <text x="960" y="700" font-family="DejaVu Sans" font-size="18" fill="#cbd5e1" text-anchor="middle">CoverScore Academy — Professional Risk Advisory</text>` : ''}
    <rect x="860" y="${isInsight ? 620 : 510}" width="200" height="4" rx="2" fill="${accent}"/>
    <text x="960" y="950" font-family="DejaVu Sans" font-size="16" fill="#475569" text-anchor="middle">Scene ${sceneNum} of 7 — ${esc(sceneName)}</text>
  </svg>`;

  const svgFile = outputPath.replace('.png', '.svg');
  fs.writeFileSync(svgFile, svg);
  execSync(`convert "${svgFile}" -background none -flatten "${outputPath}"`, { stdio: 'pipe' });
  fs.unlinkSync(svgFile);
}

function narrationToSsml(text) {
  const xmlSafe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis">'
    + xmlSafe
      .replace(/\n\n+/g, '<break time="800ms"/>')
      .replace(/\n/g, '<break time="400ms"/>')
      .replace(/\.(?=\s)/g, '.<break time="300ms"/>')
      .replace(/,(?=\s)/g, ',<break time="150ms"/>')
      .replace(/\s{2,}/g, ' ')
    + '</speak>';
}

async function generateSceneClip(lessonId, scene, sceneNum, lessonTitle, courseCode, moduleLabel) {
  const slideFile = path.join(VIDEOS_DIR, `slide_${lessonId}_s${sceneNum}.png`);
  const audioFile = path.join(VIDEOS_DIR, `audio_${lessonId}_s${sceneNum}.mp3`);
  const clipFile = path.join(VIDEOS_DIR, `clip_${lessonId}_s${sceneNum}.mp4`);

  // 1. Generate slide
  const slideTitle = scene.slideTitle || scene.name;
  generateSceneSlide(sceneNum, SCENE_NAMES[sceneNum - 1], slideTitle, sceneNum, courseCode, moduleLabel, lessonTitle, slideFile);

  // 2. Generate audio
  const ssml = narrationToSsml(scene.narration);
  const audioResult = spawnSync('edge-tts', [
    '--voice', 'en-GB-SoniaNeural',
    '--rate=-15%',
    '--text', ssml,
    '--write-media', audioFile
  ], { stdio: 'pipe', timeout: 300000 });

  if (audioResult.status !== 0 || !fs.existsSync(audioFile)) {
    console.error(`  edge-tts failed for scene ${sceneNum} (lesson ${lessonId})`);
    return null;
  }

  // 3. Get audio duration
  const durOut = execSync(`ffprobe -i "${audioFile}" -show_entries format=duration -v quiet -of csv="p=0"`).toString().trim();
  const audioDur = Math.max(parseFloat(durOut) || scene.duration, 10);

  // 4. Encode single h264 frame from slide
  const frameFile = path.join(VIDEOS_DIR, `frame_${lessonId}_s${sceneNum}.mp4`);
  const frameArgs = [
    '-y', '-i', slideFile,
    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '40',
    '-tune', 'stillimage', '-pix_fmt', 'yuv420p',
    '-vf', 'scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2',
    '-frames:v', '1', '-an', frameFile
  ];
  const frameResult = spawnSync('ffmpeg', frameArgs, { stdio: 'pipe', timeout: 120000 });
  if (frameResult.status !== 0 || !fs.existsSync(frameFile)) {
    console.error(`  frame encode failed for scene ${sceneNum}`);
    try { fs.unlinkSync(slideFile); } catch {}
    try { fs.unlinkSync(audioFile); } catch {}
    return null;
  }

  // 5. Loop frame to audio duration with stream_loop
  const clipArgs = [
    '-y', '-stream_loop', '-1', '-i', frameFile,
    '-i', audioFile,
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '64k',
    '-t', String(Math.ceil(audioDur)),
    '-fflags', '+genpts',
    clipFile
  ];
  const clipResult = spawnSync('ffmpeg', clipArgs, { stdio: 'pipe', timeout: 300000 });
  try { fs.unlinkSync(frameFile); } catch {}

  if (clipResult.status !== 0 || !fs.existsSync(clipFile)) {
    console.error(`  clip render failed for scene ${sceneNum}`);
    try { fs.unlinkSync(slideFile); } catch {}
    try { fs.unlinkSync(audioFile); } catch {}
    return null;
  }

  return { clipFile, slideFile, audioFile, duration: audioDur };
}

async function generateVideo(lesson) {
  const { id, lesson_number, title, code, scene_data } = lesson;
  const courseCode = code || 'CCA';
  const moduleLabel = `${lesson.course_id || ''}.${lesson_number || ''}`;
  const safeTitle = title.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_').substring(0, 50);
  const videoFile = path.join(VIDEOS_DIR, `lesson_${id}_${safeTitle}.mp4`);

  if (fs.existsSync(videoFile)) {
    console.log(`  ✓ Already exists: ${path.basename(videoFile)}`);
    return videoFile;
  }

  // Parse scene data
  let scenes;
  try {
    scenes = JSON.parse(scene_data);
  } catch {
    console.error(`  No valid scene_data for lesson ${id}`);
    return null;
  }

  if (!scenes || scenes.length === 0) {
    console.error(`  Empty scene_data for lesson ${id}`);
    return null;
  }

  console.log(`  Generating ${scenes.length} scenes...`);

  const clipResults = [];
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const sceneNum = scene.id || (i + 1);
    process.stdout.write(`    Scene ${sceneNum}/7 (${SCENE_NAMES[sceneNum - 1] || scene.name})...`);
    const result = await generateSceneClip(id, scene, sceneNum, title, courseCode, moduleLabel);
    if (result) {
      clipResults.push(result);
      console.log(` ${Math.round(result.duration)}s ✓`);
    } else {
      console.log(` FAILED`);
      // Clean up any partial files
      clipResults.forEach(r => {
        try { fs.unlinkSync(r.clipFile); } catch {}
        try { fs.unlinkSync(r.slideFile); } catch {}
        try { fs.unlinkSync(r.audioFile); } catch {}
      });
      return null;
    }
  }

  // Concatenate all scene clips into final video
  console.log(`  Concatenating ${clipResults.length} scenes...`);
  const concatFile = path.join(VIDEOS_DIR, `concat_${id}.txt`);
  const concatContent = clipResults.map(r => `file '${r.clipFile.replace(/\\/g, '/')}'`).join('\n');
  fs.writeFileSync(concatFile, concatContent);

  // Use concat demuxer with -c copy (all clips have identical codec settings)
  const concatArgs = [
    '-y', '-f', 'concat', '-safe', '0',
    '-i', concatFile,
    '-c', 'copy',
    '-movflags', '+faststart',
    videoFile
  ];
  const concatResult = spawnSync('ffmpeg', concatArgs, { stdio: 'pipe', timeout: 600000 });

  // Cleanup temp files
  try { fs.unlinkSync(concatFile); } catch {}
  clipResults.forEach(r => {
    try { fs.unlinkSync(r.clipFile); } catch {}
    try { fs.unlinkSync(r.slideFile); } catch {}
    try { fs.unlinkSync(r.audioFile); } catch {}
  });

  if (concatResult.status !== 0 || !fs.existsSync(videoFile)) {
    console.error(`  ffmpeg concat failed:`, concatResult.stderr.toString().slice(0, 300));
    return null;
  }

  // Verify total duration
  const finalDur = execSync(`ffprobe -i "${videoFile}" -show_entries format=duration -v quiet -of csv="p=0"`).toString().trim();
  console.log(`  ✓ Final video: ${path.basename(videoFile)} (${Math.round(parseFloat(finalDur))}s, ${Math.round(clipResults.reduce((s, r) => s + r.duration, 0))}s audio)`);
  return videoFile;
}

async function main() {
  console.log('=== CoverScore Academy — 7-Scene Production Generator ===\n');

  if (!checkTool('ffmpeg')) { console.log('FFmpeg not found.'); process.exit(1); }
  if (!checkTool('convert')) { console.log('ImageMagick not found.'); process.exit(1); }
  if (!checkTool('edge-tts')) { console.log('edge-tts not found.'); process.exit(1); }
  console.log('All tools available.\n');

  console.log('Querying lessons needing video generation...');
  const lessons = await new Promise((res, rej) => {
    db.all(`SELECT m.*, c.code FROM academy_modules m LEFT JOIN academy_courses c ON c.id = m.course_id WHERE m.video_url IS NULL AND m.scene_data IS NOT NULL ORDER BY m.course_id, m.lesson_number`, (err, rows) => {
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
