// AutoTurret.js
(function () {
  class AutoTurret extends MACHINA.MachineBase {
    constructor(scene, x, y) {
      super(scene, x, y, 'machine_turret_base');
      this.setOrigin(0.5, 1);
      this.body.setSize(48, 32);
      this.body.setOffset(0, 0);
      this.body.updateFromGameObject();
      this.maxHealth = 150;
      this.health = 150;
      this.buildCost = { scrap: 6, parts: 3 };
      this.name_ = 'Turret';
      this.requiresPower = true;
      this.powerDraw = 1;
      this.range = 350;
      this.fireCooldown = 0;
      this.ammo = 30;
      this.maxAmmo = 30;

      // Gun sprite on top
      this.gun = scene.add.image(x, y - 32, 'machine_turret_gun').setDepth(16).setOrigin(0.2, 0.5);
      this.gunRot = 0;
      this.ammoText = scene.add.text(x, y - 52, 'A:' + this.ammo, {
        fontFamily: 'Courier New', fontSize: '10px', color: '#ffdd88', stroke: '#000', strokeThickness: 2
      }).setDepth(17).setOrigin(0.5);
      this.uiText = this.ammoText;
    }

    destroyMachine() {
      if (this.gun) this.gun.destroy();
      super.destroyMachine();
    }

    reload(amount) {
      this.ammo = Math.min(this.maxAmmo, this.ammo + amount);
    }

    findTarget() {
      const zombies = this.scene.zombieSpawner ? this.scene.zombieSpawner.zombies : null;
      if (!zombies) return null;
      let best = null, bestD = this.range * this.range;
      zombies.getChildren().forEach(z => {
        if (!z.active || z.fsmState === 'dead') return;
        const dx = z.x - this.x, dy = z.y - this.y;
        const d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = z; }
      });
      return best;
    }

    fireAt(target) {
      this.fireCooldown = 1200;
      this.ammo--;
      const dirX = target.x > this.x ? 1 : -1;
      const mx = this.x + dirX * 20;
      const my = this.y - 30;
      const proj = this.scene.projectilePool.get(mx, my);
      if (proj) {
        proj.fire(mx, my, dirX, 650, 30);
        proj.setTint && proj.setTint(0xffaa00);
      }
      MACHINA.AudioManager.play('sfx_shoot', { volume: 0.5 });
      // recoil
      this.scene.tweens.add({
        targets: this.gun,
        x: this.gun.x - dirX * 3,
        duration: 60,
        yoyo: true
      });
    }

    update(delta) {
      if (!this.active) return;
      if (this.gun) {
        this.gun.setPosition(this.x, this.y - 32);
      }
      if (this.ammoText) {
        this.ammoText.setPosition(this.x, this.y - 52);
        this.ammoText.setText((this.powered ? '' : '[OFF] ') + 'A:' + this.ammo);
        this.ammoText.setColor(this.ammo <= 5 ? '#ff8888' : '#ffdd88');
      }

      if (!this.powered || this.ammo <= 0) {
        if (this.gun) this.gun.rotation = Math.PI / 4;
        return;
      }
      this.fireCooldown -= delta;
      const target = this.findTarget();
      if (target) {
        const dirX = target.x > this.x ? 1 : -1;
        if (this.gun) {
          this.gun.setFlipX(dirX < 0);
          this.gun.rotation = 0;
        }
        if (this.fireCooldown <= 0) this.fireAt(target);
      } else {
        if (this.gun) this.gun.rotation = 0;
      }
    }
  }
  AutoTurret.displayName = 'Auto Turret';
  AutoTurret.cost = { scrap: 6, parts: 3 };
  AutoTurret.max = 3;
  MACHINA.AutoTurret = AutoTurret;
})();
