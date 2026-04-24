// ResourceSystem.js
(function () {
  const MAX = { scrap: 99, fuel: 10, ammo: 120, parts: 20, medkit: 5 };
  const TEX = {
    scrap: 'res_scrap',
    fuel: 'res_fuel',
    ammo: 'res_ammo',
    parts: 'res_parts',
    medkit: 'res_medkit'
  };

  class ResourceSystem {
    constructor(scene) {
      this.scene = scene;
      this.inventory = { scrap: 8, fuel: 2, ammo: 30, parts: 2, medkit: 1 };
      this.drops = scene.physics.add.group({
        allowGravity: true,
        collideWorldBounds: false
      });
    }

    getInventory() { return this.inventory; }

    add(type, amount) {
      const key = type === 'medkits' ? 'medkit' : type;
      if (this.inventory[key] == null) return;
      this.inventory[key] = Math.min(MAX[key] || 99, this.inventory[key] + amount);
      this.scene.events.emit('resource_collected', { type: key, amount, total: this.inventory[key] });
    }

    has(cost) {
      if (!cost) return true;
      for (const k in cost) {
        if ((this.inventory[k] || 0) < cost[k]) return false;
      }
      return true;
    }

    spend(cost) {
      if (!this.has(cost)) return false;
      for (const k in cost) this.inventory[k] -= cost[k];
      this.scene.events.emit('resource_collected', {});
      return true;
    }

    dropResource(type, x, y) {
      if (!TEX[type]) return;
      const sprite = this.drops.create(x, y - 6, TEX[type]);
      sprite.resType = type;
      sprite.setDepth(18);
      sprite.body.setSize(14, 14);
      sprite.setBounce(0.2);
      sprite.setVelocity((Math.random() - 0.5) * 80, -120);
      sprite.setCollideWorldBounds(false);
      sprite.setDragX(40);
      // bob after landing
      this.scene.time.delayedCall(900, () => {
        if (!sprite.active) return;
        sprite.setVelocity(0, 0);
        sprite.body.setAllowGravity(false);
        this.scene.tweens.add({
          targets: sprite,
          y: sprite.y - 3,
          yoyo: true,
          repeat: -1,
          duration: 800,
          ease: 'Sine.inOut'
        });
      });
      // ground collision
      this.scene.physics.add.collider(sprite, this.scene.terrainGroup);
    }

    tryPickup(player) {
      let best = null, bestD = 40 * 40;
      this.drops.getChildren().forEach(d => {
        if (!d.active) return;
        const dx = d.x - player.x, dy = d.y - player.y;
        const dd = dx * dx + dy * dy;
        if (dd < bestD) { bestD = dd; best = d; }
      });
      if (best) {
        this.add(best.resType, 1);
        MACHINA.AudioManager.play('sfx_pickup');
        // pop animation
        this.scene.tweens.add({
          targets: best, alpha: 0, y: best.y - 20, scale: 0.2, duration: 220,
          onComplete: () => { best.destroy(); }
        });
        return true;
      }
      return false;
    }

    scatter(count) {
      const types = ['scrap', 'scrap', 'scrap', 'fuel', 'ammo', 'parts', 'medkit'];
      for (let i = 0; i < count; i++) {
        const x = 400 + Math.random() * 5600;
        const t = types[Math.floor(Math.random() * types.length)];
        this.dropResource(t, x, 400);
      }
    }
  }

  MACHINA.ResourceSystem = ResourceSystem;
  MACHINA.ResourceMax = MAX;
  MACHINA.ResourceTex = TEX;
})();
