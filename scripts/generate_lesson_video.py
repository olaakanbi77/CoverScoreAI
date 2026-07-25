#!/usr/bin/env python3
"""Generate a lesson video with slides, narration audio, and burned-in subtitles."""

import sqlite3
import json
import os
import sys
import subprocess
import re
import math

DB_PATH = "/root/CoverScoreAI/data/coverscore.db"
OUTPUT_DIR = "/root/CoverScoreAI/public/videos"

VOICE = "en-NG-EzinneNeural"
RATE = "-15%"
FPS = 25
WIDTH, HEIGHT = 1280, 720


def get_scenes(lesson_id):
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute(
        "SELECT scene_data FROM academy_modules WHERE id = ?", (lesson_id,)
    ).fetchone()
    conn.close()
    if not row:
        raise ValueError(f"Lesson {lesson_id} not found")
    return json.loads(row[0])


def generate_slide(scene, scene_index, workdir):
    scene_labels = [
        "Welcome", "Learning Objectives", "Main Concept", "Deep Dive",
        "Practical Application", "CoverScore Insight", "Lesson Summary"
    ]
    scene_num = scene.get("id", scene_index + 1)
    scene_label = scene.get("name",
                            scene_labels[scene_index] if scene_index < len(scene_labels) else f"Scene {scene_num}")
    title = scene.get("slideTitle", scene_label)
    slide_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a1628"/>
      <stop offset="50%" stop-color="#132543"/>
      <stop offset="100%" stop-color="#1a365d"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#00b4d8"/>
      <stop offset="100%" stop-color="#0077b6"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <rect x="0" y="0" width="1280" height="6" fill="url(#accent)"/>
  <rect x="60" y="40" width="200" height="36" rx="18" fill="rgba(0,180,216,0.15)"/>
  <text x="640" y="200" text-anchor="middle" font-family="DejaVu Serif,serif" font-size="44" fill="#ffffff" font-weight="bold">{title}</text>
  <text x="640" y="260" text-anchor="middle" font-family="DejaVu Sans,sans-serif" font-size="18" fill="#94a3b8">{scene_label}</text>
  <rect x="605" y="290" width="70" height="3" rx="1.5" fill="#00b4d8"/>
  <rect x="60" y="420" width="1160" height="200" rx="12" fill="rgba(255,255,255,0.04)"/>
  <text x="640" y="470" text-anchor="middle" font-family="DejaVu Sans,sans-serif" font-size="20" fill="#cbd5e1">CoverScore Academy</text>
  <text x="640" y="500" text-anchor="middle" font-family="DejaVu Sans,sans-serif" font-size="14" fill="#64748b">Certified Coverage Advisor - Module 1</text>
  <text x="1200" y="690" text-anchor="end" font-family="DejaVu Sans,sans-serif" font-size="12" fill="#475569">coverscore.site</text>
</svg>"""
    svg_path = os.path.join(workdir, f"slide_{scene_index}.svg")
    png_path = os.path.join(workdir, f"slide_{scene_index}.png")
    with open(svg_path, "w") as f:
        f.write(slide_svg)
    subprocess.run(
        ["rsvg-convert", svg_path, "-o", png_path, "-w", str(WIDTH), "-h", str(HEIGHT)],
        check=True, capture_output=True,
    )
    return png_path


def generate_scene_media(narration, workdir, scene_index):
    safe_text = re.sub(r'["\'\\]', '', narration)
    audio_path = os.path.join(workdir, f"audio_{scene_index}.mp3")
    raw_srt = os.path.join(workdir, f"subs_raw_{scene_index}.srt")

    subprocess.run([
        "edge-tts", "--voice", VOICE, "--rate", RATE,
        "--text", safe_text,
        "--write-media", audio_path,
        "--write-subtitles", raw_srt,
    ], check=True, capture_output=True)

    srt_path = os.path.join(workdir, f"subs_{scene_index}.srt")
    _make_typing_srt(raw_srt, srt_path)
    return audio_path, srt_path


def _make_typing_srt(raw_srt, output_srt):
    """Convert edge-tts SRT into a word-by-word typing-style SRT."""
    if not os.path.exists(raw_srt):
        with open(output_srt, "w") as f:
            f.write("1\n00:00:00,000 --> 00:00:01,000\n\n")
        return

    with open(raw_srt, "r") as f:
        content = f.read()

    segments = re.findall(
        r"(\d+)\n(\d{2}:\d{2}:\d{2}[,\\.]\d{3}) --> (\d{2}:\d{2}:\d{2}[,\\.]\d{3})\n([\s\S]*?)(?=\n\n|\Z)",
        content
    )

    if not segments:
        with open(output_srt, "w") as f:
            f.write("1\n00:00:00,000 --> 00:00:01,000\n\n")
        return

    def _ts_to_ms(ts):
        ts = ts.replace(",", ".")
        h, m, s = ts.split(":")
        return int(int(h) * 3600000 + int(m) * 60000 + float(s) * 1000)

    def _ms_to_ts(ms):
        h = ms // 3600000
        m = (ms % 3600000) // 60000
        s = (ms % 60000) / 1000.0
        return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".", ",")

    typing_entries = []
    entry_num = 1

    for _, start_ts, end_ts, text in segments:
        words = text.strip().split()
        if not words:
            continue
        seg_start = _ts_to_ms(start_ts)
        seg_end = _ts_to_ms(end_ts)
        seg_dur = seg_end - seg_start
        word_dur = seg_dur / len(words)

        for w in range(1, len(words) + 1):
            t_start = int(seg_start + (w - 1) * word_dur)
            t_end = int(seg_start + w * word_dur)
            display_text = " ".join(words[:w])
            typing_entries.append((entry_num, t_start, t_end, display_text))
            entry_num += 1

    with open(output_srt, "w") as f:
        for num, start_ms, end_ms, text in typing_entries:
            f.write(f"{num}\n{_ms_to_ts(start_ms)} --> {_ms_to_ts(end_ms)}\n{text}\n\n")


def get_media_duration(file_path):
    r = subprocess.run(["ffprobe", "-v", "quiet", "-show_format", file_path],
                       capture_output=True, text=True)
    m = re.search(r"duration=([\d.]+)", r.stdout)
    return float(m.group(1)) if m else 0


def build_scene_video(slide_png, audio_path, srt_path, output_path, workdir):
    duration = get_media_duration(audio_path)
    total_frames = max(int(duration * FPS), 1)

    zoom_end = 1.04
    zoom_step = (zoom_end - 1.0) / total_frames if total_frames > 0 else 0

    zoom_expr = f"zoompan=z='if(eq(on,1),1,min(zoom+{zoom_step},{zoom_end}))':d=1:s={WIDTH}x{HEIGHT}:fps={FPS}"

    temp_raw = os.path.join(workdir, f"raw_{os.path.basename(output_path)}")
    subprocess.run([
        "ffmpeg", "-y",
        "-loop", "1", "-i", slide_png,
        "-i", audio_path,
        "-vf", f"{zoom_expr},subtitles={srt_path}:force_style='Fontsize=20,Alignment=2,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3,Outline=2,Shadow=1'",
        "-c:v", "libx264", "-preset", "fast", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k",
        "-shortest", "-t", str(duration),
        temp_raw,
    ], check=True, capture_output=True)

    os.replace(temp_raw, output_path)
    return output_path


def concatenate_scenes(scene_videos, output_path):
    list_path = os.path.join(os.path.dirname(scene_videos[0]), "concat_list.txt")
    with open(list_path, "w") as f:
        for v in scene_videos:
            f.write(f"file '{v}'\n")
    subprocess.run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", list_path, "-c", "copy", output_path,
    ], check=True)


def main(lesson_id):
    print(f"=== Generating slides-only video for Lesson {lesson_id} ===")
    scenes = get_scenes(lesson_id)
    print(f"Found {len(scenes)} scenes")

    workdir = os.path.join(OUTPUT_DIR, f"work_{lesson_id}")
    os.makedirs(workdir, exist_ok=True)
    scene_videos = []

    for i, scene in enumerate(scenes):
        print(f"\n--- Scene {i+1}: {scene.get('slideTitle', scene.get('name', ''))} ---")
        narration = scene.get("narration", "")
        if not narration:
            print("  No narration, skipping")
            continue

        print("  Generating slide...")
        slide_png = generate_slide(scene, i, workdir)

        print("  Generating audio + subtitles...")
        audio_path, srt_path = generate_scene_media(narration, workdir, i)

        print("  Building scene video...")
        scene_out = os.path.join(workdir, f"scene_{i}.mp4")
        build_scene_video(slide_png, audio_path, srt_path, scene_out, workdir)
        scene_videos.append(scene_out)
        print(f"  Scene {i+1} complete")

    if scene_videos:
        print(f"\n=== Concatenating {len(scene_videos)} scenes ===")
        final_output = os.path.join(OUTPUT_DIR, f"lesson_{lesson_id}.mp4")
        concatenate_scenes(scene_videos, final_output)

        size_mb = os.path.getsize(final_output) / 1024 / 1024
        dur_out = subprocess.run(
            ["ffprobe", "-v", "quiet", "-show_format", final_output],
            capture_output=True, text=True,
        )
        dm = re.search(r"duration=([\d.]+)", dur_out.stdout)
        dur = float(dm.group(1)) if dm else 0
        print(f"\n=== DONE! ===")
        print(f"Output: {final_output}")
        print(f"Size: {size_mb:.1f} MB")
        print(f"Duration: {dur:.1f}s")
    else:
        print("No scenes were generated!")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: generate_lesson_video.py <lesson_id>")
        sys.exit(1)
    main(int(sys.argv[1]))
