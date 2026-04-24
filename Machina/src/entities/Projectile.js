// Projectile.js
(function () {
  class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
      super(scene, x, y, 'pixel_yellow');
      scene.add.existing(this);
      scene.physics.add.existing(this);
      this.setDepth(30);
      this.body.setAllowGravity(false);
      this.setDisplaySize(6, 3);
      this.damage = 20;
      this.life = 1200;
      this._trail = null;
    }

    fire(x, y, dirX, speed, damage) {
      this.setActive(true).setVisible(true);
      this.body.enable = true;
      this.setPosition(x, y);
      this.setVelocity(dirX * speed, 0);
      this.damage = damage || 20;
      this.life = 1200;
      this.rotation = dirX > 0 ? 0 : Math.PI;
    }

    preUpdate(time, delta) {
      super.preUpdate(time, delta);
      if (!this.active) return;
      this.life -= delta;
      if (this.life <= 0) {
        this.kill();
      }
      // trail: small white line behind
      if (this.scene && this.scene.add && Math.random() < 0.5) {
        const p = this.scene.add.rectangle(this.x - (this.body.velocity.x > 0 ? 6 : -6), this.y, 4, 2, 0xffffff);
        p.setDepth(29).setAlpha(0.7);
        this.scene.tweens.add({
          targets: p,
          alpha: 0,
          duration: 120,
          onComplete: () => p.destroy()
        });
      }
    }

    kill() {
      this.setActive(false).setVisible(false);
      this.body.enable = false;
      this.setPosition(-9999, -9999);
    }
  }
  MACHINA.Projectile = Projectile;
})();
