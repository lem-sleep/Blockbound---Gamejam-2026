// ParticlePool.js - particle burst helpers using Phaser particle emitters
(function () {
  class ParticlePool {
    constructor(scene) {
      this.scene = scene;
      this.active = [];
    }

    emit(type, x, y, opts) {
      opts = opts || {};
      let cfg;
      switch (type) {
        case 'blood':
          cfg = {
            x, y,
            texture: 'blood_' + (1 + Math.floor(Math.random() * 4)),
            speed: { min: 80, max: 180 },
            angle: { min: 0, max: 360 },
            lifespan: 600,
            gravityY: 300,
            alpha: { start: 1, end: 0 },
            quantity: 6,
            emitting: false,
            scale: { min: 0.6, max: 1.2 }
          };
          break;
        case 'sparks':
          cfg = {
            x, y,
            texture: 'pixel_yellow',
            speed: { min: 100, max: 250 },
            angle: { min: 0, max: 360 },
            lifespan: 400,
            gravityY: 200,
            quantity: 5,
            emitting: false
          };
          break;
        case 'smoke':
          cfg = {
            x, y,
            texture: 'pixel_grey',
            speed: { min: 10, max: 40 },
            angle: { min: 250, max: 290 },
            lifespan: 1200,
            gravityY: -20,
            alpha: { start: 0.6, end: 0 },
            scale: { start: 1, end: 3 },
            quantity: 2,
            emitting: false
          };
          break;
        case 'explosion':
          cfg = {
            x, y,
            texture: 'pixel_orange',
            speed: { min: 200, max: 400 },
            angle: { min: 0, max: 360 },
            lifespan: 600,
            gravityY: 300,
            alpha: { start: 1, end: 0 },
            quantity: 18,
            emitting: false
          };
          break;
        case 'muzzle':
          cfg = {
            x, y,
            texture: 'pixel_yellow',
            speed: { min: 100, max: 200 },
            angle: opts.angle != null ? { min: opts.angle - 15, max: opts.angle + 15 } : { min: 0, max: 360 },
            lifespan: 80,
            quantity: 4,
            emitting: false,
            alpha: { start: 1, end: 0 }
          };
          break;
        default:
          return;
      }
      const emitter = this.scene.add.particles(0, 0, cfg.texture, cfg);
      emitter.setDepth(50);
      emitter.explode(cfg.quantity, x, y);
      this.scene.time.delayedCall(cfg.lifespan + 200, () => {
        try { emitter.destroy(); } catch (_) {}
      });
    }

    emitLoop(type, x, y, opts) {
      opts = opts || {};
      let cfg;
      switch (type) {
        case 'smoke':
          cfg = {
            x, y,
            texture: 'pixel_grey',
            speed: { min: 10, max: 30 },
            angle: { min: 250, max: 290 },
            lifespan: 1000,
            gravityY: -15,
            alpha: { start: 0.4, end: 0 },
            scale: { start: 1, end: 3 },
            frequency: 150
          };
          break;
        case 'sparks':
          cfg = {
            x, y,
            texture: 'pixel_yellow',
            speed: { min: 50, max: 120 },
            angle: { min: 0, max: 360 },
            lifespan: 300,
            gravityY: 200,
            frequency: 200
          };
          break;
        default:
          return null;
      }
      const emitter = this.scene.add.particles(0, 0, cfg.texture, cfg);
      emitter.setDepth(49);
      this.active.push(emitter);
      return emitter;
    }

    stopLoop(emitter) {
      if (!emitter) return;
      try {
        emitter.stop();
        this.scene.time.delayedCall(1200, () => {
          try { emitter.destroy(); } catch (_) {}
        });
      } catch (_) {}
      this.active = this.active.filter(e => e !== emitter);
    }

    cleanup() {
      // nothing periodic - destroyed on timer
    }
  }

  MACHINA.ParticlePool = ParticlePool;
})();
