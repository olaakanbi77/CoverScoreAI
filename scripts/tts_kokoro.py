#!/usr/bin/env python3
"""Kokoro TTS wrapper for CoverScore Academy video generation.
Usage: python tts_kokoro.py <text_file> <output_wav> [voice]
Reads text from file, outputs WAV at 24kHz using Kokoro-82M.
"""
import sys, os, numpy as np, soundfile as sf
from kokoro import KPipeline

def generate(text_path: str, output_path: str, voice: str = 'bf_alice'):
    with open(text_path, 'r', encoding='utf-8') as f:
        text = f.read().strip()
    if not text:
        print('  [kokoro] empty text', file=sys.stderr)
        return False

    lang = voice[0]  # 'b' for British, 'a' for American
    pipeline = KPipeline(lang_code=lang)

    segments = []
    for gs, ps, audio in pipeline(text, voice=voice, speed=1.0):
        segments.append(audio)

    if not segments:
        print('  [kokoro] no audio generated', file=sys.stderr)
        return False

    full = np.concatenate(segments)
    sf.write(output_path, full, 24000)
    return True

if __name__ == '__main__':
    args = sys.argv[1:]
    if len(args) < 2:
        print('Usage: tts_kokoro.py <text_file> <output_wav> [voice]', file=sys.stderr)
        sys.exit(1)
    text_file = args[0]
    wav_file = args[1]
    voice = args[2] if len(args) > 2 else 'bf_alice'
    ok = generate(text_file, wav_file, voice)
    sys.exit(0 if ok else 1)
