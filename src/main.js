import '../style.css';

class SnakeGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.scoreElement = document.getElementById('current-score');
    this.highScoreElement = document.getElementById('high-score');
    this.startOverlay = document.getElementById('start-overlay');
    this.gameOverOverlay = document.getElementById('game-over-overlay');
    this.startBtn = document.getElementById('start-btn');
    this.restartBtn = document.getElementById('restart-btn');

    this.gridSize = 16;
    this.snake = [];
    this.prevSnake = [];
    this.food = { x: -1, y: -1, type: 'NORMAL' };
    this.direction = 'right';
    this.nextDirection = 'right';
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('snake-high-score')) || 0;
    this.gameLoop = null;
    this.speed = 150;
    this.isPaused = false;
    this.shakeIntensity = 0;
    this.shakeTime = 0;
    this.lastUpdate = 0;
    this.lerpStep = 0;
    this.dpr = window.devicePixelRatio || 1;
    this.level = 1;
    this.obstacles = [];
    this.bossFood = null;

    // UI Elements
    this.levelElement = document.getElementById('current-level');
    this.bytesElement = document.getElementById('current-bytes');
    this.shopBtn = document.getElementById('shop-btn');
    this.shopOverlay = document.getElementById('shop-overlay');
    this.closeShopBtn = document.getElementById('close-shop');
    this.rewardInfo = document.getElementById('reward-info');
    this.pauseOverlay = document.getElementById('pause-overlay');
    this.resumeBtn = document.getElementById('resume-btn');
    this.muteBtn = document.getElementById('mute-btn');
    this.hofList = document.getElementById('high-scores-list');
    this.homeBtn = document.getElementById('home-btn');
    this.dashBtn = document.getElementById('mobile-dash-btn');
    this.btnUp = document.getElementById('btn-up');
    this.btnDown = document.getElementById('btn-down');
    this.btnLeft = document.getElementById('btn-left');
    this.btnRight = document.getElementById('btn-right');

    // State
    this.bytes = parseInt(localStorage.getItem('snake-bytes')) || 0;
    this.upgrades = JSON.parse(localStorage.getItem('snake-upgrades')) || { magnet: false, shield: false, duration: false };
    this.currentSkin = localStorage.getItem('snake-skin') || 'default';
    this.currentHead = localStorage.getItem('snake-head') || 'default';
    this.hallOfFame = JSON.parse(localStorage.getItem('snake-hall-fame')) || [];
    this.comboCount = 0;
    this.lastEatTime = 0;
    this.isOverload = false;
    this.shieldActive = false;
    this.trails = [];
    this.totalDistance = 0;
    this.boostsEaten = 0;
    this.frenzyTriggers = 0;
    this.isSFXMuted = false;
    this.eatEffect = 0;

    // Dash System
    this.isDashing = false;
    this.dashCooldown = 0;
    this.dashDuration = 0;
    this.dashSpeed = 30; // milliseconds per move when dashing
    this.dashCost = 50; // score cost
    this.dashMaxCooldown = 5000; // 5 seconds
    this.dashMaxDuration = 2000; // 2 seconds
    this.afterimages = [];

    // Enhanced Particle Effects
    this.shockwaves = []; // Energy ripples when eating
    this.screenFlash = 0; // Screen flash intensity (0-1)
    this.timeScale = 1.0; // Time dilation effect
    this.levelUpGlow = 0; // Level up screen glow

    // Daily Challenge System
    this.availableChallenges = [
      { id: 'score_500', name: 'Score Seeker', desc: 'Reach 500 points in a single run', check: () => this.score >= 500 },
      { id: 'level_5', name: 'Level Up', desc: 'Reach Level 5', check: () => this.level >= 5 },
      { id: 'eat_50', name: 'Hungry Snake', desc: 'Eat 50 food items', check: () => this.score / 10 >= 50 },
      { id: 'combo_5', name: 'Combo Master', desc: 'Reach a 5x combo', check: () => this.comboCount >= 5 },
      { id: 'no_boost', name: 'Pure Skill', desc: 'Reach 200 points without using dash', check: () => this.score >= 200 && !this.dashUsed },
      { id: 'survivor', name: 'Survivor', desc: 'Survive to Level 10', check: () => this.level >= 10 }
    ];
    this.dailyChallenge = this.getDailyChallenge(); // Call AFTER availableChallenges is defined

    // Achievement System
    this.achievements = [
      { id: 'first_blood', name: 'First Blood', desc: 'Score your first 100 points', icon: '🎯', check: () => this.score >= 100, reward: 50 },
      { id: 'speed_runner', name: 'Speed Runner', desc: 'Reach Level 5', icon: '⚡', check: () => this.level >= 5, reward: 100 },
      { id: 'combo_king', name: 'Combo King', desc: 'Get a 10x combo', icon: '🔥', check: () => this.comboCount >= 10, reward: 150 },
      { id: 'enemy_slayer', name: 'Enemy Slayer', desc: 'Kill 50 enemies total', icon: '⚔️', check: () => this.totalEnemiesKilled >= 50, reward: 200 },
      { id: 'survivor', name: 'Survivor', desc: 'Reach Level 10', icon: '🛡️', check: () => this.level >= 10, reward: 250 },
      { id: 'master', name: 'Snake Master', desc: 'Score 1000 points', icon: '👑', check: () => this.score >= 1000, reward: 500 }
    ];
    this.unlockedAchievements = JSON.parse(localStorage.getItem('achievements')) || [];
    this.totalEnemiesKilled = parseInt(localStorage.getItem('total-enemies-killed')) || 0;

    // Background Music System
    this.bgmPlaying = false;
    this.bgmOscillators = [];
    this.bgmGain = null;
    this.currentBGMLevel = 0;
    this.isBGMMuted = localStorage.getItem('bgm-muted') === 'true';

    this.previewSkin = this.currentSkin;
    this.previewHead = this.currentHead;
    this.previewEatEffect = 0;
    this.previewCanvas = document.getElementById('skin-preview-canvas');
    this.previewCtx = this.previewCanvas?.getContext('2d');
    if (this.previewCanvas) {
      this.previewCanvas.width = 64 * this.dpr;
      this.previewCanvas.height = 64 * this.dpr;
      this.previewCtx.scale(this.dpr, this.dpr);
    }

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    if (this.highScoreElement) this.highScoreElement.textContent = this.formatScore(this.highScore);

    this.startBtn?.addEventListener('click', () => { this.initAudio(); this.start(); });
    this.restartBtn?.addEventListener('click', () => { this.initAudio(); this.start(); });
    this.shopBtn?.addEventListener('click', () => this.toggleShop(true));
    this.closeShopBtn?.addEventListener('click', () => this.toggleShop(false));
    this.resumeBtn?.addEventListener('click', () => this.togglePause(false));
    this.muteBtn?.addEventListener('click', () => this.toggleMute());
    this.homeBtn?.addEventListener('click', () => this.goHome());

    window.addEventListener('keydown', (e) => {
      if ((e.key === 'Escape' || e.key === 'p') && this.startOverlay?.classList.contains('hidden')) {
        this.togglePause(!this.isPaused);
      }
    });

    this.setupShopEvents();
    this.updateBytesDisplay();
    this.updateHallOfFameDisplay();
    this.setupControls();
  }

  initAudio() {
    if (!this.audioCtx) {
      try {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { console.error("AudioContext init failed", e); }
    }
  }

  beep(freq, duration, vol = 0.1, type = 'square') {
    if (this.isSFXMuted || !this.audioCtx || this.audioCtx.state === 'suspended') return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);
      osc.connect(gain); gain.connect(this.audioCtx.destination);
      osc.start(); osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) { /* Ignore audio errors to prevent hang */ }
  }

  resize() {
    const parent = this.canvas?.parentElement;
    if (!parent || !this.canvas) return;
    const rect = parent.getBoundingClientRect();
    const size = Math.max(200, Math.min(rect.width, rect.height));
    const dim = Math.floor(size / this.gridSize) * this.gridSize;

    this.canvas.width = dim * this.dpr;
    this.canvas.height = dim * this.dpr;
    this.canvas.style.width = `${dim}px`;
    this.canvas.style.height = `${dim}px`;
    this.ctx.scale(this.dpr, this.dpr);

    // Ensure cols/rows are safe integers
    this.cols = Math.max(10, Math.floor(dim / this.gridSize)) || 20;
    this.rows = Math.max(10, Math.floor(dim / this.gridSize)) || 20;
  }

  setupControls() {
    window.addEventListener('keydown', (e) => {
      const k = e.key;
      if (k === 'ArrowUp' && this.direction !== 'down') this.nextDirection = 'up';
      else if (k === 'ArrowDown' && this.direction !== 'up') this.nextDirection = 'down';
      else if (k === 'ArrowLeft' && this.direction !== 'right') this.nextDirection = 'left';
      else if (k === 'ArrowRight' && this.direction !== 'left') this.nextDirection = 'right';
      else if (k === ' ' || k === 'Spacebar') { e.preventDefault(); this.activateDash(); }
    });
    let tsX = 0, tsY = 0;
    window.addEventListener('touchstart', (e) => { tsX = e.touches[0].clientX; tsY = e.touches[0].clientY; }, { passive: false });
    window.addEventListener('touchmove', (e) => {
      if (!tsX || !tsY) return;
      const dx = e.touches[0].clientX - tsX, dy = e.touches[0].clientY - tsY;
      if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0 && this.direction !== 'left') this.nextDirection = 'right';
          else if (dx < 0 && this.direction !== 'right') this.nextDirection = 'left';
        } else {
          if (dy > 0 && this.direction !== 'up') this.nextDirection = 'down';
          else if (dy < 0 && this.direction !== 'down') this.nextDirection = 'up';
        }
        tsX = tsY = 0;
      }
    }, { passive: false });

    // Mobile Dash Button Binding
    if (this.dashBtn) {
      this.dashBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.activateDash();
      });
      this.dashBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.activateDash();
      }, { passive: false });
    }

    // D-Pad Bindings
    const bindBtn = (btn, dir, opposite) => {
      if (btn) {
        const handler = (e) => {
          e.preventDefault();
          if (this.direction !== opposite) this.nextDirection = dir;
          if (window.navigator.vibrate) window.navigator.vibrate(10);
        };
        btn.addEventListener('mousedown', handler);
        btn.addEventListener('touchstart', handler, { passive: false });
      }
    };

    bindBtn(this.btnUp, 'up', 'down');
    bindBtn(this.btnDown, 'down', 'up');
    bindBtn(this.btnLeft, 'left', 'right');
    bindBtn(this.btnRight, 'right', 'left');
  }

  togglePause(p) {
    this.isPaused = p;
    if (p) {
      this.pauseOverlay?.classList.remove('hidden');
      if (this.gameLoop) cancelAnimationFrame(this.gameLoop);
      this.gameLoop = null;
      this.stopBGM();
    }
    else {
      this.pauseOverlay?.classList.add('hidden');
      this.lastUpdate = performance.now();
      this.requestLoop();
      this.playBGM();
    }
  }

  toggleMute() {
    this.isSFXMuted = !this.isSFXMuted;
    this.isBGMMuted = this.isSFXMuted; // Sync BGM with SFX mute
    localStorage.setItem('bgm-muted', this.isBGMMuted);

    if (this.isBGMMuted) this.stopBGM();
    else this.playBGM();

    if (this.muteBtn) {
      this.muteBtn.textContent = this.isSFXMuted ? '🔇' : '🔊';
      this.muteBtn.classList.toggle('secondary', this.isSFXMuted);
    }
  }

  goHome() {
    this.gameOverOverlay?.classList.add('hidden');
    this.startOverlay?.classList.remove('hidden');
    if (this.gameLoop) cancelAnimationFrame(this.gameLoop);
    this.gameLoop = null;
  }

  setupShopEvents() {
    document.querySelectorAll('.buy-btn').forEach(btn => {
      const id = btn.parentElement?.dataset.id || btn.dataset.id;
      if (this.upgrades[id]) { btn.textContent = 'OWNED'; btn.classList.add('owned'); }
      btn.addEventListener('click', () => this.buyUpgrade(id, btn));
    });

    // 介面初始化：清除所有 Active 狀態以確保視覺同步
    document.querySelectorAll('.skin-opt').forEach(o => o.classList.remove('active'));
    document.querySelectorAll('.head-opt').forEach(o => o.classList.remove('active'));

    document.querySelectorAll('.skin-opt').forEach(opt => {
      const s = opt.dataset.skin;
      if (s === this.currentSkin) opt.classList.add('active');
      opt.addEventListener('mouseenter', () => { this.previewSkin = s; this.previewEatEffect = 1.0; });
      opt.addEventListener('click', () => {
        document.querySelectorAll('.skin-opt').forEach(o => o.classList.remove('active'));
        opt.classList.add('active'); this.currentSkin = s;
        localStorage.setItem('snake-skin', s);
        this.previewSkin = s;
        this.previewEatEffect = 1.0;
      });
    });

    document.querySelectorAll('.head-opt').forEach(opt => {
      const h = opt.dataset.head;
      if (h === this.currentHead) opt.classList.add('active');
      opt.addEventListener('mouseenter', () => { this.previewHead = h; this.previewEatEffect = 1.0; });
      opt.addEventListener('click', () => {
        document.querySelectorAll('.head-opt').forEach(o => o.classList.remove('active'));
        opt.classList.add('active'); this.currentHead = h;
        localStorage.setItem('snake-head', h);
        this.previewHead = h;
        this.previewEatEffect = 1.0;
      });
    });
  }

  startPreviewLoop() {
    const loop = () => {
      if (!this.shopOverlay?.classList.contains('hidden')) {
        this.drawSkinPreview();
        requestAnimationFrame(loop);
      }
    };
    loop();
  }

  drawSkinPreview() {
    if (!this.previewCtx || !this.previewCanvas) return;
    const ctx = this.previewCtx;
    ctx.clearRect(0, 0, 64, 64);

    ctx.fillStyle = 'rgba(10, 10, 10, 1)';
    ctx.fillRect(0, 0, 64, 64);

    const colors = this.getPreviewColors(this.previewSkin);
    // 在 64x64 的正方形容器中完全居中 (32, 32)，尺寸設定為 24
    this.drawDetailedHead(ctx, this.previewHead, 32, 32, 24, 8, colors, 'right', this.previewEatEffect);

    if (this.previewEatEffect > 0) this.previewEatEffect -= 0.05;
    else if (Math.random() < 0.01) this.previewEatEffect = 1.0;
  }

  getPreviewColors(skin) {
    let a = '#00f2ff', h = '#ffffff', b = '#0ea5e9';
    if (skin === 'lava') { a = '#ff4d00'; h = '#ffcc00'; b = '#7f1d1d'; }
    else if (skin === 'gold') { a = '#ffd700'; h = '#ffffff'; b = '#78350f'; }
    else if (skin === 'ghost') { a = '#ffffff'; h = '#ffffff'; b = '#334155'; }
    return { aura: a, head: h, body: b };
  }

  buyUpgrade(id, btn) {
    if (this.upgrades[id]) return;
    const price = parseInt(btn.dataset.price);
    if (this.bytes >= price) {
      this.bytes -= price; this.upgrades[id] = true;
      localStorage.setItem('snake-bytes', this.bytes); localStorage.setItem('snake-upgrades', JSON.stringify(this.upgrades));
      btn.textContent = 'OWNED'; btn.classList.add('owned'); this.updateBytesDisplay(); this.beep(880, 0.2, 0.1, 'sine');
    } else { this.shake(5, 100); this.beep(220, 0.1, 0.1, 'square'); }
  }

  toggleShop(s) {
    if (!this.shopOverlay) return;
    this.isPaused = s;
    if (s) {
      if (this.gameLoop) cancelAnimationFrame(this.gameLoop);
      this.gameLoop = null;
      this.startOverlay?.classList.add('hidden');
      this.shopOverlay.classList.remove('hidden');
      this.startPreviewLoop();
    } else {
      this.shopOverlay.classList.add('hidden');
      if (this.score === 0 || !this.snake.length) {
        this.startOverlay?.classList.remove('hidden');
      } else {
        this.lastUpdate = performance.now();
        this.requestLoop();
      }
    }
  }

  updateBytesDisplay() { if (this.bytesElement) this.bytesElement.textContent = this.bytes.toString().padStart(3, '0'); }

  updateHallOfFameDisplay() {
    if (!this.hofList) return;
    this.hofList.innerHTML = this.hallOfFame.map((h, i) => `<li><span class="rank">#${i + 1}</span><span class="score">${h.score}</span><span class="date">${h.date}</span></li>`).join('');
  }

  getDailyChallenge() {
    if (!this.availableChallenges || this.availableChallenges.length === 0) return null;
    const today = new Date().toDateString();
    const saved = localStorage.getItem('daily-challenge-date');
    if (saved === today) {
      const savedChallenge = localStorage.getItem('daily-challenge');
      return this.availableChallenges.find(c => c.id === savedChallenge) || this.availableChallenges[0];
    }
    const newChallenge = this.availableChallenges[Math.floor(Math.random() * this.availableChallenges.length)];
    localStorage.setItem('daily-challenge-date', today);
    localStorage.setItem('daily-challenge', newChallenge.id);
    localStorage.setItem('daily-challenge-completed', 'false');
    return newChallenge;
  }

  checkDailyChallenge() {
    if (!this.dailyChallenge || localStorage.getItem('daily-challenge-completed') === 'true') return;
    try {
      if (this.dailyChallenge.check && this.dailyChallenge.check()) {
        localStorage.setItem('daily-challenge-completed', 'true');
        const bonus = Math.floor(this.score / 2);
        this.bytes += bonus;
        localStorage.setItem('snake-bytes', this.bytes);
        this.updateBytesDisplay();
        this.screenFlash = 0.8;
        this.levelUpGlow = 1.0;
        this.shake(20, 500);
        this.beep(2200, 0.3, 0.15, 'sine');
        if (this.snake[0]) {
          this.createShockwave(this.snake[0].x, this.snake[0].y, '#ffff00', 200);
          this.spawnFloatingText(this.snake[0].x, this.snake[0].y - 2, 'CHALLENGE COMPLETE!', '#ffff00');
          this.spawnFloatingText(this.snake[0].x, this.snake[0].y - 3, `+${bonus} BONUS!`, '#00ff00');
        }
        this.updateChallengeUI();
      }
    } catch (e) { console.error('Challenge check error:', e); }
  }

  updateChallengeUI() {
    const challengeEl = document.getElementById('daily-challenge');
    if (!challengeEl || !this.dailyChallenge) return;
    const isCompleted = localStorage.getItem('daily-challenge-completed') === 'true';
    const status = isCompleted ? '✓ COMPLETED' : 'IN PROGRESS';
    const statusClass = isCompleted ? 'completed' : 'active';
    challengeEl.innerHTML = `
      <div class="challenge-header">
        <span class="challenge-title">${this.dailyChallenge.name}</span>
        <span class="challenge-status ${statusClass}">${status}</span>
      </div>
      <div class="challenge-desc">${this.dailyChallenge.desc}</div>
      <div class="challenge-reward">Reward: Double Bytes</div>
    `;
  }

  checkAchievements() {
    if (!this.achievements) return;
    this.achievements.forEach(achievement => {
      if (this.unlockedAchievements.includes(achievement.id)) return;
      try {
        if (achievement.check && achievement.check()) { this.unlockAchievement(achievement); }
      } catch (e) { console.error('Achievement check error:', e); }
    });
  }

  unlockAchievement(achievement) {
    this.unlockedAchievements.push(achievement.id);
    localStorage.setItem('achievements', JSON.stringify(this.unlockedAchievements));
    this.bytes += achievement.reward;
    localStorage.setItem('snake-bytes', this.bytes);
    this.updateBytesDisplay();
    this.screenFlash = 1.0;
    this.levelUpGlow = 1.0;
    this.shake(25, 600);
    this.beep(2640, 0.3, 0.2, 'sine');
    this.beep(3300, 0.2, 0.15, 'sine');
    if (this.snake[0]) {
      this.createShockwave(this.snake[0].x, this.snake[0].y, '#ffd700', 250);
      this.spawnFloatingText(this.snake[0].x, this.snake[0].y - 2, `${achievement.icon} ${achievement.name}!`, '#ffd700');
      this.spawnFloatingText(this.snake[0].x, this.snake[0].y - 3, `+${achievement.reward} Bytes!`, '#00ff00');
    }
  }

  playBGM() {
    if (this.isBGMMuted || !this.audioCtx || this.bgmPlaying) return;
    this.bgmPlaying = true;
    this.bgmGain = this.audioCtx.createGain();
    this.bgmGain.gain.value = 0.05;
    this.bgmGain.connect(this.audioCtx.destination);
    const baseFreq = 110;
    const sequence = [0, 0, 3, 5, 7, 7, 5, 3];
    const stepTime = 0.2;
    const playNote = (index) => {
      if (!this.bgmPlaying) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const step = sequence[index % sequence.length];
      const freq = baseFreq * Math.pow(2, step / 12);
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + stepTime - 0.05);
      osc.connect(gain); gain.connect(this.bgmGain);
      osc.start(); osc.stop(this.audioCtx.currentTime + stepTime);
      this.bgmOscillators.push(osc);
      if (this.bgmOscillators.length > 10) this.bgmOscillators.shift();
      setTimeout(() => playNote(index + 1), stepTime * 1000);
    };
    playNote(0);
  }

  stopBGM() {
    this.bgmPlaying = false;
    this.bgmOscillators.forEach(osc => { try { osc.stop(); } catch (e) { } });
    this.bgmOscillators = [];
    if (this.bgmGain) { try { this.bgmGain.disconnect(); } catch (e) { } this.bgmGain = null; }
  }

  toggleBGM() {
    this.isBGMMuted = !this.isBGMMuted;
    localStorage.setItem('bgm-muted', this.isBGMMuted);
    if (this.isBGMMuted) this.stopBGM();
    else if (!this.isPaused && !this.gameOverOverlay.classList.contains('hidden')) this.playBGM();
    if (this.muteBtn) this.muteBtn.textContent = this.isBGMMuted ? '🔇' : '🔊';
  }

  updateDashUI() {
    this.dashCooldownFill = document.getElementById('dash-cooldown-fill');
    if (!this.dashCooldownFill) return;
    const cooldownPercent = Math.max(0, 1 - (this.dashCooldown / this.dashMaxCooldown));
    this.dashCooldownFill.style.width = `${cooldownPercent * 100}%`;

    const isReady = cooldownPercent >= 1 && !this.isDashing && this.score >= this.dashCost;

    if (isReady) {
      this.dashCooldownFill.classList.add('ready');
      if (this.dashBtn) {
        this.dashBtn.style.opacity = '1';
        this.dashBtn.style.pointerEvents = 'auto';
        this.dashBtn.style.transform = 'scale(1)';
      }
    } else {
      this.dashCooldownFill.classList.remove('ready');
      if (this.dashBtn) {
        this.dashBtn.style.opacity = '0.4';
        this.dashBtn.style.pointerEvents = 'none';
        this.dashBtn.style.transform = 'scale(0.8)';
      }
    }
  }

  updateChallengeUI() {
    const banner = document.getElementById('daily-challenge');
    if (!banner || !this.dailyChallenge) return;

    const isDone = this.dailyChallenge.check();
    banner.innerHTML = `
      <div class="challenge-header">
        <span class="challenge-title">DAILY CHALLENGE</span>
        <span class="challenge-status ${isDone ? 'completed' : 'active'}">
          ${isDone ? 'COMPLETED' : 'ACTIVE'}
        </span>
      </div>
      <div class="challenge-desc">${this.dailyChallenge.desc}</div>
      ${isDone ? '<div class="challenge-reward">REWARD: +50 Bytes</div>' : ''}
    `;

    if (isDone && !this.dailyChallenge.awarded) {
      this.bytes += 50; this.updateBytesDisplay();
      this.dailyChallenge.awarded = true;
      this.spawnFloatingText(this.snake[0]?.x || 10, this.snake[0]?.y || 10, "CHALLENGE COMPLETE!", "#ffd700");
    }
  }

  createShockwave(x, y, color = '#00f2ff', maxRadius = 100) {
    this.shockwaves.push({
      x: x * this.gridSize + this.gridSize / 2, y: y * this.gridSize + this.gridSize / 2,
      radius: 0, maxRadius: maxRadius, life: 1.0, color: color
    });
  }

  updateShockwaves() {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i]; sw.radius += 5; sw.life -= 0.02;
      if (sw.life <= 0 || sw.radius >= sw.maxRadius) { this.shockwaves.splice(i, 1); }
    }
  }

  start() {
    this.snake = [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }];
    this.prevSnake = this.snake.map(s => ({ ...s }));
    this.direction = 'right'; this.nextDirection = 'right'; this.score = 0; this.level = 1; this.speed = 150;
    this.particles = []; this.shakeTime = 0; this.obstacles = []; this.bossFood = null;
    this.updateBiome(); this.updateScore(); this.updateLevelDisplay();
    this.spawnFood();
    this.activePowerUp = null; this.comboCount = 0; this.isOverload = false; this.trails = [];
    this.totalDistance = 0; this.growthPending = 0; this.specialPityCounter = 0;
    this.boostsEaten = 0; this.frenzyTriggers = 0; this.shieldActive = this.upgrades.shield;

    // Enemy System Init
    this.enemies = []; this.starItem = null;
    this.invincibleUntil = 0;
    this.isDying = false;
    this.timeScale = 1.0;
    this.dashCooldown = 0;
    this.isDashing = false;
    this.afterimages = [];
    this.shockwaves = [];
    this.screenFlash = 0;
    this.levelUpGlow = 0;

    document.querySelector('.canvas-wrapper')?.classList.remove('overload-active');
    this.startOverlay?.classList.add('hidden');
    this.gameOverOverlay?.classList.add('hidden');

    if (this.gameLoop) cancelAnimationFrame(this.gameLoop);
    this.playBGM();
    this.lastUpdate = performance.now();
    this.requestLoop();
    this.updateChallengeUI();
    this.spawnEnemies();
  }

  requestLoop() {
    this.gameLoop = requestAnimationFrame((t) => {
      try { this.loop(t); } catch (e) { console.error("Loop Error", e); this.gameOver(); }
    });
  }

  spawnFood() {
    this.specialPityCounter++;
    // Force special food every 5th spawn (Counter >= 5) or small random chance (15%)
    const isSpec = this.specialPityCounter >= 5 || Math.random() < 0.15;
    const types = ['FIRE', 'ICE', 'LIGHTNING'];
    if (isSpec) this.specialPityCounter = 0;

    this.food = { x: -100, y: -100, type: 'NORMAL' };
    let found = false, attempts = 0;
    const c = this.cols || 20, r = this.rows || 20;

    while (!found && attempts < 150) {
      attempts++;
      let tx, ty;
      const minX = 1, maxX = c - 2;
      const minY = 1, maxY = r - 2;

      if (attempts < 40 && Math.random() < 0.7) {
        const marginW = Math.max(minX, Math.floor(c * 0.15)), marginH = Math.max(minY, Math.floor(r * 0.15));
        tx = marginW + Math.floor(Math.random() * (c - marginW * 2));
        ty = marginH + Math.floor(Math.random() * (r - marginH * 2));
      } else {
        tx = minX + Math.floor(Math.random() * (maxX - minX + 1));
        ty = minY + Math.floor(Math.random() * (maxY - minY + 1));
      }

      const onS = this.snake.some(s => s.x === tx && s.y === ty);
      // Avoid obstacles AND surrounding 1-block area
      const nearObs = this.obstacles.some(o => Math.abs(o.x - tx) <= 1 && Math.abs(o.y - ty) <= 1);

      if (!onS && !nearObs) {
        this.food = { x: tx, y: ty, type: isSpec ? types[Math.floor(Math.random() * types.length)] : 'NORMAL' };
        found = true;
      }
    }
    if (!found) {
      for (let x = 1; x < c - 1; x++) {
        for (let y = 1; y < r - 1; y++) {
          if (!this.snake.some(s => s.x === x && s.y === y) && !this.obstacles.some(o => o.x === x && o.y === y)) {
            this.food = { x, y, type: 'NORMAL' }; return;
          }
        }
      }
    }
    if (isNaN(this.food.x)) this.food = { x: Math.floor(c / 2), y: Math.floor(r / 2), type: 'NORMAL' };
  }

  spawnBossFood() {
    const c = this.cols || 20, r = this.rows || 20;
    const margin = 2; // Keep away from immediate edge
    this.bossFood = {
      x: margin + Math.floor(Math.random() * (c - margin * 2)),
      y: margin + Math.floor(Math.random() * (r - margin * 2)),
      vx: Math.random() < 0.5 ? 1 : -1,
      vy: Math.random() < 0.5 ? 1 : -1,
      life: 60, points: 100,
      prevX: Math.floor(Math.random() * c),
      prevY: Math.floor(Math.random() * r)
    };
    this.beep(880, 0.3, 0.2, 'sawtooth');
  }

  generateObstacles() {
    this.obstacles = [];
    const c = this.cols || 20, r = this.rows || 20;
    const mx = Math.floor(c / 2), my = Math.floor(r / 2);
    if (this.level === 2) this.obstacles.push({ x: mx - 2, y: my - 2 }, { x: mx + 2, y: my - 2 }, { x: mx - 2, y: my + 2 }, { x: mx + 2, y: my + 2 });
    else if (this.level >= 3) { for (let i = 0; i < 6; i++) this.obstacles.push({ x: 4, y: 4 + i }, { x: c - 5, y: r - 5 - i }); }
  }

  updateLevelDisplay() { if (this.levelElement) this.levelElement.textContent = this.level; }

  createParticles(x, y, color, count = 20, speed = 12) {
    if (isNaN(x) || isNaN(y)) return;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x * this.gridSize + this.gridSize / 2, y: y * this.gridSize + this.gridSize / 2,
        vx: (Math.random() - 0.5) * speed, vy: (Math.random() - 0.5) * speed,
        size: Math.random() * 5 + 2, life: 1.0, color: color
      });
    }
  }

  spawnFloatingText(x, y, text, color = '#fff') {
    if (!this.floatingTexts) this.floatingTexts = [];
    this.floatingTexts.push({
      x: x * this.gridSize + this.gridSize / 2,
      y: y * this.gridSize,
      text: text,
      color: color,
      life: 1.0,
      vy: -1.0
    });
  }

  updateFloatingTexts() {
    if (!this.floatingTexts) return;
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy;
      t.life -= 0.015;
      if (t.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  loop(time) {
    if (this.isPaused) return;

    // Death Sequence: Freeze game updates, just run effects
    if (this.isDying) {
      const ts = this.timeScale || 1.0;
      this.updateParticles();
      this.updateShockwaves();

      // Update screen effects during death
      if (this.screenFlash > 0) this.screenFlash = Math.max(0, this.screenFlash - 0.05);
      if (this.levelUpGlow > 0) this.levelUpGlow = Math.max(0, this.levelUpGlow - 0.02);

      this.draw();
      if (this.gameLoop) this.requestLoop();
      return;
    }

    const dt = time - this.lastUpdate;
    let currentSpeed = this.isDashing ? this.dashSpeed : (this.speed || 150);
    if (this.timeScale < 1.0) currentSpeed /= this.timeScale;

    if (dt > currentSpeed) {
      this.prevSnake = this.snake.map(s => ({ x: s.x, y: s.y }));
      if (this.bossFood) { this.bossFood.prevX = this.bossFood.x; this.bossFood.prevY = this.bossFood.y; }

      // Enemy Update
      if (this.enemies) this.updateEnemies();

      this.update();
      this.lastUpdate = time;
    }

    this.lerpStep = Math.min((time - this.lastUpdate) / (currentSpeed), 1) || 0;

    if (this.activePowerUp === 'FIRE' && this.snake[0]) this.createParticles(this.snake[0].x, this.snake[0].y, '#ff4d00', 2, 4);

    this.updateParticles();
    this.updateFloatingTexts();
    this.updateShockwaves();
    this.updateDashUI();
    if (Math.random() < 0.05) this.updateChallengeUI(); // Throttle UI update

    // Update screen effects
    if (this.screenFlash > 0) this.screenFlash = Math.max(0, this.screenFlash - 0.05);
    if (this.levelUpGlow > 0) this.levelUpGlow = Math.max(0, this.levelUpGlow - 0.02);
    if (this.timeScale < 1.0) this.timeScale = Math.min(1.0, this.timeScale + 0.02);

    // Check daily challenge & achievements
    this.checkDailyChallenge();
    this.checkAchievements();

    this.draw();
    if (this.gameLoop) this.requestLoop();
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]; p.x += p.vx; p.y += p.vy; p.life -= 0.02;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  update() {
    try {
      this.direction = this.nextDirection;
      if (!this.snake[0]) return;
      const head = { ...this.snake[0] };
      if (this.direction === 'up') head.y--;
      else if (this.direction === 'down') head.y++;
      else if (this.direction === 'left') head.x--;
      else if (this.direction === 'right') head.x++;

      const c = this.cols || 20, r = this.rows || 20;

      if (this.isOverload) {
        if (head.x < 0) head.x = c - 1; else if (head.x >= c) head.x = 0;
        if (head.y < 0) head.y = r - 1; else if (head.y >= r) head.y = 0;
      }

      if (this.upgrades.magnet) {
        const d = Math.sqrt(Math.pow(head.x - this.food.x, 2) + Math.pow(head.y - this.food.y, 2));
        if (d < 6 && d > 0.1) { this.food.x += (head.x - this.food.x) * 0.5; this.food.y += (head.y - this.food.y) * 0.5; }
      }

      // Dash Updates
      if (this.dashCooldown > 0) this.dashCooldown = Math.max(0, this.dashCooldown - 16);
      if (this.isDashing) {
        this.dashDuration = Math.max(0, this.dashDuration - 16);
        if (this.dashDuration <= 0) this.isDashing = false;

        // Spawn afterimage
        this.afterimages.push({
          x: head.x * this.gridSize + this.gridSize / 2,
          y: head.y * this.gridSize + this.gridSize / 2,
          dir: this.direction,
          life: 1.0
        });
      }

      // Update afterimages life
      for (let i = this.afterimages.length - 1; i >= 0; i--) {
        this.afterimages[i].life -= 0.05;
        if (this.afterimages[i].life <= 0) this.afterimages.splice(i, 1);
      }

      const hitW = head.x < 0 || head.x >= c || head.y < 0 || head.y >= r;
      const hitS = this.snake.some(s => s.x === head.x && s.y === head.y);
      const hitO = this.obstacles.some(o => o.x === head.x && o.y === head.y);

      if (hitW || hitS || hitO) {
        if (Date.now() < this.invincibleUntil || this.isDashing) {
          if (hitW) {
            head.x = Math.max(0, Math.min(c - 1, head.x));
            head.y = Math.max(0, Math.min(r - 1, head.y));
            this.shake(5, 50);
          }
        }
        else if (this.activePowerUp === 'SUPERCONDUCT' && hitS) { }
        else if (this.shieldActive && !hitS) {
          this.shieldActive = false; this.shake(20, 500); this.beep(440, 0.5, 0.2, 'sawtooth');
          if (hitW) {
            head.x = Math.max(0, Math.min(c - 1, head.x));
            head.y = Math.max(0, Math.min(r - 1, head.y));
          }
        } else { this.triggerDeath(); return; }
      }

      this.snake.unshift(head); this.totalDistance++;

      // Check Star Collection
      // 1.25 tolerance
      if (this.starItem && Math.abs(head.x - this.starItem.x) < 1.25 && Math.abs(head.y - this.starItem.y) < 1.25) {
        this.score += 10; this.updateScore();
        this.spawnFloatingText(head.x, head.y, "INVINCIBLE!", '#ffd700');
        this.spawnFloatingText(head.x, head.y - 1, "+10", '#ffffff');
        this.activateInvincibility();
        this.starItem = null;
        this.createParticles(head.x, head.y, '#ffd700', 30, 8);
        this.shake(8, 200);
      }
      if (this.bossFood) {
        this.bossFood.x += this.bossFood.vx * 0.2; this.bossFood.y += this.bossFood.vy * 0.2; this.bossFood.life--;
        if (this.bossFood.x < 0 || this.bossFood.x >= c) this.bossFood.vx *= -1;
        if (this.bossFood.y < 0 || this.bossFood.y >= r) this.bossFood.vy *= -1;
        if (Math.abs(head.x - this.bossFood.x) < 1.0 && Math.abs(head.y - this.bossFood.y) < 1.0) {
          this.score += this.bossFood.points; this.updateScore(); this.growthPending += 5; this.bossFood = null;
        } else if (this.bossFood.life <= 0) this.bossFood = null;
      }

      const fDist = Math.sqrt(Math.pow(head.x - this.food.x, 2) + Math.pow(head.y - this.food.y, 2));
      const maxLen = 6 + (this.level - 1) * 2; // Limit: Base 6 + 2 per level

      if (fDist < 0.95) {
        const type = this.food.type;
        this.handleEating(type);
        this.spawnFood();
        // Only grow if under limit
        if (this.snake.length < maxLen) {
          this.growthPending++;
        }
      }

      // Movement logic: if growing, keep tail; else remove tail
      if (this.growthPending > 0) {
        this.growthPending--;
      } else {
        this.snake.pop();
      }

      // Hard limit check (e.g. if level drops or overgrows)
      while (this.snake.length > maxLen) {
        this.snake.pop();
      }

      if (this.eatEffect > 0) this.eatEffect = Math.max(0, this.eatEffect - 0.2);

      const nL = Math.floor(this.score / 100) + 1;
      if (nL > this.level) {
        this.level = nL;
        this.speed = Math.max(50, 150 - (this.level - 1) * 10);
        this.generateObstacles(); this.updateLevelDisplay(); this.updateBiome();
        this.spawnEnemies();
        this.spawnFloatingText(this.snake[0].x, this.snake[0].y - 2, "LEVEL UP!", "#ff00ff");
      }
      this.updateScore();
    } catch (e) { console.error("Update Error", e); this.gameOver(); }
  }

  draw() {
    try {
      if (!this.ctx || !this.canvas) return;
      this.ctx.save();
      if (this.shakeTime > 0) { this.ctx.translate((Math.random() - 0.5) * this.shakeIntensity, (Math.random() - 0.5) * this.shakeIntensity); this.shakeTime -= 16; }
      this.ctx.fillStyle = 'rgba(5, 5, 5, 0.25)'; this.ctx.fillRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);

      // Afterimages (Dash phantom trail)
      this.afterimages.forEach(img => {
        this.ctx.globalAlpha = img.life * 0.4;
        const colors = this.getPowerUpColor();
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#00ffff';
        this.drawDetailedHead(this.ctx, this.currentHead, img.x, img.y, this.gridSize * 1.25, this.gridSize / 2.5, colors, img.dir, 0);
        this.ctx.globalAlpha = 1.0;
      });

      // Particles
      this.particles.forEach(p => {
        this.ctx.globalAlpha = p.life;
        this.ctx.fillStyle = p.color;
        this.ctx.shadowBlur = 10; this.ctx.shadowColor = p.color;
        this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
      });

      // Shockwaves (Energy Ripples)
      this.shockwaves.forEach(sw => {
        this.ctx.globalAlpha = sw.life * 0.6;
        this.ctx.strokeStyle = sw.color;
        this.ctx.lineWidth = 3;
        this.ctx.shadowBlur = 20; this.ctx.shadowColor = sw.color;
        this.ctx.beginPath(); this.ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2); this.ctx.stroke();
        this.ctx.globalAlpha = 1.0;
      });

      // Subtle Grid judged by user
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      this.ctx.lineWidth = 0.5;
      for (let i = 0; i <= this.cols; i++) {
        this.ctx.beginPath(); this.ctx.moveTo(i * this.gridSize, 0); this.ctx.lineTo(i * this.gridSize, this.canvas.height / this.dpr); this.ctx.stroke();
      }
      for (let i = 0; i <= this.rows; i++) {
        this.ctx.beginPath(); this.ctx.moveTo(0, i * this.gridSize); this.ctx.lineTo(this.canvas.width / this.dpr, i * this.gridSize); this.ctx.stroke();
      }

      this.obstacles.forEach(o => { this.ctx.fillStyle = '#bc13fe'; this.ctx.fillRect(o.x * this.gridSize + 2, o.y * this.gridSize + 2, this.gridSize - 4, this.gridSize - 4); });

      if (this.bossFood && !isNaN(this.bossFood.x)) {
        const lx = (this.bossFood.prevX ?? this.bossFood.x) + (this.bossFood.x - (this.bossFood.prevX ?? this.bossFood.x)) * this.lerpStep;
        const ly = (this.bossFood.prevY ?? this.bossFood.y) + (this.bossFood.y - (this.bossFood.prevY ?? this.bossFood.y)) * this.lerpStep;
        const bx = lx * this.gridSize + this.gridSize / 2, by = ly * this.gridSize + this.gridSize / 2;
        this.ctx.shadowBlur = 40; this.ctx.shadowColor = '#ffd700';
        const g = this.ctx.createRadialGradient(bx, by, 0, bx, by, this.gridSize * 1.5);
        g.addColorStop(0, '#fff7ae'); g.addColorStop(0.4, '#ffd700'); g.addColorStop(1, 'rgba(255, 215, 0, 0)');
        this.ctx.fillStyle = g; this.ctx.beginPath(); this.ctx.arc(bx, by, this.gridSize * 0.9, 0, Math.PI * 2); this.ctx.fill();
      }

      if (!isNaN(this.food.x)) {
        const fx = this.food.x * this.gridSize + this.gridSize / 2, fy = this.food.y * this.gridSize + this.gridSize / 2;
        const type = this.food.type;
        const pulse = 1.0 + Math.sin(Date.now() / 200) * 0.2;

        if (type === 'NORMAL') {
          // Cyber Data Orb
          this.ctx.fillStyle = '#ff00ff'; this.ctx.shadowBlur = 15; this.ctx.shadowColor = '#ff00ff';
          this.ctx.beginPath(); this.ctx.arc(fx, fy, this.gridSize / 3, 0, Math.PI * 2); this.ctx.fill();
          // Data Ring
          this.ctx.strokeStyle = '#fff'; this.ctx.lineWidth = 1;
          this.ctx.beginPath(); this.ctx.arc(fx, fy, this.gridSize / 2 * pulse, 0, Math.PI * 2); this.ctx.stroke();
        }
        else if (type === 'FIRE') {
          // Burning Ember
          this.ctx.fillStyle = '#ff4d00'; this.ctx.shadowBlur = 30; this.ctx.shadowColor = '#ff4d00';
          const spikes = 5;
          this.ctx.beginPath();
          for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? this.gridSize / 2 : this.gridSize / 4; // Spiky star
            const a = (Date.now() / 500) + (i * Math.PI / spikes);
            const px = fx + Math.cos(a) * r;
            const py = fy + Math.sin(a) * r;
            if (i === 0) this.ctx.moveTo(px, py); else this.ctx.lineTo(px, py);
          }
          this.ctx.closePath(); this.ctx.fill();
          // Inner Core
          this.ctx.fillStyle = '#ffeb3b'; this.ctx.beginPath(); this.ctx.arc(fx, fy, this.gridSize / 6, 0, Math.PI * 2); this.ctx.fill();
        }
        else if (type === 'ICE') {
          // Frost Crystal (Diamond)
          this.ctx.fillStyle = '#00f2ff'; this.ctx.shadowBlur = 25; this.ctx.shadowColor = '#00f2ff';
          this.ctx.save();
          this.ctx.translate(fx, fy);
          this.ctx.rotate(Date.now() / 1000);
          this.ctx.beginPath();
          this.ctx.moveTo(0, -this.gridSize / 1.8);
          this.ctx.lineTo(this.gridSize / 3, 0);
          this.ctx.lineTo(0, this.gridSize / 1.8);
          this.ctx.lineTo(-this.gridSize / 3, 0);
          this.ctx.fill();
          // Snowflake details
          this.ctx.strokeStyle = '#fff'; this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          this.ctx.moveTo(0, -this.gridSize / 2); this.ctx.lineTo(0, this.gridSize / 2);
          this.ctx.moveTo(-this.gridSize / 2.5, 0); this.ctx.lineTo(this.gridSize / 2.5, 0);
          this.ctx.stroke();
          this.ctx.restore();
        }
        else if (type === 'LIGHTNING') {
          // Plasma Core with Bolt
          const flicker = Math.random() > 0.5 ? 1.2 : 1.0;
          this.ctx.fillStyle = '#ffff00'; this.ctx.shadowBlur = 35 * flicker; this.ctx.shadowColor = '#ffff00';
          this.ctx.beginPath(); this.ctx.arc(fx, fy, this.gridSize / 2.5, 0, Math.PI * 2); this.ctx.fill();

          // Lightning Bolt Icon
          this.ctx.fillStyle = '#fff';
          this.ctx.beginPath();
          this.ctx.moveTo(fx + 2, fy - 6);
          this.ctx.lineTo(fx - 2, fy);
          this.ctx.lineTo(fx + 3, fy);
          this.ctx.lineTo(fx - 2, fy + 7);
          this.ctx.lineTo(fx + 2, fy + 1);
          this.ctx.lineTo(fx - 3, fy + 1);
          this.ctx.fill();
        }
      }

      // Enemies
      if (this.enemies) {
        this.enemies.forEach(e => {
          const ex = e.x * this.gridSize + this.gridSize / 2;
          const ey = e.y * this.gridSize + this.gridSize / 2;
          this.ctx.fillStyle = '#ff003c'; this.ctx.shadowBlur = 20; this.ctx.shadowColor = '#ff0000';
          // Spiky Enemy Shape
          this.ctx.beginPath();
          const spikes = 8;
          for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? this.gridSize / 2.2 : this.gridSize / 3.5;
            const a = (Date.now() / 200) + (i * Math.PI / spikes);
            const px = ex + Math.cos(a) * r;
            const py = ey + Math.sin(a) * r;
            if (i === 0) this.ctx.moveTo(px, py); else this.ctx.lineTo(px, py);
          }
          this.ctx.closePath(); this.ctx.fill();
          // Angry Eyes
          this.ctx.fillStyle = '#fff'; this.ctx.beginPath();
          this.ctx.arc(ex - 4, ey - 2, 2, 0, Math.PI * 2);
          this.ctx.arc(ex + 4, ey - 2, 2, 0, Math.PI * 2);
          this.ctx.fill();
        });
      }

      // Star Item
      if (this.starItem) {
        const sx = this.starItem.x * this.gridSize + this.gridSize / 2;
        const sy = this.starItem.y * this.gridSize + this.gridSize / 2;
        this.ctx.fillStyle = '#ffcc00'; this.ctx.shadowBlur = 30; this.ctx.shadowColor = '#ffd700';
        // Star Shape
        this.ctx.beginPath();
        const p = 5;
        for (let i = 0; i < p * 2; i++) {
          const r = i % 2 === 0 ? this.gridSize / 1.8 : this.gridSize / 4; // Classic Star
          const a = (Date.now() / 1000) - Math.PI / 2 + (i * Math.PI / p);
          const px = sx + Math.cos(a) * r;
          const py = sy + Math.sin(a) * r;
          if (i === 0) this.ctx.moveTo(px, py); else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath(); this.ctx.fill();
      }

      this.snake.forEach((seg, i) => {
        let lx = seg.x, ly = seg.y;
        if (this.prevSnake[i]) {
          const p = this.prevSnake[i];
          if (Math.abs(seg.x - p.x) <= 1.1 && Math.abs(seg.y - p.y) <= 1.1) { lx = p.x + (seg.x - p.x) * this.lerpStep; ly = p.y + (seg.y - p.y) * this.lerpStep; }
        } else if (i > 0 && this.prevSnake[i - 1]) { lx = this.prevSnake[i - 1].x; ly = this.prevSnake[i - 1].y; }

        if (isNaN(lx) || isNaN(ly)) return;

        const x = lx * this.gridSize, y = ly * this.gridSize;
        let colors = this.getPowerUpColor();

        if (Date.now() < this.invincibleUntil) {
          const hue = (Date.now() / 5) % 360;
          colors.head = `hsl(${hue}, 100%, 60%)`;
          colors.body = `hsl(${hue}, 100%, 50%)`;
          colors.aura = `hsl(${hue}, 100%, 80%)`;
        }

        const cx = x + this.gridSize / 2, cy = y + this.gridSize / 2;

        if (i === 0) {
          this.drawDetailedHead(this.ctx, this.currentHead, cx, cy, this.gridSize * 1.25, this.gridSize / 2.5, colors, this.direction, this.eatEffect);
        } else {
          this.ctx.shadowBlur = 15; this.ctx.shadowColor = colors.aura;
          this.ctx.fillStyle = colors.body;
          this.ctx.beginPath(); const r = (this.gridSize - 4) + Math.sin(Date.now() / 200 + i * 0.5) * 1.5;
          this.ctx.roundRect(x + (this.gridSize - r) / 2, y + (this.gridSize - r) / 2, r, r, 6); this.ctx.fill();

          // Data Core Pulse Line
          this.ctx.strokeStyle = '#fff';
          this.ctx.lineWidth = 1;
          this.ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 150 + i * 0.8) * 0.2;
          this.ctx.beginPath();
          if (i % 2 === 0) {
            this.ctx.moveTo(cx - r / 3, cy); this.ctx.lineTo(cx + r / 3, cy);
          } else {
            this.ctx.moveTo(cx, cy - r / 3); this.ctx.lineTo(cx, cy + r / 3);
          }
          this.ctx.stroke();
          this.ctx.globalAlpha = 1.0;
        }
      });

      // Floating Texts
      if (this.floatingTexts) {
        this.ctx.font = 'bold 16px "Orbitron", sans-serif';
        this.ctx.textAlign = 'center';
        this.floatingTexts.forEach(t => {
          this.ctx.fillStyle = t.color;
          this.ctx.globalAlpha = Math.max(0, t.life);
          this.ctx.shadowBlur = 5; this.ctx.shadowColor = t.color;
          this.ctx.fillText(t.text, t.x, t.y);
          this.ctx.globalAlpha = 1.0;
        });
      }

      this.ctx.restore();

      // Full screen glow
      if (this.levelUpGlow > 0) {
        this.ctx.save();
        this.ctx.globalAlpha = this.levelUpGlow * 0.3;
        this.ctx.shadowBlur = 50; this.ctx.shadowColor = '#ffd700';
        this.ctx.strokeStyle = '#ffd700'; this.ctx.lineWidth = 10;
        this.ctx.strokeRect(5, 5, (this.canvas.width / this.dpr) - 10, (this.canvas.height / this.dpr) - 10);
        this.ctx.restore();
      }

      // Time Dilation Filter (B&W/Desaturate during death)
      if (this.isDying) {
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'saturation';
        this.ctx.fillStyle = 'black';
        this.ctx.globalAlpha = 0.5;
        this.ctx.fillRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);
        this.ctx.restore();
      }

      // Full screen flash
      if (this.screenFlash > 0) {
        this.ctx.fillStyle = `rgba(255, 255, 255, ${this.screenFlash * 0.8})`;
        this.ctx.fillRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);
      }
    } catch (e) { console.error("Draw Error", e); }
  }

  updateScore() {
    if (this.scoreElement) this.scoreElement.textContent = this.formatScore(this.score);
    if (this.score > this.highScore) {
      this.highScore = this.score;
      if (this.highScoreElement) this.highScoreElement.textContent = this.formatScore(this.highScore);
      localStorage.setItem('snake-high-score', this.highScore);
    }
  }

  formatScore(n) { return n.toString().padStart(3, '0'); }

  triggerDeath() {
    if (Date.now() < this.invincibleUntil) return; // Cannot die if invincible
    if (this.isDying) return;
    this.isDying = true;

    // Death Effects
    const head = this.snake[0];
    if (head) {
      this.createParticles(head.x, head.y, '#ffffff', 60, 20); // Massive explosion
      this.createParticles(head.x, head.y, '#ff0000', 40, 15);
    }
    this.shake(30, 800);
    this.beep(50, 1.5, 0.8, 'sawtooth'); // Low pitch crash
    this.stopBGM();

    // Delay game over
    setTimeout(() => {
      this.gameOver();
    }, 1200);
  }

  gameOver() {
    this.stopBGM();
    if (this.gameLoop) cancelAnimationFrame(this.gameLoop);
    this.gameLoop = null;
    if (this.powerUpTimeout) clearTimeout(this.powerUpTimeout);

    const dElem = document.getElementById('stat-dist'); if (dElem) dElem.textContent = this.totalDistance;
    const bElem = document.getElementById('stat-boosts'); if (bElem) bElem.textContent = this.boostsEaten;
    const fElem = document.getElementById('stat-frenzy'); if (fElem) fElem.textContent = this.frenzyTriggers;

    const e = Math.floor(this.score / 2); this.bytes += e; localStorage.setItem('snake-bytes', this.bytes);
    this.updateBytesDisplay(); if (this.rewardInfo) this.rewardInfo.textContent = `REWARD: +${e} Bytes`;

    this.updateHallOfFame(this.score);
    if (this.snake[0]) this.createParticles(this.snake[0].x, this.snake[0].y, '#00f2ff');
    this.shake(15, 400); this.beep(110, 0.2, 0.8, 'sawtooth');
    this.gameOverOverlay?.classList.remove('hidden');
    document.querySelector('.canvas-wrapper')?.classList.remove('overload-active');
  }

  updateHallOfFame(s) {
    this.hallOfFame.push({ score: s, date: new Date().toLocaleDateString(), skin: this.currentSkin });
    this.hallOfFame.sort((a, b) => b.score - a.score); this.hallOfFame = this.hallOfFame.slice(0, 5);
    localStorage.setItem('snake-hall-fame', JSON.stringify(this.hallOfFame)); this.updateHallOfFameDisplay();
  }

  updateBiome() {
    const c = document.querySelector('.game-container'); if (!c) return;
    c.className = 'game-container';
    if (this.level >= 15) c.classList.add('biome-void'); else if (this.level >= 10) c.classList.add('biome-lava'); else if (this.level >= 5) c.classList.add('biome-matrix');
  }

  handleEating(t) {
    this.eatEffect = 1.0;
    let p = 10, c = '#ff00ff';
    const n = Date.now(); if (n - this.lastEatTime < 3000) this.comboCount++; else this.comboCount = 1;
    this.lastEatTime = n; if (this.comboCount >= 3 && !this.isOverload) this.activateOverload();
    if (t === 'FIRE') { p = 30; c = '#ff4d00'; this.applyPowerUp('FIRE', 8000); }
    else if (t === 'ICE') { p = 15; c = '#00f2ff'; this.applyPowerUp('ICE', 10000); }
    else if (t === 'LIGHTNING') { p = 20; c = '#ffff00'; this.applyPowerUp('LIGHTNING', 5000); }
    if (t !== 'NORMAL') this.boostsEaten++; this.score += p; this.updateScore();
    if (!isNaN(this.food.x)) {
      this.createParticles(this.food.x, this.food.y, c, 25, 12);
      this.createShockwave(this.food.x, this.food.y, c, 100);
      this.spawnFloatingText(this.food.x, this.food.y, `+${p}`, c);
      if (this.comboCount >= 3) {
        setTimeout(() => this.spawnFloatingText(this.food.x, this.food.y - 1, `COMBO x${this.comboCount}`, '#ff00ff'), 200);
      }
    }
    this.shake(10, 200); this.beep(1320, 0.1, 0.1, 'sine');
  }

  activateOverload() {
    this.isOverload = true; this.frenzyTriggers++; this.beep(1760, 0.6, 0.2, 'sawtooth');
    document.querySelector('.canvas-wrapper')?.classList.add('overload-active');
    setTimeout(() => { this.isOverload = false; document.querySelector('.canvas-wrapper')?.classList.remove('overload-active'); }, 5000);
  }

  activateInvincibility() {
    this.invincibleUntil = Date.now() + 8000; // 8 seconds absolute time
    this.beep(880, 0.1, 0.1, 'square');
  }

  activateDash() {
    if (this.dashCooldown > 0 || this.score < this.dashCost || !this.snake[0]) return;
    this.score -= this.dashCost; this.updateScore();
    this.isDashing = true; this.dashDuration = this.dashMaxDuration; this.dashCooldown = this.dashMaxCooldown;
    this.dashUsed = true; // For daily challenge "Pure Skill"
    this.shake(15, 300); this.beep(1760, 0.2, 0.15, 'sawtooth');
    this.createShockwave(this.snake[0].x, this.snake[0].y, '#00ffff', 150);
    this.timeScale = 0.5; // Slight slow-mo entrance
    this.spawnFloatingText(this.snake[0].x, this.snake[0].y - 2, 'DASH!', '#00ffff');
    if (window.navigator.vibrate) window.navigator.vibrate([30, 10, 30]);
  }

  spawnEnemies() {
    this.enemies = [];
    const count = Math.min(5, Math.ceil(this.level / 2)); // 1 enemy at lvl 1, 2 at lvl 3... max 5
    const c = this.cols || 20, r = this.rows || 20;

    for (let i = 0; i < count; i++) {
      let ex, ey, safe = false;
      while (!safe) {
        ex = Math.floor(Math.random() * c);
        ey = Math.floor(Math.random() * r);
        // Ensure away from snake head
        if (this.snake[0]) {
          const dist = Math.abs(ex - this.snake[0].x) + Math.abs(ey - this.snake[0].y);
          if (dist > 8) safe = true;
        } else safe = true;
      }
      this.enemies.push({ x: ex, y: ey, speed: 0.05 + (this.level * 0.005) });
    }
    this.spawnStarItem();
  }

  spawnStarItem() {
    if (this.starItem) return;
    const c = this.cols || 20, r = this.rows || 20;
    this.starItem = {
      x: Math.floor(Math.random() * (c - 2)) + 1,
      y: Math.floor(Math.random() * (r - 2)) + 1,
      life: 300 // Frames until disappear? Or permanent untill collected
    };
  }

  updateEnemies() {
    if (!this.snake[0]) return;
    const head = this.snake[0];

    // Use reverse loop for safe removal
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      // Move towards head
      const dx = head.x - e.x;
      const dy = head.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.5) {
        e.x += (dx / dist) * e.speed;
        e.y += (dy / dist) * e.speed;
      }

      // Collision check
      if (Math.abs(e.x - head.x) < 0.7 && Math.abs(e.y - head.y) < 0.7) {
        if (Date.now() < this.invincibleUntil || this.isDashing) {
          // Kill Enemy
          this.totalEnemiesKilled++;
          localStorage.setItem('total-enemies-killed', this.totalEnemiesKilled);

          // Gold particles for VICTORY
          this.createParticles(e.x, e.y, '#ffd700', 40, 10);
          this.enemies.splice(i, 1); // Remove safely
          this.score += 20; this.updateScore();
          this.spawnFloatingText(e.x, e.y, "+20", "#ffd700"); // Enemy kill text
          this.shake(5, 100);
        } else {
          this.triggerDeath();
          return; // Stop processing other enemies if dead
        }
      }
    }
  }

  // Helper to add just one enemy
  spawnOneEnemy() {
    const c = this.cols || 20, r = this.rows || 20;
    let ex, ey, safe = false;
    while (!safe) {
      ex = Math.floor(Math.random() * c);
      ey = Math.floor(Math.random() * r);
      if (this.snake[0]) {
        const dist = Math.abs(ex - this.snake[0].x) + Math.abs(ey - this.snake[0].y);
        if (dist > 8) safe = true;
      } else safe = true;
    }
    this.enemies.push({ x: ex, y: ey, speed: 0.05 + (this.level * 0.005) });
  }

  applyPowerUp(t, d) {
    if (this.powerUpTimeout) clearTimeout(this.powerUpTimeout); this.activePowerUp = t;
    if (t === 'ICE') this.speed = 220; else if (t === 'LIGHTNING') this.speed = 80; else this.speed = 130;
    this.powerUpTimeout = setTimeout(() => { this.activePowerUp = null; this.speed = 150; }, d);
  }

  getPowerUpColor() {
    let a = '#00f2ff', h = '#ffffff', b = '#0ea5e9';
    const s = this.currentSkin;
    if (s === 'lava') { a = '#ff4d00'; h = '#ffcc00'; b = '#7f1d1d'; }
    else if (s === 'gold') { a = '#ffd700'; h = '#ffffff'; b = '#78350f'; }
    else if (s === 'ghost') { a = '#ffffff'; h = '#ffffff'; b = '#334155'; }

    if (this.activePowerUp === 'FIRE') { a = '#ff4d00'; h = '#ffcc00'; b = '#b91c1c'; }
    else if (this.activePowerUp === 'ICE') { a = '#00f2ff'; h = '#ffffff'; b = '#0369a1'; }
    else if (this.activePowerUp === 'LIGHTNING') { a = '#ffff00'; h = '#ffffff'; b = '#a16207'; }
    return { aura: a, head: h, body: b };
  }

  shake(intensity, duration) { this.shakeIntensity = intensity; this.shakeTime = duration; }

  // Helper for color interpolation
  computeColor(c1, c2, factor) {
    // Simple logic or can be expanded. For flame effect we just use a trick.
    return `rgba(0, 255, 255, ${factor})`;
  }

  drawDetailedHead(ctx, shape, cx, cy, s, r, colors, dir, eat) {
    const swell = 1.0 + Math.sin(eat * Math.PI) * 0.4;
    const size = s * swell;
    const glow = 35 + (eat * 25);

    ctx.save();
    ctx.translate(cx, cy);
    const angle = dir === 'up' ? -Math.PI / 2 : dir === 'down' ? Math.PI / 2 : dir === 'left' ? Math.PI : 0;
    ctx.rotate(angle);

    if (shape.startsWith('mecha')) {
      // 1. MECHA V1: Classic (Dragon Style) - Restored
      if (shape === 'mecha') {
        ctx.shadowBlur = glow; ctx.shadowColor = colors.aura;
        ctx.fillStyle = colors.head;
        ctx.beginPath();
        ctx.roundRect(-size / 2, -size / 2, size, size, [r * swell, r * swell / 2, r * swell / 2, r * swell]);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
        ctx.strokeRect(-size / 2.5, -size / 3, size / 1.5, size / 1.5);

        ctx.fillStyle = colors.aura;
        ctx.beginPath(); ctx.moveTo(-size / 4, -size / 2); ctx.lineTo(-size / 2, -size / 1.2); ctx.lineTo(0, -size / 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-size / 4, size / 2); ctx.lineTo(-size / 2, size / 1.2); ctx.lineTo(0, size / 2); ctx.fill();

        const eyeC = eat > 0.5 ? '#fff' : '#ff2d00';
        ctx.fillStyle = eyeC; ctx.shadowBlur = glow / 2;
        ctx.beginPath(); ctx.arc(size / 4, -size / 4, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(size / 4, size / 4, 2, 0, Math.PI * 2); ctx.fill();
      }
      // 2. MECHA V2: Sentinel (G-Type) - High Detail
      else if (shape === 'mecha_striker') {
        // V-Fin Antenna (Detailed)
        ctx.fillStyle = '#ffd700';
        ctx.shadowBlur = 5; ctx.shadowColor = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-size / 1.1, -size / 1.4); ctx.lineTo(-size / 2, -size / 3.5); ctx.lineTo(0, -size / 5);
        ctx.lineTo(-size / 2, size / 3.5); ctx.lineTo(-size / 1.1, size / 1.4); ctx.lineTo(0, 0);
        ctx.fill();
        // Antenna Jewel
        ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.moveTo(0, -size / 8); ctx.lineTo(-size / 6, 0); ctx.lineTo(0, size / 8); ctx.fill();

        // Main Helmet Shape
        ctx.fillStyle = colors.head; ctx.shadowBlur = glow; ctx.shadowColor = colors.aura;
        ctx.beginPath();
        ctx.moveTo(size / 1.4, 0); // Chin tip
        ctx.lineTo(size / 3, -size / 2.2); // Cheek R
        ctx.lineTo(-size / 1.4, -size / 1.9); // Top R
        ctx.lineTo(-size / 1.4, size / 1.9); // Top L
        ctx.lineTo(size / 3, size / 2.2); // Cheek L
        ctx.closePath();
        ctx.fill();

        // Panel Lines & Vents
        ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1;
        ctx.beginPath();
        // Cheek Vents
        ctx.moveTo(size / 4, -size / 3); ctx.lineTo(0, -size / 3);
        ctx.moveTo(size / 4, size / 3); ctx.lineTo(0, size / 3);
        // Face Mask Separation
        ctx.moveTo(0, -size / 6); ctx.lineTo(size / 2, -size / 6); ctx.lineTo(size / 2, size / 6); ctx.lineTo(0, size / 6);
        ctx.stroke();

        // Twin Eyes (Glowing)
        const eyeColor = eat > 0.5 ? '#00ff00' : '#00ffff';
        ctx.fillStyle = eyeColor; ctx.shadowBlur = 10;
        ctx.fillRect(-size / 5, -size / 3.5, size / 3.5, size / 7); // Eye R
        ctx.fillRect(-size / 5, size / 3.5 - size / 7, size / 3.5, size / 7); // Eye L

        // Head Camera (Top)
        ctx.fillStyle = eyeColor;
        ctx.fillRect(-size / 1.6, -size / 8, size / 4, size / 4);
      }
      // 3. MECHA V3: Mono-Eye (Z-Type) - High Detail
      else if (shape === 'mecha_heavy') {
        // Commander Antenna (Rare)
        if (Math.random() < 0.1) {
          ctx.strokeStyle = colors.head; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(-size / 2, 0); ctx.lineTo(size * 1.2, 0); ctx.stroke();
        }

        // Dome Helmet (Base)
        ctx.fillStyle = colors.head;
        ctx.shadowBlur = glow; ctx.shadowColor = colors.aura;
        ctx.beginPath();
        // Slightly flattened dome
        ctx.ellipse(-size / 4, 0, size / 1.5, size / 1.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Armor Seams
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-size / 2, -size / 1.6); ctx.quadraticCurveTo(0, -size / 2, size / 2, -size / 3); // Top seam
        ctx.moveTo(-size / 2, size / 1.6); ctx.quadraticCurveTo(0, size / 2, size / 2, size / 3); // Bottom seam
        ctx.stroke();

        // Mono-eye Track (Visor)
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.ellipse(-size / 4, 0, size / 1.8, size / 2.2, 0, Math.PI / 4, -Math.PI / 4, true); // Front cutout
        ctx.fill();

        // Mono Eye (Pink/Red) - Moving
        const eyeY = (eat - 0.5) * size;
        ctx.fillStyle = '#ff0066'; ctx.shadowBlur = 15; ctx.shadowColor = '#ff0066';
        ctx.beginPath();
        ctx.arc(-size / 4 + size / 6, eyeY * 0.5, size / 9, 0, Math.PI * 2);
        ctx.fill();
        // Eye Reflection
        ctx.fillStyle = '#fff'; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(-size / 4 + size / 6 - 1, eyeY * 0.5 - 1, size / 20, 0, Math.PI * 2); ctx.fill();

        // Power Pipes (Textured Cables)
        ctx.strokeStyle = '#444'; ctx.lineWidth = size / 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-size / 2, -size / 1.2); ctx.quadraticCurveTo(size / 3, 0, -size / 2, size / 1.2);
        ctx.stroke();
        // Cable Ribs
        ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
        for (let i = 0.1; i < 0.9; i += 0.1) {
          // Approximate curve points for detail would get complex, simplified rings:
          // Just simple dark rings on the thick cable
        }

        // Snout Vents
        ctx.fillStyle = '#222';
        ctx.fillRect(size / 4, -size / 6, size / 3, size / 12);
        ctx.fillRect(size / 4, 0, size / 3, size / 12);
        ctx.fillRect(size / 4, size / 6, size / 3, size / 12);
      }
    }
    else if (shape === 'bio') {
      // Bio-Xenomorph Style (New Design)
      const pulse = 1.0 + Math.sin(Date.now() / 150) * 0.15; // Faster organic pulse

      // 1. Mandibles (Pincers at front) - Bottom layer
      ctx.fillStyle = colors.body; // Darker organic tone
      ctx.shadowBlur = glow; ctx.shadowColor = colors.aura;
      ctx.beginPath();
      // Top mandible
      ctx.moveTo(size / 4, -size / 5);
      ctx.quadraticCurveTo(size, -size, size / 1.2, -size / 6);
      // Bottom mandible
      ctx.moveTo(size / 4, size / 5);
      ctx.quadraticCurveTo(size, size, size / 1.2, size / 6);
      ctx.fill();

      // 2. Main Carapace (Organic Shell)
      // Gradient for fleshy/chitin look
      const g = ctx.createRadialGradient(-size / 3, -size / 3, 2, 0, 0, size);
      g.addColorStop(0, '#ffffff'); // Specular highlight
      g.addColorStop(0.2, colors.head); // Main bio color
      g.addColorStop(1, '#000000'); // Shadowy edges
      ctx.fillStyle = g;

      ctx.beginPath();
      // Alien head shape - bulbous back, tapered front
      ctx.moveTo(-size / 1.5, 0);
      ctx.bezierCurveTo(-size, -size / 1.2, size / 3, -size / 1.5, size / 2, 0); // Top curve
      ctx.bezierCurveTo(size / 3, size / 1.5, -size, size / 1.2, -size / 1.5, 0); // Bottom curve
      ctx.fill();

      // 3. Pulsating Core / Brain
      ctx.fillStyle = colors.aura;
      ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 200) * 0.4;
      ctx.beginPath();
      ctx.ellipse(-size / 4, 0, size / 4 * pulse, size / 5 * pulse, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // 4. Toxic Eyes (Multiple)
      ctx.fillStyle = '#ccff00'; // Toxic Green
      ctx.shadowBlur = 10; ctx.shadowColor = '#ccff00';
      // Main eyes
      ctx.beginPath(); ctx.arc(size / 6, -size / 4, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(size / 6, size / 4, 2.5, 0, Math.PI * 2); ctx.fill();
      // Smaller side eyes
      ctx.fillStyle = '#adff2f'; ctx.shadowBlur = 5;
      ctx.beginPath(); ctx.arc(0, -size / 3, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, size / 3, 1.5, 0, Math.PI * 2); ctx.fill();
    }
    else if (shape.startsWith('holo')) {
      // 1. HOLO V1: Prism (Refractive Crystal)
      if (shape === 'holo') {
        const t = Date.now() / 1000;

        ctx.globalCompositeOperation = 'lighter'; // Additive blending for light

        // Outer Crystal Shell (Diamond)
        ctx.strokeStyle = colors.aura; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -size / 1.2);
        ctx.lineTo(size / 1.5, 0);
        ctx.lineTo(0, size / 1.2);
        ctx.lineTo(-size / 1.5, 0);
        ctx.closePath();
        ctx.stroke();

        // Inner Facets (Rotating)
        ctx.save();
        ctx.rotate(Math.sin(t) * 0.2); // Gentle sway
        ctx.fillStyle = colors.head; ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(0, -size / 1.5); ctx.lineTo(size / 2, -size / 4); ctx.lineTo(0, size / 4); ctx.lineTo(-size / 2, -size / 4);
        ctx.fill();
        ctx.fillStyle = colors.aura; ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(0, size / 1.5); ctx.lineTo(size / 2, size / 4); ctx.lineTo(0, -size / 4); ctx.lineTo(-size / 2, size / 4);
        ctx.fill();
        ctx.restore();

        // Energy Core (Pulsing)
        const pulse = 1 + Math.sin(t * 5) * 0.2;
        ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.8;
        ctx.shadowBlur = 20; ctx.shadowColor = colors.aura;
        ctx.beginPath();
        ctx.arc(0, 0, size / 6 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Hex Ripples
        ctx.strokeStyle = colors.head; ctx.lineWidth = 1; ctx.shadowBlur = 0;
        const hexS = (t % 1) * size;
        ctx.globalAlpha = 1 - (t % 1);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = i * Math.PI / 3;
          const px = Math.cos(a) * hexS * 1.5;
          const py = Math.sin(a) * hexS * 1.5;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.stroke();

        ctx.globalCompositeOperation = 'source-over'; // Reset
      }
      // 2. HOLO V2: Glitch (Chaos)
      else if (shape === 'holo_glitch') {
        const offset = Math.random() * 4 - 2;
        const sliceY = (Math.random() - 0.5) * size;

        ctx.globalAlpha = 0.7;

        // Red Channel Shift (Left)
        ctx.fillStyle = 'rgba(255, 0, 50, 0.8)';
        ctx.fillRect(-size / 2 + offset, -size / 2, size, size);

        // Cyan Channel Shift (Right)
        ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.fillRect(-size / 2 - offset, -size / 2, size, size);

        // Main Body (White/Head Color)
        ctx.fillStyle = colors.head;
        ctx.fillRect(-size / 2, -size / 2, size, size);

        // Slice Glitch effect
        if (Math.random() < 0.2) {
          ctx.clearRect(-size, sliceY, size * 2, 3);
          ctx.fillStyle = '#fff';
          ctx.fillRect(-size / 2 + 5, sliceY, size, 3);
        }

        // Noise Texture
        ctx.fillStyle = '#000';
        for (let i = 0; i < 10; i++) {
          ctx.fillRect((Math.random() - 0.5) * size, (Math.random() - 0.5) * size, Math.random() * 4, 1);
        }

        // Unstable Core
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.strokeRect(-size / 6 + Math.random() * 2, -size / 6 + Math.random() * 2, size / 3, size / 3);

        ctx.globalAlpha = 1.0;
      }
    }
    else {
      // Original / Default Style (Polished)
      // Glassmorphism body
      ctx.shadowBlur = glow / 2; ctx.shadowColor = colors.aura;
      ctx.fillStyle = colors.head;

      // Main Capsule
      ctx.beginPath();
      ctx.roundRect(-size / 2, -size / 2, size, size, r * swell);
      ctx.fill();

      // Glass Shine
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.ellipse(-size / 6, -size / 6, size / 4, size / 6, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      // Original Cyber Eyes
      ctx.fillStyle = '#050505'; // Dark lenses
      ctx.beginPath();
      ctx.arc(size / 4, -size / 4, 3, 0, Math.PI * 2);
      ctx.arc(size / 4, size / 4, 3, 0, Math.PI * 2);
      ctx.fill();

      // Eye Glow
      ctx.fillStyle = eat > 0.2 ? '#fff' : '#ff2d00';
      ctx.shadowBlur = 5; ctx.shadowColor = ctx.fillStyle;
      ctx.beginPath();
      ctx.arc(size / 4, -size / 4, 1.5, 0, Math.PI * 2);
      ctx.arc(size / 4, size / 4, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
new SnakeGame();
