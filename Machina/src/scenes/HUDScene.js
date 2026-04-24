// HUDScene.js - overlay HUD
(function () {
  class HUDScene extends Phaser.Scene {
    constructor() { super({ key: 'HUDScene', active: false }); }

    create() {
      const W = this.scale.width, H = this.scale.height;

      const LABEL_STYLE = { fontFamily: 'Courier New', fontSize: '10px', color: '#888888' };
      const VALUE_STYLE = { fontFamily: 'Courier New', fontSize: '14px', color: '#ffffff' };

      // FIX 6: HEALTH panel with backing + label
      this.add.rectangle(8, 8, 160, 40, 0x000000, 0.5).setOrigin(0, 0).setStrokeStyle(1, 0x333333).setDepth(9);
      this.hearts = [];
      for (let i = 0; i < 3; i++) {
        const h = this.add.image(20 + i * 20, 22, 'hud_heart').setOrigin(0, 0.5).setScale(1.2).setDepth(10);
        this.hearts.push(h);
      }
      this.hpText = this.add.text(86, 22, '100', VALUE_STYLE).setOrigin(0, 0.5).setDepth(10);
      this.add.text(12, 42, 'HEALTH', LABEL_STYLE).setOrigin(0, 0).setDepth(10);

      // Stamina panel
      this.add.rectangle(8, 58, 160, 26, 0x000000, 0.5).setOrigin(0, 0).setStrokeStyle(1, 0x333333).setDepth(9);
      this.add.text(12, 62, 'STAMINA', LABEL_STYLE).setOrigin(0, 0).setDepth(10);
      this.add.rectangle(70, 72, 94, 8, 0x222222).setOrigin(0, 0.5).setStrokeStyle(1, 0x333333).setDepth(10);
      this.staminaBar = this.add.rectangle(72, 72, 90, 6, 0x44cc44).setOrigin(0, 0.5).setDepth(11);

      // Top-right: WAVE + SCORE
      this.add.rectangle(W - 8, 8, 200, 76, 0x000000, 0.5).setOrigin(1, 0).setStrokeStyle(1, 0x333333).setDepth(9);
      this.waveText = this.add.text(W - 20, 14, 'WAVE 1 / 7', {
        fontFamily: 'Courier New', fontSize: '18px', color: '#ffaaaa'
      }).setOrigin(1, 0).setDepth(10);
      this.scoreText = this.add.text(W - 20, 42, 'SCORE 0', {
        fontFamily: 'Courier New', fontSize: '14px', color: '#cccccc'
      }).setOrigin(1, 0).setDepth(10);
      this.waveStatusText = this.add.text(W - 20, 64, '', {
        fontFamily: 'Courier New', fontSize: '11px', color: '#aaaaaa'
      }).setOrigin(1, 0).setDepth(10);

      // Bottom-left inventory panel (+ labels)
      this.inv = {};
      const invKeys = ['scrap', 'parts', 'fuel', 'ammo', 'medkit'];
      const invLabels = { scrap: 'SCRAP', parts: 'PARTS', fuel: 'FUEL', ammo: 'AMMO', medkit: 'KITS' };
      const invTex = { scrap: 'res_scrap', parts: 'res_parts', fuel: 'res_fuel', ammo: 'res_ammo', medkit: 'res_medkit' };
      invKeys.forEach((k, i) => {
        const x = 20 + i * 70;
        const y = H - 70;
        this.add.rectangle(x + 4, y, 64, 30, 0x000000, 0.5).setOrigin(0, 0.5).setStrokeStyle(1, 0x333333).setDepth(10);
        this.add.image(x + 12, y, invTex[k]).setOrigin(0.5).setScale(1.2).setDepth(11);
        this.inv[k] = this.add.text(x + 32, y, '0', {
          fontFamily: 'Courier New', fontSize: '14px', color: '#ffffff'
        }).setOrigin(0, 0.5).setDepth(11);
        this.add.text(x + 36, y + 20, invLabels[k], LABEL_STYLE).setOrigin(0.5, 0).setDepth(11);
      });

      // Machine selection row (bottom-left, above inventory already visible)
      this.add.rectangle(20, H - 28, 380, 20, 0x000000, 0.5).setOrigin(0, 0.5).setStrokeStyle(1, 0x333333).setDepth(10);
      this.machineSelText = this.add.text(28, H - 28, 'PLACE: Barricade', {
        fontFamily: 'Courier New', fontSize: '12px', color: '#ffdd88'
      }).setOrigin(0, 0.5).setDepth(11);

      // Bottom-right: POWER / AMMO
      this.add.rectangle(W - 20, H - 70, 200, 30, 0x000000, 0.5).setOrigin(1, 0.5).setStrokeStyle(1, 0x333333).setDepth(10);
      this.powerText = this.add.text(W - 28, H - 70, 'POWER 0/0', {
        fontFamily: 'Courier New', fontSize: '14px', color: '#88ff88'
      }).setOrigin(1, 0.5).setDepth(11);
      this.add.text(W - 28, H - 50, 'POWER', LABEL_STYLE).setOrigin(1, 0).setDepth(11);

      this.add.rectangle(W - 20, H - 28, 200, 20, 0x000000, 0.5).setOrigin(1, 0.5).setStrokeStyle(1, 0x333333).setDepth(10);
      this.ammoText = this.add.text(W - 28, H - 28, 'AMMO 10 | 90', {
        fontFamily: 'Courier New', fontSize: '12px', color: '#ffdd88'
      }).setOrigin(1, 0.5).setDepth(11);

      this.reloadIndicator = this.add.text(W / 2, H - 90, '', {
        fontFamily: 'Courier New', fontSize: '14px', color: '#ffaa44'
      }).setOrigin(0.5).setDepth(11);

      // Center banner
      this.banner = this.add.text(W / 2, H / 2 - 100, '', {
        fontFamily: 'Courier New', fontSize: '42px', color: '#ffffff', stroke: '#000', strokeThickness: 4
      }).setOrigin(0.5).setDepth(100).setAlpha(0);

      // IMPROVEMENT D - threat indicators graphics layer
      this.threatGfx = this.add.graphics().setDepth(80);

      // IMPROVEMENT B - Wave interstitial container (hidden by default, off-screen)
      this.interstitial = this.add.container(0, -H).setDepth(150);
      this._buildInterstitial();
      this.interstitialTimer = null;
      this.interstitialActive = false;

      // Listen to parent GameScene events
      const game = this.scene.get('GameScene');
      if (game && game.events) {
        game.events.on('hud_update', (d) => this.updateHUD(d));
        game.events.on('hud_banner', (b) => this.showBanner(b));
        game.events.on('hud_machine_select', (m) => {
          this.machineSelText.setText('PLACE: ' + m.name + '  (' + (m.index + 1) + '/' + m.count + ')');
        });
        game.events.on('wave_start', () => { this.doScanLine(); });
        game.events.on('wave_interstitial', (d) => this.showInterstitial(d));
        game.events.on('wave_interstitial_hide', () => this.hideInterstitial());
      }
    }

    _buildInterstitial() {
      const W = this.scale.width, H = this.scale.height;
      const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.92);
      this.interstitialTitle = this.add.text(W / 2, 120, 'WAVE CLEARED', {
        fontFamily: 'Courier New', fontSize: '54px', color: '#f0a500',
        stroke: '#000', strokeThickness: 6
      }).setOrigin(0.5);
      this.interstitialStats = this.add.text(W / 2, 220, '', {
        fontFamily: 'Courier New', fontSize: '16px', color: '#cccccc', align: 'center'
      }).setOrigin(0.5);
      this.interstitialNext = this.add.text(W / 2, 340, 'NEXT WAVE: ...', {
        fontFamily: 'Courier New', fontSize: '22px', color: '#ffffff'
      }).setOrigin(0.5);
      this.interstitialCountdown = this.add.text(W / 2, 400, '30', {
        fontFamily: 'Courier New', fontSize: '62px', color: '#f0a500'
      }).setOrigin(0.5);
      this.interstitialTip = this.add.text(W / 2, H - 80, '', {
        fontFamily: 'Courier New', fontSize: '13px', color: '#888888',
        align: 'center', wordWrap: { width: W - 80 }
      }).setOrigin(0.5);
      this.interstitial.add([bg, this.interstitialTitle, this.interstitialStats, this.interstitialNext, this.interstitialCountdown, this.interstitialTip]);
    }

    showInterstitial(d) {
      if (!d) return;
      const W = this.scale.width, H = this.scale.height;
      const durSec = Math.floor((d.duration || 0) / 1000);
      this.interstitialTitle.setText('WAVE ' + d.wave + ' CLEARED');
      this.interstitialStats.setText(
        'Zombies Killed:  ' + (d.kills || 0) + '\n' +
        'Time Taken:      ' + durSec + 's\n' +
        'Resources Collected: ' + (d.resources || 0)
      );
      this.interstitialNext.setText('NEXT WAVE: ' + (d.nextName || '?'));
      this.interstitialTip.setText('TIP: ' + (d.tip || ''));

      this.interstitialCountdownValue = d.countdown || 30;
      this.interstitialCountdown.setText(String(this.interstitialCountdownValue));

      // Slide in from top
      this.tweens.killTweensOf(this.interstitial);
      this.tweens.add({
        targets: this.interstitial, y: 0, duration: 400, ease: 'Cubic.easeOut'
      });
      this.interstitialActive = true;

      if (this.interstitialTimer) this.interstitialTimer.remove();
      this.interstitialTimer = this.time.addEvent({
        delay: 1000, loop: true,
        callback: () => {
          this.interstitialCountdownValue = Math.max(0, this.interstitialCountdownValue - 1);
          this.interstitialCountdown.setText(String(this.interstitialCountdownValue));
          if (this.interstitialCountdownValue <= 0) {
            this.hideInterstitial();
          }
        }
      });
    }

    hideInterstitial() {
      if (!this.interstitialActive) return;
      const H = this.scale.height;
      if (this.interstitialTimer) { this.interstitialTimer.remove(); this.interstitialTimer = null; }
      this.tweens.killTweensOf(this.interstitial);
      this.tweens.add({
        targets: this.interstitial, y: -H, duration: 500, ease: 'Cubic.easeIn'
      });
      this.interstitialActive = false;
    }

    doScanLine() {
      const W = this.scale.width, H = this.scale.height;
      const g = this.add.graphics().setDepth(200);
      g.fillStyle(0xffffff, 0.12);
      for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1);
      g.y = -H;
      this.tweens.add({
        targets: g, y: H, duration: 500, onComplete: () => g.destroy()
      });
    }

    showBanner(info) {
      const W = this.scale.width, H = this.scale.height;
      this.banner.setText(info.text || '');
      this.banner.setColor(info.color || '#ffffff');
      this.banner.setFontSize(info.big ? 42 : 22);
      this.banner.setAlpha(0);
      this.banner.setY(info.big ? H / 2 - 140 : H / 2 - 80);
      this.tweens.killTweensOf(this.banner);
      this.tweens.add({
        targets: this.banner,
        alpha: 1,
        duration: 250,
        yoyo: true,
        hold: 1500,
        onComplete: () => this.banner.setAlpha(0)
      });
    }

    updateHUD(d) {
      if (!d) return;
      // Hearts
      const hp = Math.max(0, d.health || 0);
      const perHeart = d.maxHealth / 3;
      for (let i = 0; i < 3; i++) {
        const threshold = (i + 1) * perHeart;
        if (hp >= threshold) {
          this.hearts[i].setAlpha(1).clearTint();
        } else if (hp > i * perHeart) {
          this.hearts[i].setAlpha(0.5).clearTint();
        } else {
          this.hearts[i].setAlpha(0.2).setTint(0x333333);
        }
      }
      this.hpText.setText(Math.ceil(hp));
      this.hpText.setColor(hp < 30 ? '#ff6666' : '#cccccc');

      // Stamina
      const stw = 120 * (d.stamina / d.maxStamina);
      this.staminaBar.width = Math.max(0, stw);
      this.staminaBar.fillColor = d.stamina < 20 ? 0xcc4444 : 0x44cc44;

      // Wave
      this.waveText.setText('WAVE ' + d.wave + ' / 7' + (d.waveName ? '  ' + d.waveName : ''));
      this.scoreText.setText('SCORE ' + d.score);
      if (d.waveState === 'breather') {
        this.waveStatusText.setText('BREATHER ' + Math.ceil(d.waveTimer / 1000) + 's');
        this.waveStatusText.setColor('#88ff88');
      } else if (d.waveState === 'active') {
        this.waveStatusText.setText('LEFT ' + d.remainingInWave);
        this.waveStatusText.setColor('#ffaaaa');
      } else if (d.waveState === 'won') {
        this.waveStatusText.setText('VICTORY');
        this.waveStatusText.setColor('#ffff88');
      }

      // Inventory
      ['scrap', 'parts', 'fuel', 'ammo', 'medkit'].forEach(k => {
        this.inv[k].setText(String(d.inventory[k] != null ? d.inventory[k] : 0));
      });

      // Power
      this.powerText.setText('POWER ' + d.power.supply + '/' + d.power.demand);
      this.powerText.setColor(d.power.demand > d.power.supply ? '#ff8888' : '#88ff88');

      // Ammo
      this.ammoText.setText('AMMO ' + String(d.mag).padStart(2, '0') + ' | ' + d.ammo);
      if (d.mag === 0) this.ammoText.setColor('#ff6666');
      else if (d.mag <= 3) this.ammoText.setColor('#ffaa44');
      else this.ammoText.setColor('#ffdd88');

      // Reload indicator
      this.reloadIndicator.setText(d.reloading ? 'RELOADING...' : '');

      // Machine selection current (only updated on cycle via event; also update cost hint)
      if (d.machineName) {
        const cost = d.machineCost || {};
        const costStr = Object.keys(cost).map(k => cost[k] + 'x ' + k.toUpperCase()).join('  ');
        this.machineSelText.setText('PLACE: ' + d.machineName + '  (' + costStr + ')');
      }
    }

    update() {
      // IMPROVEMENT D - threat edge indicators
      this._drawThreats();
    }

    _drawThreats() {
      if (!this.threatGfx) return;
      this.threatGfx.clear();
      const group = this.registry.get('zombieGroup');
      const game = this.scene.get('GameScene');
      if (!group || !game || !game.cameras || !game.cameras.main) return;
      if (this.interstitialActive) return; // don't clutter interstitial
      const cam = game.cameras.main;
      const W = this.scale.width, H = this.scale.height;
      const left = cam.scrollX, right = cam.scrollX + cam.width;
      const top = cam.scrollY, bottom = cam.scrollY + cam.height;
      const buckets = { left: [], right: [] };
      group.getChildren().forEach(z => {
        if (!z.active || z.fsmState === 'dead') return;
        if (z.x >= left - 600 && z.x < left && Math.abs(z.y - (top + H / 2)) < H) {
          buckets.left.push(z);
        } else if (z.x > right && z.x <= right + 600 && Math.abs(z.y - (top + H / 2)) < H) {
          buckets.right.push(z);
        }
      });
      // Sort by proximity and cap at 5
      buckets.left.sort((a, b) => (left - a.x) - (left - b.x));
      buckets.right.sort((a, b) => (a.x - right) - (b.x - right));
      buckets.left = buckets.left.slice(0, 5);
      buckets.right = buckets.right.slice(0, 5);

      const drawArrow = (side, z) => {
        const isBig = (z.type === 'brute' || z.isMega);
        const sy = Phaser.Math.Clamp(z.y - top, 20, H - 20);
        const dist = side === 'left' ? (left - z.x) : (z.x - right);
        const t = 1 - Phaser.Math.Clamp(dist / 600, 0, 1);
        const alpha = Phaser.Math.Clamp(0.2 + t * 0.7, 0.2, 0.9);
        const size = isBig ? 15 : 10;
        const color = isBig ? 0xff7a00 : 0xff3333;
        this.threatGfx.fillStyle(color, alpha);
        if (side === 'left') {
          this.threatGfx.fillTriangle(6, sy, 6 + size, sy - size, 6 + size, sy + size);
        } else {
          this.threatGfx.fillTriangle(W - 6, sy, W - 6 - size, sy - size, W - 6 - size, sy + size);
        }
      };
      buckets.left.forEach(z => drawArrow('left', z));
      buckets.right.forEach(z => drawArrow('right', z));
    }
  }
  MACHINA.HUDScene = HUDScene;
})();
