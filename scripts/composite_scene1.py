#!/usr/bin/env python3
"""Composite missing scene 1 and insert into final video."""

import requests, subprocess, os, json

workdir = "/root/CoverScoreAI/public/videos/anchor_work_50"
final_video = "/root/CoverScoreAI/public/videos/lesson_50_anchor.mp4"
output_video = "/root/CoverScoreAI/public/videos/lesson_50_anchor_full.mp4"

AVATAR_HEIGHT = 360
MARGIN = 30

slide_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
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
  <text x="160" y="63" text-anchor="middle" font-family="DejaVu Sans,sans-serif" font-size="14" fill="#00b4d8" font-weight="bold">SCENE 2 OF 7</text>
  <text x="640" y="200" text-anchor="middle" font-family="DejaVu Serif,serif" font-size="44" fill="#ffffff" font-weight="bold">Learning Objectives</text>
  <text x="640" y="260" text-anchor="middle" font-family="DejaVu Sans,sans-serif" font-size="18" fill="#94a3b8">Learning Objectives</text>
  <rect x="605" y="290" width="70" height="3" rx="1.5" fill="#00b4d8"/>
  <rect x="60" y="420" width="1160" height="200" rx="12" fill="rgba(255,255,255,0.04)"/>
  <text x="640" y="470" text-anchor="middle" font-family="DejaVu Sans,sans-serif" font-size="20" fill="#cbd5e1">CoverScore Academy</text>
  <text x="640" y="500" text-anchor="middle" font-family="DejaVu Sans,sans-serif" font-size="14" fill="#64748b">Certified Coverage Advisor - Module 1</text>
  <text x="1200" y="690" text-anchor="end" font-family="DejaVu Sans,sans-serif" font-size="12" fill="#475569">coverscore.site</text>
</svg>"""

svg_path = os.path.join(workdir, "slide_1_new.svg")
png_path = os.path.join(workdir, "slide_1_new.png")
with open(svg_path, "w") as f:
    f.write(slide_svg)
subprocess.run(["rsvg-convert", svg_path, "-o", png_path, "-w", "1280", "-h", "720"], check=True)
print("Slide rendered")

ank_url = "http://localhost:8765/api/video/ff10a8dc452e"
ank_path = os.path.join(workdir, "anchor_1_new.mp4")
r = requests.get(ank_url)
with open(ank_path, "wb") as f:
    f.write(r.content)
print(f"Anchor downloaded: {len(r.content)} bytes")

probe = subprocess.run(["ffprobe", "-v", "quiet", "-print_format", "json", "-show_streams", ank_path], capture_output=True, text=True)
info = json.loads(probe.stdout)
vs = [s for s in info["streams"] if s["codec_type"] == "video"][0]
aw, ah = int(vs["width"]), int(vs["height"])
scale_ratio = AVATAR_HEIGHT / ah
av_w = int(aw * scale_ratio)
px = 1280 - av_w - MARGIN
py = 720 - AVATAR_HEIGHT - MARGIN

fg = f"[1:v]scale={av_w}:{AVATAR_HEIGHT},format=rgba,"
fg += f"drawbox=x=0:y={AVATAR_HEIGHT-2}:w={av_w}:h=2:c=#00b4d8@0.8:t=fill,"
fg += f"drawbox=x={av_w-2}:y=0:w=2:h={AVATAR_HEIGHT}:c=#00b4d8@0.8:t=fill,"
fg += f"drawbox=x=0:y=0:w={av_w}:h=2:c=#00b4d8@0.8:t=fill,"
fg += f"drawbox=x=0:y=0:w=2:h={AVATAR_HEIGHT}:c=#00b4d8@0.8:t=fill[av];"
fg += f"[0:v][av]overlay={px}:{py}"

scene1_out = os.path.join(workdir, "scene_1_new.mp4")
subprocess.run(["ffmpeg", "-y", "-i", png_path, "-i", ank_path, "-filter_complex", fg, "-c:v", "libx264", "-preset", "fast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", scene1_out], check=True, capture_output=True)
print(f"Scene 1 composited: {scene1_out}")

# Get duration of scene 0 to know split point
probe0 = subprocess.run(["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", os.path.join(workdir, "scene_0.mp4")], capture_output=True, text=True)
dur0 = float(json.loads(probe0.stdout)["format"]["duration"])
print(f"Scene 0 duration: {dur0}s")

# Split original final video at dur0
part1 = os.path.join(workdir, "part1.mp4")
part2 = os.path.join(workdir, "part2.mp4")
subprocess.run(["ffmpeg", "-y", "-i", final_video, "-t", str(dur0), "-c", "copy", part1], check=True)
subprocess.run(["ffmpeg", "-y", "-i", final_video, "-ss", str(dur0), "-c", "copy", part2], check=True)

# Concatenate part1 + scene1 + part2
concat_file = os.path.join(workdir, "concat_final.txt")
with open(concat_file, "w") as f:
    for v in [part1, scene1_out, part2]:
        v_fixed = v.replace(".mp4", ".fixed.mp4")
        subprocess.run(["ffmpeg", "-y", "-i", v, "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2", "-c:v", "libx264", "-preset", "fast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", v_fixed], check=True, capture_output=True)
        f.write(f"file '{v_fixed}'\n")

subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_file, "-c", "copy", output_video], check=True)

import re
dur_out = subprocess.run(["ffprobe", "-v", "quiet", "-show_format", output_video], capture_output=True, text=True)
dm = re.search(r"duration=([\d.]+)", dur_out.stdout)
dur = float(dm.group(1)) if dm else 0
print(f"\nFINAL: {output_video}")
print(f"Duration: {dur:.1f}s")
print(f"Size: {os.path.getsize(output_video)/1024/1024:.1f} MB")
