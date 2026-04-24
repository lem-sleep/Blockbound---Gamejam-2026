// Barricade.js
(function () {
  class Barricade extends MACHINA.MachineBase {
    constructor(scene, x, y) {
      super(scene, x, y, 'machine_barricade');
      this.setOrigin(0.5, 1);
      // Physics body matches visible 64x120 planks
      this.body.setSize(64, 120);
      this.body.setOffset(0, 0);
      this.body.updateFromGameObject();
      this.maxHealth = 200;
      this.health = 200;
      this.buildCost = { scrap: 4 };
      this.name_ = 'Barricade';
      this.requiresPower = false;
      this.blocksZombies = true;
      this._damageTintStage = 0;
    }

    takeDamage(amount) {
      if (this.health <= 0) return;
      const prevHealth = this.health;
      super.takeDamage(amount);
      if (this.health <= 0) return;
      // Damage state tints
      const ratio = this.health / this.maxHealth;
      if (ratio <= 0.33 && this._damageTintStage < 2) {
        this._damageTintStage = 2;
        this.setTint(0x885a33);
        // sparks emitter (handled by MachineBase when crossing 50% - this adds extra)
      } else if (ratio <= 0.66 && this._damageTintStage < 1) {
        this._damageTintStage = 1;
        this.setTint(0xaa8866);
      }
    }

    destroyMachine() {
      // Leave rubble sprite that fades
      const rubble = this.scene.add.image(this.x, this.y - 6, 'machine_rubble')
        .setOrigin(0.5, 1).setDepth(14);
      this.scene.tweens.add({
        targets: rubble,
        alpha: 0,
        duration: 10000,
        onComplete: () => rubble.destroy()
      });
      // Low-gain explosion sound on destroy
      MACHINA.AudioManager.play('sfx_explosion', { volume: 0.4 });
      super.destroyMachine();
    }
  }
  Barricade.displayName = 'Barricade';
  Barricade.cost = { scrap: 4 };
  Barricade.max = 6;
  MACHINA.Barricade = Barricade;
})();
