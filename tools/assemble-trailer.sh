#!/bin/bash
# ---------------------------------------------------------------------------
# assemble-trailer.sh — frames + score + VO session → finished mp4.
#
#   tools/assemble-trailer.sh <framesdir> <session.json> <voicesdir> <out.mp4>
#
# <framesdir> is a headless.mjs output dir: f_%06d.jpg + score.wav + marks.json.
# Voices are piper models (see tools/vo-piper.py header). The video is padded
# with a 2 s freeze of the last frame so the PA gag can finish over the logo.
# Uses imageio-ffmpeg's static ffmpeg when the system has none (pip install
# imageio-ffmpeg).
# ---------------------------------------------------------------------------
set -e
FRAMES=$1; SESSION=$2; VOICES=$3; OUT=$4
[ -z "$OUT" ] && { echo "usage: $0 <framesdir> <session.json> <voicesdir> <out.mp4>"; exit 1; }
FF=$(python3 -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())" 2>/dev/null || echo ffmpeg)
HERE=$(cd "$(dirname "$0")" && pwd)
VODIR=$(dirname "$OUT")/vo-$(basename "$OUT" .mp4)

python3 "$HERE/vo-piper.py" "$SESSION" --marks "$FRAMES/marks.json" \
  --voices "$VOICES" --out "$VODIR" --bed "$FRAMES/score.wav"

"$FF" -y -framerate 30 -i "$FRAMES/f_%06d.jpg" -i "$VODIR/vo-mix.wav" \
  -filter_complex "[0:v]tpad=stop_mode=clone:stop_duration=2.0,format=yuv420p[v]" \
  -map "[v]" -map 1:a -c:v libx264 -crf 19 -preset medium -c:a aac -b:a 192k \
  -shortest -movflags +faststart "$OUT"
echo "assembled → $OUT"
