#!/usr/bin/env python3
"""Generate a lesson video with Agnes AI talking-head avatar composited over slide backgrounds."""

import sqlite3
import json
import os
import sys
import time
import requests
import subprocess
import re

AGNES_URL = "http://localhost:8765"
REFERENCE_IMAGE_URL = "http://163.245.210.111:8765/api/image/081c4d14e352"
DB_PATH = "/root/CoverScoreAI/data/coverscore.db"
OUTPUT_DIR = "/root/CoverScoreAI/public/videos"
AVATAR_HEIGHT = 360
MARGIN = 30


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
    slide_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e3a5f"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <rect x="60" y="180" width="1160" height="400" rx="20" fill="rgba(255,255,255,0.06)"/>
  <text x="640" y="260" text-anchor="middle" font-family="Georgia,serif" font-size="42" fill="#e2e8f0">{scene.get("title","")}</text>
  <text x="640" y="370" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" fill="#94a3b8" opacity="0.9"><tspan x="640" dy="0">{scene.get("subtitle","")}</tspan></text>
  <text x="640" y="550" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#64748b">{scene.get("scene_type","")}</text>
</svg>"""
    svg_path = os.path.join(workdir, f"slide_{scene_index}.svg")
    png_path = os.path.join(workdir, f"slide_{scene_index}.png")
    with open(svg_path, "w") as f:
        f.write(slide_svg)
    subprocess.run(
        ["rsvg-convert", svg_path, "-o", png_path, "-w", "1280", "-h", "720"],
        check=True,
    )
    return png_path


def generate_anchor_clip(narration, workdir, scene_index):
    print(f"  Submitting anchor task for scene {scene_index}...")
    data = {
        "anchor_reference_image": REFERENCE_IMAGE_URL,
        "script_text": narration,
        "audio_voice": "en-GB-SoniaNeural",
        "audio_rate": "-15%",
        "video_width": 768,
        "video_height": 1344,
        "audio_enabled": True,
        "subtitle_enabled": False,
    }
    r = requests.post(f"{AGNES_URL}/api/tasks/anchor", data=data)
    r.raise_for_status()
    task_id = r.json()["task_id"]

    for attempt in range(60):
        time.sleep(15)
        r = requests.get(f"{AGNES_URL}/api/tasks/{task_id}")
        status = r.json().get("status")
        msg = r.json().get("current_message", "")
        print(f"    Status: {status} - {msg}")
        if status == "completed":
            final_video = r.json().get("final_video_file", "")
            if final_video:
                dest = os.path.join(workdir, f"anchor_{scene_index}.mp4")
                video_url = f"{AGNES_URL}/api/video/{task_id}"
                vr = requests.get(video_url)
                with open(dest, "wb") as f:
                    f.write(vr.content)
                return dest
            break
        elif status == "failed":
            print(f"    FAILED: {r.json().get('current_message','')}")
            return None
    return None


def composite_scene(slide_png, anchor_mp4, output_path, workdir):
    probe = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_streams", anchor_mp4],
        capture_output=True,
        text=True,
    )
    info = json.loads(probe.stdout)
    vstream = [s for s in info["streams"] if s["codec_type"] == "video"][0]
    aw, ah = int(vstream["width"]), int(vstream["height"])

    scale_ratio = AVATAR_HEIGHT / ah
    avatar_w = int(aw * scale_ratio)
    pos_x = 1280 - avatar_w - MARGIN
    pos_y = 720 - AVATAR_HEIGHT - MARGIN

    filter_graph = f"[1:v]scale={avatar_w}:{AVATAR_HEIGHT}[av];[0:v][av]overlay={pos_x}:{pos_y}"

    temp_out = output_path + ".tmp.mp4"
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            slide_png,
            "-i",
            anchor_mp4,
            "-filter_complex",
            filter_graph,
            "-c:v",
            "libx264",
            "-preset",
            "fast",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-shortest",
            temp_out,
        ],
        check=True,
        capture_output=True,
    )
    os.replace(temp_out, output_path)
    return output_path


def concatenate_scenes(scene_videos, output_path):
    list_path = os.path.join(os.path.dirname(scene_videos[0]), "concat_list.txt")
    with open(list_path, "w") as f:
        for v in scene_videos:
            v_fixed = v.replace(".mp4", ".fixed.mp4")
            subprocess.run(
                [
                    "ffmpeg",
                    "-y",
                    "-i",
                    v,
                    "-vf",
                    "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2",
                    "-c:v",
                    "libx264",
                    "-preset",
                    "fast",
                    "-pix_fmt",
                    "yuv420p",
                    "-c:a",
                    "aac",
                    "-b:a",
                    "128k",
                    v_fixed,
                ],
                check=True,
                capture_output=True,
            )
            f.write(f"file '{v_fixed}'\n")

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            list_path,
            "-c",
            "copy",
            output_path,
        ],
        check=True,
    )
    return output_path


def main(lesson_id):
    print(f"=== Generating anchor video for Lesson {lesson_id} ===")
    scenes = get_scenes(lesson_id)
    print(f"Found {len(scenes)} scenes")

    workdir = os.path.join(OUTPUT_DIR, f"anchor_work_{lesson_id}")
    os.makedirs(workdir, exist_ok=True)

    scene_videos = []

    for i, scene in enumerate(scenes):
        print(f"\n--- Scene {i+1}: {scene.get('title','')} ---")
        narration = scene.get("narration", "")
        if not narration:
            print("  No narration, skipping")
            continue

        print("  Generating slide background...")
        slide_png = generate_slide(scene, i, workdir)

        print("  Generating anchor clip...")
        anchor_video = generate_anchor_clip(narration, workdir, i)
        if not anchor_video:
            print(f"  FAILED to generate anchor for scene {i+1}")
            continue

        print("  Compositing...")
        scene_out = os.path.join(workdir, f"scene_{i}.mp4")
        composite_scene(slide_png, anchor_video, scene_out, workdir)
        scene_videos.append(scene_out)
        print(f"  Scene {i+1} complete: {scene_out}")

    if scene_videos:
        print(f"\n=== Concatenating {len(scene_videos)} scenes ===")
        final_output = os.path.join(OUTPUT_DIR, f"lesson_{lesson_id}_anchor.mp4")
        concatenate_scenes(scene_videos, final_output)

        size_mb = os.path.getsize(final_output) / 1024 / 1024
        duration_out = subprocess.run(
            ["ffprobe", "-v", "quiet", "-show_format", final_output],
            capture_output=True,
            text=True,
        )
        dur_match = re.search(r"duration=([\d.]+)", duration_out.stdout)
        dur = float(dur_match.group(1)) if dur_match else 0
        print(f"\n=== DONE! ===")
        print(f"Output: {final_output}")
        print(f"Size: {size_mb:.1f} MB")
        print(f"Duration: {dur:.1f}s")
    else:
        print("No scenes were generated!")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: generate_anchor_video.py <lesson_id>")
        sys.exit(1)
    main(int(sys.argv[1]))
