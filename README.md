# 🐍 Snake Premium - Cyberpunk Edition

A modern, high-performance Snake game with stunning cyberpunk aesthetics, advanced power-ups, and progressive difficulty.

## 🎮 Play Now

**Live Demo:** [https://YOUR-USERNAME.github.io/snake-pwa/](https://YOUR-USERNAME.github.io/snake-pwa/)

## ✨ Features

- 🎨 **Stunning Cyberpunk Design** - Neon colors, particle effects, and smooth animations
- 🐍 **7 Unique Snake Heads** - Mecha, Bio, Holo variants with detailed 2D designs
- ⚡ **Power-Up System** - Fire, Ice, Lightning abilities with visual effects
- 👾 **Enemy Combat** - Invincibility stars and enemy waves
- 📊 **Floating Combat Text** - Real-time score feedback and combo notifications
- 🏆 **Progression System** - Level-based difficulty, upgrades shop with Bytes currency
- 📱 **PWA Support** - Install on mobile, works offline
- 🎯 **Smooth Gameplay** - 60 FPS with interpolated movement

## 🚀 Installation

### Play on Mobile (iOS/Android)
1. Open the game link in Safari (iOS) or Chrome (Android)
2. Tap "Share" → "Add to Home Screen"
3. Launch from your home screen - works offline!

### Run Locally
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
npm run preview
```

## 🎮 Controls

- **Desktop:** Arrow keys or WASD
- **Mobile:** Swipe gestures
- **Pause:** ESC or P

## 🛠️ Tech Stack

- **Vanilla JavaScript** - No frameworks, pure performance
- **Canvas API** - Hardware-accelerated 2D rendering
- **Vite** - Lightning-fast build tool
- **PWA** - Service Worker for offline support

## 📦 Project Structure

```
snake-pwa/
├── src/
│   ├── main.js          # Game engine & logic
│   └── style.css        # UI styling
├── public/
│   ├── manifest.json    # PWA manifest
│   └── sw.js           # Service Worker
├── index.html          # Entry point
└── style.css           # Global styles
```

## 🎨 Customization

All game parameters can be adjusted in `src/main.js`:
- Snake speed progression
- Power-up durations
- Enemy spawn rates
- Level difficulty curves

## 📄 License

MIT License - Feel free to use and modify!

## 🙏 Credits

Created with ❤️ by Antigravity
