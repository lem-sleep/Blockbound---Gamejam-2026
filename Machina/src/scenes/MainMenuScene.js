// MainMenuScene.js
(function () {
  class MainMenuScene extends Phaser.Scene {
    constructor() { super('MainMenuScene'); }

    create() {
      const W = this.scale.width, H = this.scale.height;

      // Sky gradient / factory
      this.add.image(W / 2, 200, 'sky_gradient').setDisplaySize(W, 400);
      const bg = this.add.image(W / 2, H - 150, 'bg_factory');
      bg.setAlpha(0.9);
      // second copy tiled for parallax illusion
      const bg2 = this.add.image(W / 2 + W, H - 150, 'bg_factory').setAlpha(0.9);
      this.parallaxBGs = [bg, bg2];

      // Occasional zombie silhouette walkers
      this.spawnSilhouette();
      this.time.addEvent({
        delay: 5000 + Math.random() * 3000,
        loop: true,
        callback: () => this.spawnSilhouette()
      });

      // Ground bar
      this.add.rectangle(W / 2, H - 40, W, 80, 0x0a0a0a).setAlpha(0.9);

      // Title
      const title = this.add.text(W / 2, 150, 'MACHINA', {
        fontFamily: 'Courier New',
        fontSize: '100px',
        color: '#ffffff',
        stroke: '#440000',
        strokeThickness: 8,
        shadow: { offsetX: 0, offsetY: 0, color: '#ff2222', blur: 12, fill: true }
      }).setOrigin(0.5);
      this.tweens.add({
        targets: title,
        alpha: { from: 0.8, to: 1 },
        yoyo: true,
        duration: 1200,
        repeat: -1
      });
      // flicker
      this.time.addEvent({
        delay: Phaser.Math.Between(3000, 8000),
        loop: true,
        callback: () => {
          const seq = [0.3, 1, 0.5, 1];
          seq.forEach((a, i) => {
            this.time.delayedCall(i * 80, () => title.setAlpha(a));
          });
        }
      });

      this.add.text(W / 2, 235, 'SURVIVE THE FACTORY NIGHT', {
        fontFamily: 'Courier New', fontSize: '22px', color: '#999999', letterSpacing: 4
      }).setOrigin(0.5);

      // Menu buttons (HARDCORE - no continue, no saves)
      this.buttons = [];
      const items = [
        { label: '> SURVIVE', action: () => this.startGame() },
        { label: '> CONTROLS', action: () => this.toggleControls() }
      ];
      items.forEach((it, i) => {
        const y = 360 + i * 60;
        const t = this.add.text(W / 2, y, it.label, {
          fontFamily: 'Courier New', fontSize: '28px',
          color: it.enabled === false ? '#555555' : '#ccaa66'
        }).setOrigin(0.5);
        t.setInteractive({ useHandCursor: it.enabled !== false });
        t.on('pointerover', () => {
          this.tweens.add({ targets: t, scale: 1.08, duration: 120 });
          if (it.enabled !== false) t.setColor('#ffdd88');
        });
        t.on('pointerout', () => {
          this.tweens.add({ targets: t, scale: 1, duration: 120 });
          t.setColor(it.enabled === false ? '#555555' : '#ccaa66');
        });
        t.on('pointerdown', () => {
          if (it.enabled === false) return;
          it.action();
        });
        this.buttons.push(t);
      });

      // High score (only persisted value in hardcore mode)
      const hs = MACHINA.SaveManager.getHighScore();
      if (hs != null) {
        this.add.text(W / 2, H - 30, 'HIGH SCORE: ' + hs, {
          fontFamily: 'Courier New', fontSize: '14px', color: '#666'
        }).setOrigin(0.5);
      }

      // Hint
      this.add.text(W / 2, H - 60, 'HARDCORE MODE - NO SAVES. The factory has fallen.', {
        fontFamily: 'Courier New', fontSize: '12px', color: '#444'
      }).setOrigin(0.5);

      // Ambient music
      this.time.delayedCall(300, () => {
        MACHINA.AudioManager.playLoop('music_ambient', 1.0);
      });

      this.controlsShown = false;
      this.controlsOverlay = null;

      // Keyboard: SPACE or ENTER to start
      this.input.keyboard.on('keydown-SPACE', () => this.startGame());
      this.input.keyboard.on('keydown-ENTER', () => this.startGame());
    }

    spawnSilhouette() {
      const W = this.scale.width, H = this.scale.height;
      const tex = ['zombie_walker', 'zombie_runner', 'zombie_brute'][Math.floor(Math.random() * 3)];
      const dir = Math.random() < 0.5 ? -1 : 1;
      const x = dir > 0 ? -40 : W + 40;
      const y = H - 80 + Math.random() * 20;
      const s = this.add.image(x, y, tex).setAlpha(0.25).setTint(0x000000).setDepth(-1);
      s.setFlipX(dir < 0);
      this.tweens.add({
        targets: s, x: dir > 0 ? W + 40 : -40, duration: 14000 + Math.random() * 8000,
        onComplete: () => s.destroy()
      });
    }

    update() {
      // parallax
      if (this.parallaxBGs) {
        this.parallaxBGs.forEach(b => { b.x -= 0.15; });
        const W = this.scale.width;
        this.parallaxBGs.forEach((b) => {
          if (b.x < -W / 2) b.x += W * 2;
        });
      }
    }

    toggleControls() {
      if (this.controlsShown) {
        this.controlsOverlay && this.controlsOverlay.destroy();
        this.controlsOverlay = null;
        this.controlsShown = false;
        return;
      }
      this.controlsShown = true;
      const W = this.scale.width, H = this.scale.height;
      const panel = this.add.rectangle(W / 2, H / 2, 700, 460, 0x000000, 0.92)
        .setStrokeStyle(2, 0x444444);
      const title = this.add.text(W / 2, H / 2 - 200, 'CONTROLS', {
        fontFamily: 'Courier New', fontSize: '24px', color: '#ffdd88'
      }).setOrigin(0.5);
      const lines = [
        'A / D  or  Left / Right     -  Move',
        'W / Up / SPACE              -  Jump',
        'S / Down (hold)             -  Crouch',
        'SHIFT                       -  Sprint',
        'Left Click                  -  Shoot',
        'Right Click                 -  Place selected machine',
        'Q / E                       -  Cycle machine selection',
        'F                           -  Pickup / Interact (machine)',
        'R                           -  Reload',
        'TAB                         -  Craft menu',
        'ESC                         -  Pause',
        '',
        'Click or press any key to close'
      ];
      const texts = lines.map((l, i) => this.add.text(W / 2 - 320, H / 2 - 160 + i * 24, l, {
        fontFamily: 'Courier New', fontSize: '16px', color: '#cccccc'
      }));
      this.controlsOverlay = this.add.container(0, 0, [panel, title, ...texts]).setDepth(100);
      panel.setInteractive().on('pointerdown', () => this.toggleControls());
    }

    startGame() {
      MACHINA.AudioManager.fadeOut('music_ambient', 0.8);
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(420, () => {
        this.scene.start('GameScene');
      });
    }
  }
  MACHINA.MainMenuScene = MainMenuScene;
})();
