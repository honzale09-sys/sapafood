// ============================================================
// HERO VIDEO: the ONLY file to edit when swapping the video.
// Source: owner's 0929.mp4 (kept outside public in /app/media_src/).
// Re-encode: /app/scripts/encode_hero_video.sh (full length, no audio).
// Phones (<768px) load only the 720p sources; desktop loads 1080p.
// Poster = sharp frame from the start of the video. It shows while loading and
// is the fallback (reduced motion, Save-Data / slow connection, autoplay blocked).
// ============================================================
export const HERO = {
  poster: "/media/hero-poster.jpg",
  posterMobile: "/media/hero-poster-mobile.jpg",
  desktop: [
    { src: "/media/hero.webm", type: "video/webm" },
    { src: "/media/hero.mp4", type: "video/mp4" },
  ],
  mobile: [
    { src: "/media/hero-720.webm", type: "video/webm" },
    { src: "/media/hero-720.mp4", type: "video/mp4" },
  ],
};
