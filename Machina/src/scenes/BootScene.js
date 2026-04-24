// BootScene.js
(function () {
  class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    preload() {
      // Loading text
      const w = this.scale.width, h = this.scale.height;
      const txt = this.add.text(w / 2, h / 2, 'LOADING MACHINA...', {
        fontFamily: 'Courier New', fontSize: '28px', color: '#cccccc'
      }).setOrigin(0.5);
      const sub = this.add.text(w / 2, h / 2 + 40, 'Building procedural assets', {
        fontFamily: 'Courier New', fontSize: '14px', color: '#666666'
      }).setOrigin(0.5);
      this._boot = { txt, sub };
    }

    create() {
      // Generate all textures
      MACHINA.ProceduralTextures.createAll(this);

      // Animations
      this.anims.create({
        key: 'player_walk',
        frames: [
          { key: 'player_run_1' },
          { key: 'player_run_2' }
        ],
        frameRate: 8,
        repeat: -1
      });
      this.anims.create({
        key: 'player_idle_anim',
        frames: [{ key: 'player_idle' }],
        frameRate: 1
      });
      this.anims.create({
        key: 'explosion',
        frames: [1, 2, 3, 4].map(i => ({ key: 'explosion_frame_' + i })),
        frameRate: 12,
        repeat: 0
      });

      // Audio
      MACHINA.AudioManager.init(this);

      if (this._boot) {
        this._boot.txt.destroy();
        this._boot.sub.destroy();
      }

      this.time.delayedCall(50, () => this.scene.start('MainMenuScene'));
    }
  }
  MACHINA.BootScene = BootScene;
})();
