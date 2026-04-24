// GameScene.js - core gameplay
(function () {
  class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
      const W = 1280, H = 720;
      this.worldWidth = 6400;
      this.worldHeight = 720;
      this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
      this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
      this.cameras.main.setBackgroundColor('#0a0a0a');

      // ========== Parallax backgrounds ==========
      // Sky layer (fixed)
      this.skyLayer = this.add.image(W / 2, 200, 'sky_gradient')
        .setDisplaySize(W, 400)
        .setScrollFactor(0)
        .setDepth(-10);

      // Mid background factory (parallax)
      this.bgFactoryParts = [];
      for (let i = 0; i < 6; i++) {
        const b = this.add.image(i * 1280, 400, 'bg_factory')
          .setAlpha(0.6)
          .setScrollFactor(0.3)
          .setDepth(-5);
        this.bgFactoryParts.push(b);
      }

      // ========== Terrain ==========
      // FIX 3: The main ground floor is a single unbroken static body spanning
      // x=0..6400. Visual ground tiles are decorative only.
      this.terrainGroup = this.physics.add.staticGroup();
      const groundY = 660;

      // Invisible solid ground body: 6400 wide x 40 tall, centre at (3200, groundY + 20)
      const groundBody = this.add.rectangle(this.worldWidth / 2, groundY + 20, this.worldWidth, 40, 0x000000, 0)
        .setDepth(-2);
      this.physics.add.existing(groundBody, true);
      this.terrainGroup.add(groundBody);
      this.mainGroundBody = groundBody;

      // Visual ground tiles (no physics bodies, purely decorative; no gaps)
      for (let x = 16; x < this.worldWidth; x += 32) {
        this.add.image(x, groundY, 'ground_tile').setDepth(0);
        this.add.image(x, groundY + 32, 'ground_tile').setDepth(-1).setAlpha(0.8);
      }

      // Raised platforms are separate static bodies (zombies cannot fall through)
      const platforms = [
        { x: 800, y: 540, len: 4 },
        { x: 2200, y: 520, len: 5 },
        { x: 2700, y: 460, len: 3 },
        { x: 4000, y: 540, len: 6 },
        { x: 5000, y: 540, len: 4 }
      ];
      platforms.forEach(p => {
        // Single body per platform (contiguous)
        const plat = this.add.rectangle(
          p.x + (p.len * 32) / 2 - 16, p.y, p.len * 32, 16, 0x000000, 0
        ).setDepth(-2);
        this.physics.add.existing(plat, true);
        this.terrainGroup.add(plat);
        for (let i = 0; i < p.len; i++) {
          this.add.image(p.x + i * 32, p.y, 'ground_mid').setDepth(0);
        }
      });

      // Foreground crates (decor only)
      for (let i = 0; i < 30; i++) {
        const x = 200 + i * 200 + Math.random() * 50;
        const sz = 20 + Math.random() * 14;
        const crate = this.add.rectangle(x, 640, sz, sz, 0x3a2a1c).setStrokeStyle(1, 0x000);
        crate.setDepth(1).setAlpha(0.9);
      }

      // No pit danger zones any more: ground is solid.
      this.dangerZones = [];

      // ========== Events ==========
      // Allow HUD events without early errors
      this.events.on('shutdown', () => this._cleanup());

      // ========== Particles ==========
      this.particlePool = new MACHINA.ParticlePool(this);

      // ========== Groups ==========
      this.machinesGroup = this.physics.add.staticGroup();
      this.projectilePool = this.physics.add.group({
        classType: MACHINA.Projectile,
        maxSize: 40,
        runChildUpdate: true,
        allowGravity: false
      });
      // preseed
      for (let i = 0; i < 20; i++) {
        const p = new MACHINA.Projectile(this, -9999, -9999);
        p.setActive(false).setVisible(false);
        p.body.enable = false;
        this.projectilePool.add(p);
      }

      // ========== Player ==========
      this.player = new MACHINA.Player(this, 300, 500);
      this.player.setCollideWorldBounds(true);
      this.physics.add.collider(this.player, this.terrainGroup);

      this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
      this.cameras.main.setDeadzone(120, 80);

      // ========== Systems ==========
      this.resourceSystem = new MACHINA.ResourceSystem(this);
      this.zombieSpawner = new MACHINA.ZombieSpawner(this);
      this.powerGrid = new MACHINA.PowerGrid(this);
      this.waveManager = new MACHINA.WaveManager(this);

      // Expose zombie group via global registry so HUDScene can draw threat indicators
      this.game.registry.set('zombieGroup', this.zombieSpawner.zombies);

      // zombie vs terrain (re-register after pool creation)
      this.physics.add.collider(this.zombieSpawner.zombies, this.terrainGroup);
      this.physics.add.collider(this.zombieSpawner.zombies, this.machinesGroup, (zombie, machine) => {
        if (machine.active && machine.blocksZombies) {
          // zombies attack barricade
          machine._hitCooldown = (machine._hitCooldown || 0) - (this.game.loop.delta || 16);
          if (machine._hitCooldown <= 0) {
            machine.takeDamage(10);
            machine._hitCooldown = 600;
          }
          // stop zombie
          zombie.setVelocityX(0);
          zombie.fsmState = 'attack';
        }
      }, (zombie, machine) => {
        return machine.active && machine.blocksZombies === true;
      });

      // projectile vs zombie
      this.physics.add.overlap(this.projectilePool, this.zombieSpawner.zombies, (p, z) => {
        if (!p.active || !z.active) return;
        z.takeDamage(p.damage, p.x);
        p.kill();
        this._hitStop(50);
      });
      // projectile vs terrain
      this.physics.add.collider(this.projectilePool, this.terrainGroup, (p) => { if (p.active) p.kill(); });
      // projectile vs machines (enemy turret-like behavior: don't damage own machines)
      // (skip to allow friendly fire free pass)

      // zombie vs player
      this.physics.add.overlap(this.zombieSpawner.zombies, this.player, (z, pl) => {
        if (!z.active || pl.dead) return;
        // attack handled in zombie update; ensure contact dmg too
      });

      // player vs machines - soft collide except for barricades (solid)
      this.physics.add.collider(this.player, this.machinesGroup, null, (pl, m) => {
        return m.blocksZombies || false;
      });

      // resource drops vs player - no physics collide; handled via F key

      // ========== Lighting overlay ==========
      this.darknessAlphaTarget = 0.25;
      this.darknessAlpha = 0.25;
      this.lightingRT = this.add.renderTexture(W / 2, H / 2, W, H)
        .setScrollFactor(0).setDepth(40);
      // eraser helper circle texture
      if (!this.textures.exists('light_circle')) {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const R = 180;
        // Radial-ish gradient fake: draw concentric circles with ERASE
        for (let r = R; r > 0; r -= 2) {
          g.fillStyle(0xffffff, 1 - (R - r) / R * 0.98);
          g.fillCircle(R, R, r);
        }
        g.generateTexture('light_circle', R * 2, R * 2);
        g.destroy();
      }

      // ========== Input ==========
      this.input_ = new MACHINA.InputHandler(this);

      // ========== Machine placement ==========
      this.machineClasses = [MACHINA.Barricade, MACHINA.AutoTurret, MACHINA.Generator, MACHINA.CraftingBench, MACHINA.AlarmTrap];
      this.selectedMachineIdx = 0;
      // IMPROVEMENT A - ghost preview with tooltip
      this.ghost = this.add.image(-9999, -9999, 'machine_barricade').setAlpha(0.6).setDepth(40);
      this.ghost.setOrigin(0.5, 1);
      this.ghostTooltip = this.add.text(0, 0, '', {
        fontFamily: 'Courier New', fontSize: '10px', color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.75)', padding: { x: 4, y: 2 }
      }).setOrigin(0.5, 1).setDepth(41).setVisible(false);

      // ========== HUD ==========
      this.scene.launch('HUDScene');
      // HUD listens to events on this scene

      // ========== Crafting overlay state ==========
      // Crafting is now a proper Scene overlay (CraftingUIScene).
      this.paused = false;
      this.pauseUI = null;

      // ========== Interaction tooltip ==========
      this.interactTooltip = this.add.text(0, 0, '', {
        fontFamily: 'Courier New', fontSize: '12px', color: '#ffdd88',
        backgroundColor: 'rgba(0,0,0,0.7)', padding: { x: 6, y: 2 }
      }).setDepth(70).setOrigin(0.5, 1).setVisible(false);

      // ========== Heartbeat on low HP ==========
      this.heartbeatLoop = null;

      // ========== Vignette ==========
      this.vignette = this.add.graphics().setScrollFactor(0).setDepth(90);
      this._drawVignette(0.2);

      // ========== Listen for events ==========
      this.events.on('player_damaged', () => {
        this._drawVignette(this.player.health < 30 ? 0.6 : 0.2);
        if (this.player.health < 30 && !this.heartbeatLoop) {
          this.heartbeatLoop = this.time.addEvent({
            delay: 900, loop: true, callback: () => MACHINA.AudioManager.play('sfx_heartbeat', { volume: 0.6 })
          });
        } else if (this.player.health >= 30 && this.heartbeatLoop) {
          this.heartbeatLoop.remove();
          this.heartbeatLoop = null;
        }
      });
      this.events.on('player_died', () => {
        if (this.heartbeatLoop) { this.heartbeatLoop.remove(); this.heartbeatLoop = null; }
        this.time.delayedCall(2000, () => {
          // HARDCORE MODE: GameOverScene handles saveHighScore only; no session state is persisted.
          this.scene.stop('HUDScene');
          if (this.scene.manager.isActive('CraftingUIScene')) this.scene.stop('CraftingUIScene');
          this.scene.start('GameOverScene', {
            result: 'dead',
            waves: this.waveManager.index + 1,
            kills: this.waveManager.totalKills,
            machines: this.waveManager.totalMachinesBuilt,
            score: this.waveManager.score
          });
        });
      });
      this.events.on('wave_won_final', () => {
        this.time.delayedCall(1500, () => {
          this.scene.stop('HUDScene');
          if (this.scene.manager.isActive('CraftingUIScene')) this.scene.stop('CraftingUIScene');
          this.scene.start('GameOverScene', {
            result: 'survived',
            waves: this.waveManager.index + 1,
            kills: this.waveManager.totalKills,
            machines: this.waveManager.totalMachinesBuilt,
            score: this.waveManager.score
          });
        });
      });

      // Start with ambient music
      this.time.delayedCall(400, () => {
        MACHINA.AudioManager.playLoop('music_ambient', 1.0);
      });

      // FIX 2 - direct TAB / ESC key handlers on the scene's input plugin
      const kb = this.input.keyboard;
      this._tabKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.TAB, true, false);
      this._escKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC, true, false);
      kb.on('keydown-TAB', (e) => {
        e.preventDefault && e.preventDefault();
        this._handleTab();
      });
      kb.on('keydown-ESC', (e) => {
        this._handleEscape();
      });

      // Listen for crafting scene closed event
      this.game.events.on('crafting_closed', () => this._onCraftingClosed(), this);
      this.game.events.on('crafting_craft', (payload) => this._onCraftingCraft(payload), this);

      // Initial held-item sync
      this._syncSelectedItemToPlayer();

      // Camera fade in
      this.cameras.main.fadeIn(400, 0, 0, 0);

      // Welcome banner
      this.events.emit('hud_banner', { text: 'MACHINA - SURVIVE', color: '#ffffff', big: true });

      // Start zombie AI stagger
      this._aiBucket = 0;
    }

    setDarkness(a) {
      this.darknessAlphaTarget = a;
    }

    _drawVignette(intensity) {
      const W = this.scale.width, H = this.scale.height;
      this.vignette.clear();
      // Draw corners as black fading triangles
      const v = this.vignette;
      const steps = 14;
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        const alpha = intensity * (1 - t) * (1 - t);
        v.fillStyle(0x000000, alpha);
        v.fillRect(0, 0, W, 40 + i * 6);
        v.fillRect(0, H - 40 - i * 6, W, 40 + i * 6);
        v.fillRect(0, 0, 40 + i * 4, H);
        v.fillRect(W - 40 - i * 4, 0, 40 + i * 4, H);
      }
    }

    _hitStop(ms) {
      if (this._hitStopActive) return;
      this._hitStopActive = true;
      const prev = this.time.timeScale;
      this.time.timeScale = 0.0;
      this.physics.world.timeScale = 10; // high timescale in Phaser physics = slower
      setTimeout(() => {
        this.time.timeScale = 1;
        this.physics.world.timeScale = 1;
        this._hitStopActive = false;
      }, ms);
    }

    doSlowMoKill() {
      if (this._slowMoActive) return;
      this._slowMoActive = true;
      this.time.timeScale = 0.5;
      this.physics.world.timeScale = 2;
      setTimeout(() => {
        this.time.timeScale = 1;
        this.physics.world.timeScale = 1;
        this._slowMoActive = false;
      }, 500);
    }

    _findNearestMachine() {
      let best = null, bestD = 60 * 60;
      this.machinesGroup.getChildren().forEach(m => {
        if (!m.active) return;
        const dx = m.x - this.player.x, dy = m.y - this.player.y;
        const d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = m; }
      });
      return best;
    }

    _placementValid(x, y) {
      if (x < 60 || x > this.worldWidth - 60) return false;
      // not too close to another machine
      const kids = this.machinesGroup.getChildren();
      for (let i = 0; i < kids.length; i++) {
        if (!kids[i].active) continue;
        if (Math.abs(kids[i].x - x) < 80 && Math.abs(kids[i].y - y) < 80) return false;
      }
      // must be on a terrain body at or below placement Y (within 20px)
      const tiles = this.terrainGroup.getChildren();
      for (let i = 0; i < tiles.length; i++) {
        const t = tiles[i];
        const left = t.x - t.displayWidth / 2;
        const right = t.x + t.displayWidth / 2;
        const top = t.y - t.displayHeight / 2;
        if (x >= left - 8 && x <= right + 8 && Math.abs(top - y) < 24) return true;
      }
      return false;
    }

    _tryBuild() {
      const cls = this.machineClasses[this.selectedMachineIdx];
      if (!cls) return;
      // Max count
      const count = this.machinesGroup.getChildren().filter(m => m.active && m instanceof cls).length;
      if (count >= (cls.max || 99)) {
        this.events.emit('hud_banner', { text: 'MAX ' + cls.displayName.toUpperCase() + ' REACHED', color: '#ffaa44' });
        return;
      }
      if (!this.resourceSystem.has(cls.cost)) {
        this.events.emit('hud_banner', { text: 'NOT ENOUGH RESOURCES', color: '#ff4444' });
        return;
      }
      const ptr = this.input_.pointer;
      const wx = this.cameras.main.scrollX + ptr.x;
      // snap to ground Y
      const wy = 660;
      if (!this._placementValid(wx, wy)) {
        this.events.emit('hud_banner', { text: 'INVALID PLACEMENT', color: '#ff8844' });
        return;
      }
      this.resourceSystem.spend(cls.cost);
      const machine = new cls(this, wx, wy);
      this.machinesGroup.add(machine);
      machine.onBuilt();
      this.events.emit('hud_banner', { text: 'BUILT: ' + cls.displayName.toUpperCase(), color: '#44ff44' });
    }

    _cycleMachine(dir) {
      this.selectedMachineIdx = (this.selectedMachineIdx + dir + this.machineClasses.length) % this.machineClasses.length;
      this.events.emit('hud_machine_select', {
        name: this.machineClasses[this.selectedMachineIdx].displayName,
        cost: this.machineClasses[this.selectedMachineIdx].cost,
        index: this.selectedMachineIdx,
        count: this.machineClasses.length
      });
      this._syncSelectedItemToPlayer();
    }

    _selectedMachineTex() {
      return this._machineTex(this.machineClasses[this.selectedMachineIdx]);
    }

    _syncSelectedItemToPlayer() {
      if (!this.player || !this.player.setSelectedItem) return;
      const cls = this.machineClasses[this.selectedMachineIdx];
      const name = cls ? cls.displayName.toUpperCase() : 'RIFLE';
      const tex = cls ? this._machineTex(cls) : 'icon_gun';
      this.player.setSelectedItem(tex, name);
    }

    _findNearbyBench() {
      const kids = this.machinesGroup.getChildren();
      for (let i = 0; i < kids.length; i++) {
        const m = kids[i];
        if (!m.active || !(m instanceof MACHINA.CraftingBench)) continue;
        const dx = m.x - this.player.x, dy = m.y - this.player.y;
        if (dx * dx + dy * dy <= 80 * 80) return m;
      }
      return null;
    }

    _handleTab() {
      const sm = this.scene.manager;
      if (sm.isActive('CraftingUIScene') || sm.isPaused('CraftingUIScene')) {
        // Close crafting
        this.scene.stop('CraftingUIScene');
        this._onCraftingClosed();
        return;
      }
      if (this.paused) return; // pause menu open
      const bench = this._findNearbyBench();
      if (!bench) {
        this.events.emit('hud_banner', { text: 'NO CRAFTING BENCH NEARBY', color: '#ffaa44' });
        return;
      }
      // Launch crafting scene overlay
      this.scene.launch('CraftingUIScene', {
        inventory: this.resourceSystem.inventory,
        recipes: MACHINA.CraftingRecipes
      });
      this.scene.pause();
    }

    _handleEscape() {
      const sm = this.scene.manager;
      if (sm.isActive('CraftingUIScene') || sm.isPaused('CraftingUIScene')) {
        this.scene.stop('CraftingUIScene');
        this._onCraftingClosed();
        return;
      }
      this.togglePause();
    }

    _onCraftingClosed() {
      this.scene.resume();
      this.physics.world.resume();
    }

    _onCraftingCraft(payload) {
      if (!payload || !payload.recipe) return;
      const r = payload.recipe;
      if (!this.resourceSystem.has(r.cost)) return;
      if (!this.resourceSystem.spend(r.cost)) return;
      Object.keys(r.give).forEach(k => {
        if (k === 'turret_ammo') {
          const nearest = this.machinesGroup.getChildren().find(m => m.active && m instanceof MACHINA.AutoTurret);
          if (nearest) nearest.reload(r.give[k]);
        } else {
          this.resourceSystem.add(k, r.give[k]);
        }
      });
      MACHINA.AudioManager.play('sfx_machine_build');
      this.events.emit('hud_banner', { text: 'CRAFTED: ' + r.name.toUpperCase(), color: '#44ff44' });
      // broadcast updated inventory for crafting scene
      this.game.events.emit('crafting_inventory_update', this.resourceSystem.inventory);
    }

    _interact() {
      // nearest machine
      const near = this._findNearestMachine();
      if (near) {
        if (near instanceof MACHINA.Generator) {
          if (this.resourceSystem.inventory.fuel > 0 && near.refuel()) {
            this.resourceSystem.inventory.fuel--;
            this.events.emit('hud_banner', { text: 'REFUELED', color: '#44ff44' });
          } else if (this.resourceSystem.inventory.fuel <= 0) {
            this.events.emit('hud_banner', { text: 'NO FUEL', color: '#ff4444' });
          } else {
            this.events.emit('hud_banner', { text: 'GENERATOR FULL', color: '#ffaa44' });
          }
          return;
        }
        if (near instanceof MACHINA.AutoTurret) {
          if (this.resourceSystem.inventory.ammo >= 10) {
            const beforeAmmo = near.ammo;
            near.reload(15);
            const used = Math.min(10, (near.maxAmmo - beforeAmmo));
            this.resourceSystem.inventory.ammo -= Math.max(5, used);
            this.events.emit('hud_banner', { text: 'TURRET RELOADED', color: '#44ff44' });
          } else {
            this.events.emit('hud_banner', { text: 'NEED AMMO', color: '#ff4444' });
          }
          return;
        }
        if (near instanceof MACHINA.AlarmTrap) {
          const armed = near.toggleArm();
          this.events.emit('hud_banner', { text: armed ? 'ALARM ARMED' : 'ALARM DISARMED', color: armed ? '#ff8844' : '#aaaaaa' });
          return;
        }
        if (near instanceof MACHINA.CraftingBench) {
          this._handleTab();
          return;
        }
      }
      // else - pickup resource
      if (!this.resourceSystem.tryPickup(this.player)) {
        // heal if medkit available and low hp
        if (this.player.health < this.player.maxHealth && this.resourceSystem.inventory.medkit > 0) {
          this.resourceSystem.inventory.medkit--;
          this.player.heal(50);
          MACHINA.AudioManager.play('sfx_pickup');
          this.events.emit('hud_banner', { text: 'MEDKIT USED', color: '#44ff44' });
        }
      }
    }

    togglePause() {
      if (this.scene.manager.isActive('CraftingUIScene')) {
        this.scene.stop('CraftingUIScene');
        this._onCraftingClosed();
        return;
      }
      if (this.paused) {
        if (this.pauseUI) this.pauseUI.destroy();
        this.pauseUI = null;
        this.paused = false;
        this.physics.world.resume();
        return;
      }
      this.paused = true;
      this.physics.world.pause();
      const W = this.scale.width, H = this.scale.height;
      const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setScrollFactor(0).setDepth(200);
      const title = this.add.text(W / 2, H / 2 - 80, 'PAUSED', {
        fontFamily: 'Courier New', fontSize: '48px', color: '#ffffff'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
      const resume = this.add.text(W / 2, H / 2, '> RESUME', {
        fontFamily: 'Courier New', fontSize: '24px', color: '#ffdd88'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setInteractive({ useHandCursor: true });
      resume.on('pointerdown', () => this.togglePause());
      const quit = this.add.text(W / 2, H / 2 + 50, '> QUIT TO MENU', {
        fontFamily: 'Courier New', fontSize: '20px', color: '#ccaa66'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setInteractive({ useHandCursor: true });
      quit.on('pointerdown', () => {
        this.physics.world.resume();
        this.scene.stop('HUDScene');
        this.scene.start('MainMenuScene');
      });
      const mute = this.add.text(W / 2, H / 2 + 100, MACHINA.AudioManager.muted ? '> UNMUTE' : '> MUTE', {
        fontFamily: 'Courier New', fontSize: '18px', color: '#aaaaaa'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setInteractive({ useHandCursor: true });
      mute.on('pointerdown', () => {
        MACHINA.AudioManager.setMuted(!MACHINA.AudioManager.muted);
        mute.setText(MACHINA.AudioManager.muted ? '> UNMUTE' : '> MUTE');
      });
      this.pauseUI = this.add.container(0, 0, [bg, title, resume, quit, mute]).setScrollFactor(0).setDepth(200);
    }

    _updateLighting() {
      const W = this.scale.width, H = this.scale.height;
      // smooth darkness
      this.darknessAlpha += (this.darknessAlphaTarget - this.darknessAlpha) * 0.05;
      const rt = this.lightingRT;
      rt.clear();
      rt.fill(0x000000, this.darknessAlpha);
      // Erase around player
      const cam = this.cameras.main;
      const px = this.player.x - cam.scrollX;
      const py = this.player.y - cam.scrollY;
      rt.erase('light_circle', px - 180, py - 180);
      // Erase around powered generators / turrets / crafting / alarms
      this.machinesGroup.getChildren().forEach(m => {
        if (!m.active) return;
        const mx = m.x - cam.scrollX;
        const my = m.y - cam.scrollY;
        if (mx < -200 || mx > W + 200) return;
        if (m instanceof MACHINA.Generator && m.running) {
          rt.erase('light_circle', mx - 200, my - 200);
        } else if (m instanceof MACHINA.AutoTurret && m.powered) {
          rt.erase('light_circle', mx - 140, my - 140);
        } else if (m instanceof MACHINA.CraftingBench) {
          rt.erase('light_circle', mx - 140, my - 140);
        }
      });
    }

    update(time, delta) {
      if (this.paused) return;
      if (this.scene.manager.isActive('CraftingUIScene')) return;

      this.input_.update();

      // TAB/ESC are handled by direct keyboard events in create()

      // Player
      this.player.update(delta, this.input_);

      // Only the world-bottom is lethal; ground is now solid everywhere else.
      if (this.player.y > 712) {
        this.player.takeDamage(5, this.player.x);
      }

      // Zombie AI - stagger 4 buckets
      this._aiBucket = (this._aiBucket + 1) % 2;
      const zombies = this.zombieSpawner.zombies.getChildren();
      for (let i = 0; i < zombies.length; i++) {
        const z = zombies[i];
        if (!z.active) continue;
        // culling
        const dx = z.x - this.player.x;
        if (Math.abs(dx) > 1600) continue;
        if ((i % 2) === this._aiBucket) {
          z.update(delta);
        }
      }

      // Spawner
      this.zombieSpawner.update(delta);

      // Power grid
      this.powerGrid.update(delta);

      // Machines
      this.machinesGroup.getChildren().forEach(m => {
        if (m.active) m.update(delta);
      });

      // Wave manager
      this.waveManager.update(delta);

      // Interaction tooltip
      const near = this._findNearestMachine();
      if (near) {
        let txt = '[F] Interact';
        if (near instanceof MACHINA.Generator) txt = '[F] Refuel (' + this.resourceSystem.inventory.fuel + ')';
        else if (near instanceof MACHINA.AutoTurret) txt = '[F] Reload Turret';
        else if (near instanceof MACHINA.AlarmTrap) txt = '[F] ' + (near.armed ? 'Disarm' : 'Arm');
        else if (near instanceof MACHINA.CraftingBench) txt = '[F/TAB] Craft';
        this.interactTooltip.setText(txt).setPosition(near.x, near.y - near.displayHeight - 10).setVisible(true);
      } else {
        // show pickup tooltip when near a drop
        let nearestDrop = null, bestD = 40 * 40;
        this.resourceSystem.drops.getChildren().forEach(d => {
          if (!d.active) return;
          const dx = d.x - this.player.x, dy = d.y - this.player.y;
          if (dx * dx + dy * dy < bestD) { bestD = dx * dx + dy * dy; nearestDrop = d; }
        });
        if (nearestDrop) {
          this.interactTooltip.setText('[F] Pickup ' + nearestDrop.resType).setPosition(nearestDrop.x, nearestDrop.y - 20).setVisible(true);
        } else {
          this.interactTooltip.setVisible(false);
        }
      }

      // Input actions
      if (this.input_.justDown('interact')) this._interact();
      if (this.input_.justDown('cyclePrev')) this._cycleMachine(-1);
      if (this.input_.justDown('cycleNext')) this._cycleMachine(1);
      if (this.input_.justDown('place')) this._tryBuild();

      // IMPROVEMENT A - Ghost preview follows mouse cursor with tooltip
      const ptr = this.input_.pointer;
      const wx = this.cameras.main.scrollX + ptr.x;
      const wy = 660;
      const cls = this.machineClasses[this.selectedMachineIdx];
      const ghostTex = cls ? this._machineTex(cls) : 'machine_barricade';
      if (this.ghost.texture.key !== ghostTex) {
        this.ghost.setTexture(ghostTex);
      }
      this.ghost.setPosition(wx, wy);
      const canAfford = this.resourceSystem.has(cls.cost);
      const validPos = this._placementValid(wx, wy);
      const valid = validPos && canAfford;
      this.ghost.setTint(valid ? 0x00ff88 : 0xff3333);
      this.ghost.setAlpha(0.6);

      // Tooltip
      const costStr = Object.keys(cls.cost).map(k => cls.cost[k] + 'x ' + k.toUpperCase()).join('  ');
      let tip;
      if (!canAfford) {
        tip = 'INSUFFICIENT RESOURCES';
      } else if (!validPos) {
        tip = 'INVALID PLACEMENT';
      } else {
        tip = '[RIGHT CLICK] Place  |  ' + cls.displayName + ' - ' + costStr;
      }
      this.ghostTooltip.setText(tip);
      this.ghostTooltip.setColor(canAfford ? '#ffffff' : '#ff8888');
      this.ghostTooltip.setPosition(wx, wy - this.ghost.displayHeight - 6).setVisible(true);

      // Lighting
      this._updateLighting();

      // Parallax factory bg
      const cam = this.cameras.main;
      this.bgFactoryParts.forEach((b, i) => {
        const baseX = i * 1280;
        b.x = baseX - (cam.scrollX * 0.3) % (1280 * 6);
      });

      // HUD update
      this.events.emit('hud_update', {
        health: this.player.health,
        maxHealth: this.player.maxHealth,
        stamina: this.player.stamina,
        maxStamina: this.player.maxStamina,
        mag: this.player.mag,
        ammo: this.player.currentAmmo,
        reloading: this.player.isReloading,
        inventory: this.resourceSystem.inventory,
        power: { supply: this.powerGrid.supply, demand: this.powerGrid.demand },
        wave: this.waveManager.index + 1,
        waveName: this.waveManager.currentWave() ? this.waveManager.currentWave().name : '',
        waveState: this.waveManager.state,
        waveTimer: Math.max(0, this.waveManager.stateTimer),
        score: this.waveManager.score,
        machineName: cls ? cls.displayName : '',
        machineCost: cls ? cls.cost : {},
        remainingInWave: this.zombieSpawner.count() + this.zombieSpawner.queue.length
      });
    }

    _machineTex(cls) {
      if (cls === MACHINA.Barricade) return 'machine_barricade';
      if (cls === MACHINA.AutoTurret) return 'machine_turret_base';
      if (cls === MACHINA.Generator) return 'machine_generator';
      if (cls === MACHINA.CraftingBench) return 'machine_crafting';
      if (cls === MACHINA.AlarmTrap) return 'machine_alarm';
      return 'machine_barricade';
    }

    _cleanup() {
      MACHINA.AudioManager.stop('music_ambient');
      MACHINA.AudioManager.stop('sfx_generator_hum');
    }
  }

  MACHINA.GameScene = GameScene;
})();
