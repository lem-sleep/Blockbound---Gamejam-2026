// ZombieSpawner.js - spawn pool
(function () {
  class ZombieSpawner {
    constructor(scene) {
      this.scene = scene;
      this.zombies = scene.physics.add.group({
        classType: MACHINA.Zombie,
        maxSize: 60,
        runChildUpdate: false
      });
      // preseed pool
      for (let i = 0; i < 30; i++) {
        const z = new MACHINA.Zombie(scene, -9999, -9999);
        z.setActive(false).setVisible(false);
        this.zombies.add(z);
      }
      this.queue = []; // pending types to spawn
      this.spawnTimer = 0;
      this.spawnInterval = 6000;
      this.capOnScreen = 40;
      this.hardCap = 60;
    }

    queueWave(waveSpec) {
      this.queue = [];
      (waveSpec.composition || []).forEach(c => {
        for (let i = 0; i < c.count; i++) this.queue.push(c.type);
      });
      // Shuffle a bit
      for (let i = this.queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
      }
      this.spawnInterval = waveSpec.spawnInterval || 6000;
    }

    count() {
      let c = 0;
      this.zombies.getChildren().forEach(z => { if (z.active) c++; });
      return c;
    }

    spawn(type) {
      // Find an inactive
      let z = null;
      const kids = this.zombies.getChildren();
      for (let i = 0; i < kids.length; i++) {
        if (!kids[i].active) { z = kids[i]; break; }
      }
      if (!z) {
        if (kids.length >= this.hardCap) return null;
        z = new MACHINA.Zombie(this.scene, -9999, -9999);
        this.zombies.add(z);
      }
      const cam = this.scene.cameras.main;
      const side = Math.random() < 0.5 ? -1 : 1;
      let x = side < 0 ? cam.scrollX - 100 : cam.scrollX + cam.width + 100;
      x = Phaser.Math.Clamp(x, 60, this.scene.worldWidth - 60);
      const y = 550;
      z.spawn(type, x, y);
      return z;
    }

    update(delta) {
      if (this.queue.length === 0) return;
      this.spawnTimer -= delta;
      if (this.spawnTimer <= 0 && this.count() < this.capOnScreen) {
        const type = this.queue.shift();
        if (type) this.spawn(type);
        this.spawnTimer = this.spawnInterval;
      }
    }

    updateAllZombies(delta) {
      this.zombies.getChildren().forEach(z => {
        if (z.active) z.update(delta);
      });
    }

    flushAll() {
      this.zombies.getChildren().forEach(z => {
        if (z.active) z.returnToPool();
      });
      this.queue = [];
    }
  }
  MACHINA.ZombieSpawner = ZombieSpawner;
})();
