#!/usr/bin/env bash
# Encode the owner's hero video for the Sapa Food website: FULL LENGTH, no trimming, audio stripped.
# The loop point fades through the hero's dark colour (#24140E): fade-in over the first FADE s, fade-out over the last FADE s.
# ffmpeg: uses the imageio-ffmpeg static build (pip install imageio-ffmpeg) if system ffmpeg is missing.
# Usage: ./encode_hero_video.sh /app/media_src/<source>.mp4 [poster_second]
#   SKIP_POSTER=1 ./encode_hero_video.sh ...   keeps the existing poster images
# Outputs to /app/frontend/public/media/ (sources are already wired in /app/frontend/src/config/hero.js).
# Targets: desktop 1080p ≤ 15 MB, mobile 720p ≤ 6 MB (bitrate caps sized for ~38 s; lower -maxrate for longer videos).
set -euo pipefail
IN="${1:?input video required}"
POSTER_T="${2:-1.2}"
FADE="${FADE:-0.4}"
FADE_COLOR="0x24140E"
OUT=/app/frontend/public/media
FF=$(command -v ffmpeg || python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
mkdir -p "$OUT"

DUR=$( ("$FF" -hide_banner -i "$IN" 2>&1 || true) | sed -n 's/.*Duration: \([0-9:.]*\).*/\1/p' | awk -F: '{print $1*3600+$2*60+$3}')
FADE_OUT_START=$(awk -v d="$DUR" -v f="$FADE" 'BEGIN{printf "%.3f", d-f}')
FADES="fade=t=in:st=0:d=${FADE}:color=${FADE_COLOR},fade=t=out:st=${FADE_OUT_START}:d=${FADE}:color=${FADE_COLOR}"
echo "duration=${DUR}s fade-out starts at ${FADE_OUT_START}s"

"$FF" -y -loglevel error -i "$IN" -an -vf "scale=-2:'min(1080,ih)':flags=lanczos,fps=30,${FADES}" -c:v libx264 -preset slow -crf 24 \
  -maxrate 3000k -bufsize 6000k -profile:v high -pix_fmt yuv420p -movflags +faststart "$OUT/hero.mp4" &
"$FF" -y -loglevel error -i "$IN" -an -vf "scale=-2:'min(720,ih)':flags=lanczos,fps=30,${FADES}" -c:v libx264 -preset slow -crf 26 \
  -maxrate 1200k -bufsize 2400k -profile:v main -pix_fmt yuv420p -movflags +faststart "$OUT/hero-720.mp4" &
"$FF" -y -loglevel error -i "$IN" -an -vf "scale=-2:'min(1080,ih)':flags=lanczos,fps=30,${FADES}" -c:v libvpx-vp9 -crf 34 -b:v 2800k \
  -row-mt 1 -deadline good -cpu-used 4 "$OUT/hero.webm" &
"$FF" -y -loglevel error -i "$IN" -an -vf "scale=-2:'min(720,ih)':flags=lanczos,fps=30,${FADES}" -c:v libvpx-vp9 -crf 38 -b:v 1100k \
  -row-mt 1 -deadline good -cpu-used 4 "$OUT/hero-720.webm" &
wait

# Poster: sharp frame near the start of the SOURCE (not the faded first frame)
if [ -z "${SKIP_POSTER:-}" ]; then
  "$FF" -y -loglevel error -ss "$POSTER_T" -i "$IN" -frames:v 1 -vf "scale=1920:-2:flags=lanczos" -q:v 3 "$OUT/hero-poster.jpg"
  "$FF" -y -loglevel error -ss "$POSTER_T" -i "$IN" -frames:v 1 -vf "scale=1280:-2:flags=lanczos" -q:v 4 "$OUT/hero-poster-mobile.jpg"
fi

ls -lh "$OUT"/hero*
echo DONE
