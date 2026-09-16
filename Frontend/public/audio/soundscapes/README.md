# Ambient Soundscapes Audio Directory

This directory is designated for royalty-free, licensed ambient soundscapes for the SmritiSetu Calm & Relax feature.

## Required Tracks

Before shipping to production, place high-quality, royalty-free audio tracks (MP3 or OGG, stereo, normalized at -14 LUFS) corresponding to:

1. `brahmaputra_river.mp3` - Gentle flowing Brahmaputra water
2. `bamboo_flute.mp3` - Meditative bamboo flute melodies
3. `mountain_rain.mp3` - Soothing mountain rain and forest breeze
4. `temple_bells.mp3` - Resonant temple bells and chimes

## Graceful Fallback

When audio tracks are not yet present, the SoundscapePlayer in the frontend gracefully detects missing files (HTTP 404 / decode errors) and marks them as "Coming Soon" without disrupting the user experience or throwing unhandled errors.

> **Notice**: Do NOT commit copyrighted audio assets to this repository. All tracks must be explicitly licensed for distribution.
