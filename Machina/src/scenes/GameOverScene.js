// GameOverScene.js
(function () {
  class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    init(data) { this.data_ = data || {}; }

    create() {
      const W = this.scale.width, H = this.scale.height;
      const dead = this.data_.result !== 'survived';

      this.cameras.main.fadeIn(700, 0, 0, 0);
      if (dead) {
        this.cameras.main.setBackgroundColor(0x0a0000);
      } else {
        // win - orange glow
        const glow = this.add.rectangle(W / 2, H / 2, W, H, 0x2a1000).setDepth(-1);
        this.tweens.add({ targets: glow, alpha: { from: 0.6, to: 1 }, yoyo: true, duration: 1500, repeat: -1 });
      }

      // Title
      const title = this.add.text(W / 2, 150,
        dead ? 'YOU DIED' : 'FACTORY SILENCED', {
          fontFamily: 'Courier New', fontSize: dead ? '70px' : '60px',
          color: dead ? '#aa1a1a' : '#ffaa44',
          stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5);
      // flicker
      this.tweens.add({
        targets: title,
        alpha: { from: 0.6, to: 1 },
        yoyo: true,
        duration: dead ? 250 : 900,
        repeat: -1
      });

      if (!dead) {
        this.add.text(W / 2, 220, 'The rogue AI is offline. The machines are yours now.', {
          fontFamily: 'Courier New', fontSize: '16px', color: '#cccccc'
        }).setOrigin(0.5);
      }

      // Stats
      const d = this.data_;
      const stats = [
        ['WAVES SURVIVED', String(d.waves || 0)],
        ['ZOMBIES KILLED', String(d.kills || 0)],
        ['MACHINES BUILT', String(d.machines || 0)],
        ['SCORE', String(d.score || 0)]
      ];
      // Hardcore mode: only the high score is persisted.
      const isHigh = MACHINA.SaveManager.saveHighScore(d.score || 0);
      if (isHigh) {
        const banner = this.add.text(W / 2, 270, 'NEW HIGH SCORE!', {
          fontFamily: 'Courier New', fontSize: '22px', color: '#ffff88',
          stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5);
        this.tweens.add({
          targets: banner, scale: { from: 1.0, to: 1.2 }, yoyo: true, duration: 600, repeat: -1
        });
      } else {
        const hs = MACHINA.SaveManager.getHighScore();
        if (hs != null) {
          this.add.text(W / 2, 270, 'BEST: ' + hs, {
            fontFamily: 'Courier New', fontSize: '14px', color: '#888'
          }).setOrigin(0.5);
        }
      }

      stats.forEach((row, i) => {
        const y = 320 + i * 30;
        this.add.text(W / 2 - 180, y, row[0], {
          fontFamily: 'Courier New', fontSize: '18px', color: '#999'
        }).setOrigin(0, 0.5);
        this.add.text(W / 2 + 180, y, row[1], {
          fontFamily: 'Courier New', fontSize: '20px', color: '#ffffff'
        }).setOrigin(1, 0.5);
      });

      // Buttons
      const retry = this.add.text(W / 2 - 120, 540, dead ? '> RETRY' : '> PLAY AGAIN', {
        fontFamily: 'Courier New', fontSize: '28px', color: '#ffdd88'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      retry.on('pointerover', () => this.tweens.add({ targets: retry, scale: 1.1, duration: 120 }));
      retry.on('pointerout', () => this.tweens.add({ targets: retry, scale: 1, duration: 120 }));
      retry.on('pointerdown', () => { this.scene.start('GameScene'); });

      const menu = this.add.text(W / 2 + 120, 540, '> MAIN MENU', {
        fontFamily: 'Courier New', fontSize: '28px', color: '#ccaa66'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      menu.on('pointerover', () => this.tweens.add({ targets: menu, scale: 1.1, duration: 120 }));
      menu.on('pointerout', () => this.tweens.add({ targets: menu, scale: 1, duration: 120 }));
      menu.on('pointerdown', () => { this.scene.start('MainMenuScene'); });

      // Atmospheric sounds
      if (dead) {
        this.time.delayedCall(500, () => MACHINA.AudioManager.playRandomMoan());
        this.time.delayedCall(1500, () => MACHINA.AudioManager.play('sfx_alarm', { volume: 0.2 }));
      }

      MACHINA.AudioManager.playLoop('music_ambient', 1.0);
    }
  }
  MACHINA.GameOverScene = GameOverScene;
})();
