// MachineBase.js
(function () {
  class MachineBase extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
      super(scene, x, y, texture);
      scene.add.existing(this);
      scene.physics.add.existing(this, true); // static
      this.setDepth(15);
      this.maxHealth = 100;
      this.health = 100;
      this.powered = false;
      this.requiresPower = false;
      this.buildCost = { scrap: 4 };
      this.powerDraw = 0;
      this.name_ = 'Machine';
      this.sparkEmitter = null;
      this.uiText = null;
      this.isMachine = true;
    }

    onBuilt() {
      const s = this.scene;
      s.cameras.main.flash(60, 255, 255, 255, false);
      MACHINA.AudioManager.play('sfx_machine_build');
      // placement pulse
      const orig = this.scale;
      this.setScale(orig * 1.4);
      this.scene.tweens.add({ targets: this, scale: orig, duration: 220, ease: 'Cubic.easeOut' });
      s.events.emit('machine_built', { name: this.name_, x: this.x, y: this.y });
    }

    takeDamage(amount) {
      if (this.health <= 0) return;
      this.health -= amount;
      this.setTint(0xff8888);
      this.scene.time.delayedCall(80, () => {
        if (this.active) this.clearTint();
      });
      if (this.health <= this.maxHealth * 0.5 && !this.sparkEmitter && this.scene.particlePool) {
        this.sparkEmitter = this.scene.particlePool.emitLoop('sparks', this.x, this.y - this.displayHeight / 2);
      }
      if (this.health <= 0) this.destroyMachine();
    }

    destroyMachine() {
      if (this.scene.particlePool) this.scene.particlePool.emit('explosion', this.x, this.y);
      MACHINA.AudioManager.play('sfx_explosion', { volume: 0.6 });
      if (this.sparkEmitter) { this.scene.particlePool.stopLoop(this.sparkEmitter); this.sparkEmitter = null; }
      this.setActive(false).setVisible(false);
      if (this.uiText) { this.uiText.destroy(); this.uiText = null; }
      this.scene.events.emit('machine_destroyed', this);
      this.scene.machinesGroup.remove(this, true, true);
    }

    update(delta) {}
  }

  MACHINA.MachineBase = MachineBase;
})();
