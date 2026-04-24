// WaveManager.js
(function () {
  const WAVES = [
    {
      name: 'DAWN', spawnInterval: 7000,
      composition: [{ type: 'walker', count: 8 }],
      scatter: 10, darkness: 0.25
    },
    {
      name: 'DUSK', spawnInterval: 5500,
      composition: [{ type: 'walker', count: 12 }, { type: 'runner', count: 4 }],
      scatter: 10, darkness: 0.4
    },
    {
      name: 'MIDNIGHT', spawnInterval: 4500,
      composition: [{ type: 'walker', count: 15 }, { type: 'runner', count: 8 }, { type: 'brute', count: 1 }],
      scatter: 8, darkness: 0.7
    },
    {
      name: 'FACTORY ALARM', spawnInterval: 2800,
      composition: [{ type: 'walker', count: 20 }, { type: 'runner', count: 10 }, { type: 'brute', count: 2 }],
      scatter: 8, darkness: 0.65, event: 'alarm'
    },
    {
      name: 'POWER SURGE', spawnInterval: 4000,
      composition: [{ type: 'walker', count: 18 }, { type: 'runner', count: 12 }, { type: 'brute', count: 2 }],
      scatter: 10, darkness: 0.7, event: 'surge'
    },
    {
      name: 'THE HORDE', spawnInterval: 1800,
      composition: [{ type: 'walker', count: 30 }, { type: 'runner', count: 18 }, { type: 'brute', count: 3 }],
      scatter: 6, darkness: 0.75
    },
    {
      name: 'FACTORY OVERRIDE', spawnInterval: 2500,
      composition: [{ type: 'mega', count: 1 }, { type: 'runner', count: 20 }, { type: 'walker', count: 10 }],
      scatter: 6, darkness: 0.75, final: true
    }
  ];

  const TIPS = [
    'Barricades block zombies; keep them tall and stacked.',
    'Turrets need power from generators - build a generator first.',
    'Brutes drop guaranteed fuel and parts. Hunt them.',
    'Reloading takes ~2 seconds. Stay behind cover.',
    'Crafting Bench: press TAB near it to craft medkits and ammo.',
    'Runners are fast and fragile. Aim centre of mass.',
    'Generators burn 1 fuel every 30 seconds. Stockpile fuel.',
    'Alarm traps pull zombies away from you - buy time.'
  ];

  class WaveManager {
    constructor(scene) {
      this.scene = scene;
      this.index = -1;
      this.state = 'breather'; // 'active' | 'breather' | 'won'
      this.stateTimer = 5000;
      this.spawnedKillsNeeded = 0;
      this.killsThisWave = 0;
      this.machinesBuiltThisWave = 0;
      this.resourcesCollectedThisWave = 0;
      this.waveStartTime = 0;
      this.waveDurationMs = 0;
      this.totalKills = 0;
      this.totalMachinesBuilt = 0;
      this.score = 0;

      scene.events.on('zombie_killed', (info) => {
        this.killsThisWave++;
        this.totalKills++;
        this.score += info.score || 10;
        // floating +score
        const p = scene.add.text(info.x, info.y - 30, '+' + info.score, {
          fontFamily: 'Courier New', fontSize: '12px', color: '#ffddaa', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(61);
        scene.tweens.add({ targets: p, y: p.y - 20, alpha: 0, duration: 900, onComplete: () => p.destroy() });
      });
      scene.events.on('machine_built', () => {
        this.machinesBuiltThisWave++;
        this.totalMachinesBuilt++;
        this.score += 25;
      });
      scene.events.on('resource_collected', (d) => {
        if (d && d.amount) this.resourcesCollectedThisWave += d.amount;
      });

      this.startBreather(5000);
    }

    randomTip() {
      return TIPS[Math.floor(Math.random() * TIPS.length)];
    }

    currentWave() {
      return WAVES[this.index] || null;
    }

    startBreather(ms) {
      this.state = 'breather';
      this.stateTimer = ms;
      this.scene.events.emit('wave_end', { wave: this.index + 1 });
      this.scene.events.emit('hud_banner', { text: (this.index + 1 >= WAVES.length ? 'VICTORY APPROACHES' : 'WAVE ' + (this.index + 2) + ' INCOMING'), color: '#ffdd33' });
    }

    startNextWave() {
      this.index++;
      if (this.index >= WAVES.length) {
        // Scale: loop with more zombies
        this.index = WAVES.length - 1;
      }
      const w = WAVES[this.index];
      this.state = 'active';
      this.stateTimer = 0;
      this.killsThisWave = 0;
      this.machinesBuiltThisWave = 0;
      this.resourcesCollectedThisWave = 0;
      this.waveStartTime = this.scene.time.now;
      this.spawnedKillsNeeded = (w.composition || []).reduce((s, c) => s + c.count, 0);
      this.scene.zombieSpawner.queueWave(w);
      // Hide the wave-cleared interstitial on HUD
      this.scene.events.emit('wave_interstitial_hide');
      this.scene.events.emit('wave_start', { wave: this.index + 1, name: w.name });
      this.scene.events.emit('hud_banner', { text: 'WAVE ' + (this.index + 1) + ' - ' + w.name, color: '#ff4444', big: true });
      // scatter
      if (this.scene.resourceSystem) this.scene.resourceSystem.scatter(w.scatter || 8);
      // darkness
      if (this.scene.setDarkness) this.scene.setDarkness(w.darkness || 0.5);
      // events
      if (w.event === 'alarm') {
        // pre-placed alarm trap
        const alarm = new MACHINA.AlarmTrap(this.scene, this.scene.player.x + 200, 600);
        alarm.trigger();
        this.scene.machinesGroup.add(alarm);
        alarm.onBuilt();
      } else if (w.event === 'surge') {
        // damage all unpowered machines 50% (actually damage all machines 30% for chaos)
        this.scene.machinesGroup.getChildren().forEach(m => {
          if (m.active) m.takeDamage(m.maxHealth * 0.3);
        });
        this.scene.cameras.main.flash(400, 255, 255, 100);
      }
    }

    update(delta) {
      if (this.state === 'won') return;
      this.stateTimer -= delta;

      if (this.state === 'breather') {
        if (this.stateTimer <= 0) {
          this.startNextWave();
        }
      } else if (this.state === 'active') {
        // Wave is over when queue empty AND no active zombies
        if (this.scene.zombieSpawner.queue.length === 0 && this.scene.zombieSpawner.count() === 0) {
          const w = this.currentWave();
          this.score += 100; // survive bonus
          this.waveDurationMs = this.scene.time.now - this.waveStartTime;
          if (w && w.final) {
            this.state = 'won';
            this.scene.events.emit('wave_won_final');
          } else {
            // slow-mo
            if (this.scene.doSlowMoKill) this.scene.doSlowMoKill();
            const nextName = WAVES[Math.min(this.index + 1, WAVES.length - 1)].name;
            // IMPROVEMENT B - interstitial data
            this.scene.events.emit('wave_interstitial', {
              wave: this.index + 1,
              nextWave: this.index + 2,
              nextName,
              kills: this.killsThisWave,
              duration: this.waveDurationMs,
              resources: this.resourcesCollectedThisWave,
              tip: this.randomTip(),
              countdown: 30
            });
            this.startBreather(30000);
          }
        }
      }
    }
  }

  MACHINA.WaveManager = WaveManager;
  MACHINA.Waves = WAVES;
})();
