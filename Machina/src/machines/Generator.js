// Generator.js
(function () {
  class Generator extends MACHINA.MachineBase {
    constructor(scene, x, y) {
      super(scene, x, y, 'machine_generator');
      this.setOrigin(0.5, 1);
      this.body.setSize(56, 48);
      this.body.setOffset(0, 0);
      this.body.updateFromGameObject();
      this.maxHealth = 180;
      this.health = 180;
      this.buildCost = { scrap: 5, parts: 2 };
      this.name_ = 'Generator';
      this.powerOutput = 2;
      this.fuel = 2;
      this.maxFuel = 5;
      this.fuelBurnTimer = 30000; // ms
      this.running = true;
      this.humHandle = null;

      this.fuelText = scene.add.text(x, y - 56, 'F:' + this.fuel, {
        fontFamily: 'Courier New', fontSize: '10px', color: '#88ff88', stroke: '#000', strokeThickness: 2
      }).setDepth(17).setOrigin(0.5);
      this.uiText = this.fuelText;

      this.smokeEmitter = null;
    }

    refuel() {
      if (this.fuel >= this.maxFuel) return false;
      this.fuel++;
      // sparks
      if (this.scene.particlePool) this.scene.particlePool.emit('sparks', this.x, this.y - 40);
      MACHINA.AudioManager.play('sfx_machine_build', { volume: 0.7 });
      return true;
    }

    destroyMachine() {
      if (this.fuelText) this.fuelText.destroy();
      if (this.smokeEmitter && this.scene.particlePool) this.scene.particlePool.stopLoop(this.smokeEmitter);
      super.destroyMachine();
    }

    update(delta) {
      if (!this.active) return;
      this.running = this.fuel > 0;
      if (this.fuelText) {
        this.fuelText.setPosition(this.x, this.y - 56);
        this.fuelText.setText((this.running ? '' : '[OUT] ') + 'FUEL:' + this.fuel);
        this.fuelText.setColor(this.running ? '#88ff88' : '#ff8888');
      }
      // smoke puffs when running
      if (this.running) {
        if (!this.smokeEmitter && this.scene.particlePool) {
          this.smokeEmitter = this.scene.particlePool.emitLoop('smoke', this.x + 16, this.y - 48);
        }
        this.fuelBurnTimer -= delta;
        if (this.fuelBurnTimer <= 0) {
          this.fuel = Math.max(0, this.fuel - 1);
          this.fuelBurnTimer = 30000;
        }
      } else {
        if (this.smokeEmitter) {
          this.scene.particlePool.stopLoop(this.smokeEmitter);
          this.smokeEmitter = null;
        }
      }
    }
  }
  Generator.displayName = 'Generator';
  Generator.cost = { scrap: 5, parts: 2 };
  Generator.max = 2;
  MACHINA.Generator = Generator;
})();
