#!/usr/bin/env python3
"""Kokoro TTS daemon — reads JSON lines from stdin, writes WAV.
Usage: echo '{"text":"...","output":"/path/to.wav","voice":"bf_alice"}' | python3 tts_kokoro.py
Keeps the pipeline alive across invocations to avoid model reload.
"""
import sys, json, os, numpy as np, soundfile as sf

# Load pipeline once at startup
from kokoro import KPipeline
pipeline = KPipeline(lang_code='b')

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        req = json.loads(line)
    except json.JSONDecodeError as e:
        print(f'{{"error":"json: {e}"}}', file=sys.stderr)
        continue

    text = req.get('text', '').strip()
    output = req.get('output', '')
    voice = req.get('voice', 'bf_alice')

    if not text:
        print(f'{{"error":"empty text"}}', file=sys.stderr)
        continue

    segments = []
    for gs, ps, audio in pipeline(text, voice=voice, speed=1.0):
        segments.append(audio)

    if not segments:
        print(f'{{"error":"no audio"}}', file=sys.stderr)
        continue

    full = np.concatenate(segments)
    sf.write(output, full, 24000)
    dur = len(full) / 24000
    print(f'{{"ok":true,"output":"{output}","duration":{dur:.1f}}}')
    sys.stdout.flush()
