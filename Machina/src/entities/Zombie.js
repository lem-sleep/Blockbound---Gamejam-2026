// Zombie.js
(function () {
  const STATES = { WANDER: 'wander', CHASE: 'chase', ATTACK: 'attack', ATTACK_BARRICADE: 'attack_barricade', DEAD: 'dead' };

  const TYPES = {
    walker: {
      texture: 'zombie_walker', health: 40, speed: 60, damage: 15, xp: 10, score: 10,
      detectRange: 800, attackRange: 36, bodyW: 20, bodyH: 40, moanChance: 0.002,
      dropChance: { scrap: 0.6, ammo: 0.2, parts: 0.08 }
    },
    runner: {
      texture: 'zombie_runner', health: 25, speed: 160, damage: 20, xp: 15, score: 15,
      detectRange: 900, attackRange: 34, bodyW: 18, bodyH: 38, moanChance: 0.003,
      dropChance: { scrap: 0.4, parts: 0.3, ammo: 0.1 }
    },
    brute: {
      texture: 'zombie_brute', health: 200, speed: 35, damage: 40, xp: 50, score: 50,
      detectRange: 700, attackRange: 48, bodyW: 34, bodyH: 52, moanChance: 0.002,
      dropChance: { parts: 1.0, fuel: 1.0, scrap: 0.8 }
    },
    mega: {
      texture: 'zombie_brute', health: 500, speed: 50, damage: 50, xp: 200, score: 200,
      detectRange: 1200, attackRange: 56, bodyW: 42, bodyH: 60, moanChance: 0.005,
      dropChance: { parts: 1.0, fuel: 1.0, scrap: 1.0, medkit: 1.0 }
    }
  };

  class Zombie extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
      super(scene, x, y, 'zombie_walker');
      scene.add.existing(this);
      scene.physics.add.existing(this);
      this.setDepth(19);
      this.type = 'walker';
      this.fsmState = STATES.WANDER;
      this.wanderDir = Math.random() < 0.5 ? -1 : 1;
      this.attackCooldown = 0;
      this.moanTimer = 0;
      this.staggerTimer = 0;
      this.rageActive = false;
      this.isMega = false;
      this.barricadeTarget = null;
      // Prevent tunnelling through floors at high velocity
      if (this.body && this.body.setMaxVelocityY) this.body.setMaxVelocityY(800);
      // HP bar (only rendered for brute/mega)
      this._hpBarBg = null;
      this._hpBar = null;
    }

    spawn(type, x, y) {
      const def = TYPES[type] || TYPES.walker;
      this.type = type;
      this.isMega = type === 'mega';
      this.setActive(true).setVisible(true);
      this.setTexture(def.texture);
      if (this.isMega) {
        this.setScale(1.8);
      } else {
        this.setScale(1);
      }
      this.body.enable = true;
      if (this.body.setMaxVelocityY) this.body.setMaxVelocityY(800);
      this.setCollideWorldBounds(true);
      this.setPosition(x, y);
      this.body.setSize(def.bodyW, def.bodyH);
      this.body.setOffset(
        (this.frame.width - def.bodyW) / 2,
        this.frame.height - def.bodyH - 2
      );
      this.maxHealth = def.health;
      this.health = def.health;
      this.speed = def.speed;
      this.damage = def.damage;
      this.score = def.score;
      this.detectRange = def.detectRange;
      this.attackRange = def.attackRange;
      this.moanChance = def.moanChance;
      this.dropChance = def.dropChance;
      this.fsmState = STATES.WANDER;
      this.wanderDir = x < this.scene.player.x ? 1 : -1;
      this.rageActive = false;
      this.tint = 0xffffff;
      this.alpha = 1;
      this.angle = 0;
      this.setVelocity(0, 0);
      this.barricadeTarget = null;
      // HP bar (brutes and mega only)
      if ((this.type === 'brute' || this.isMega) && !this._hpBarBg) {
        this._hpBarBg = this.scene.add.rectangle(x, y - 40, 30, 3, 0x220000).setDepth(50).setVisible(false);
        this._hpBar = this.scene.add.rectangle(x, y - 40, 30, 3, 0xff4444).setOrigin(0, 0.5).setDepth(51).setVisible(false);
      }
    }

    takeDamage(amount, fromX) {
      if (!this.active || this.fsmState === STATES.DEAD) return;
      this.health -= amount;
      // flash
      this.setTint(0xff6666);
      this.scene.time.delayedCall(80, () => {
        if (this.active) this.setTint(this.rageActive ? 0xff8080 : 0xffffff);
      });
      if (this.scene.particlePool) this.scene.particlePool.emit('blood', this.x, this.y - 8);
      MACHINA.AudioManager.play('sfx_hit_zombie');
      // damage number
      const dmg = this.scene.add.text(this.x, this.y - 30, String(Math.floor(amount)), {
        fontFamily: 'Courier New', fontSize: '14px', color: '#ffdddd', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(60);
      this.scene.tweens.add({
        targets: dmg, y: dmg.y - 22, alpha: 0, duration: 700, onComplete: () => dmg.destroy()
      });
      // flinch
      if (this.type === 'runner') {
        this.setVelocityX(fromX < this.x ? 120 : -120);
      } else {
        this.staggerTimer = 120;
      }
      // Brute rage
      if (this.type === 'brute' && !this.rageActive && this.health <= this.maxHealth * 0.5) {
        this.rageActive = true;
        this.speed = 70;
        this.setTint(0xff8080);
      }
      if (this.type === 'mega' && !this.rageActive && this.health <= this.maxHealth * 0.4) {
        this.rageActive = true;
        this.speed = 100;
        this.setTint(0xff6060);
      }
      if (this.health <= 0) this.kill();
    }

    kill() {
      if (this.fsmState === STATES.DEAD) return;
      this.fsmState = STATES.DEAD;
      this.body.enable = false;
      // Blood bursts immediately
      if (this.scene.particlePool) {
        this.scene.particlePool.emit('blood', this.x, this.y);
        if (this.isMega || this.type === 'brute') {
          this.scene.particlePool.emit('explosion', this.x, this.y - 20);
          MACHINA.AudioManager.play('sfx_explosion');
          this.scene.cameras.main.shake(250, 0.012);
        }
      }
      // Hide HP bar
      if (this._hpBarBg) this._hpBarBg.setVisible(false);
      if (this._hpBar) this._hpBar.setVisible(false);
      // Fast death: rotate 200ms, then fade 200ms (400ms total)
      const dir = this.scene.player ? (this.x < this.scene.player.x ? -1 : 1) : (Math.random() < 0.5 ? -1 : 1);
      this.scene.tweens.add({
        targets: this,
        angle: dir * 90,
        x: this.x + dir * 10,
        y: this.y + 6,
        duration: 200,
        ease: 'Quad.easeIn',
        onComplete: () => {
          this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 200,
            onComplete: () => this.returnToPool()
          });
        }
      });
      // drops
      this.dropLoot();
      // events
      this.scene.events.emit('zombie_killed', { x: this.x, y: this.y, type: this.type, score: this.score });
    }

    dropLoot() {
      if (!this.dropChance) return;
      const rs = this.scene.resourceSystem;
      if (!rs) return;
      Object.keys(this.dropChance).forEach(k => {
        if (Math.random() < this.dropChance[k]) {
          rs.dropResource(k, this.x, this.y - 10);
        }
      });
    }

    returnToPool() {
      this.setActive(false).setVisible(false);
      this.setPosition(-9999, -9999);
      this.angle = 0;
      this.alpha = 1;
      this.setTint(0xffffff);
      if (this._hpBarBg) this._hpBarBg.setVisible(false);
      if (this._hpBar) this._hpBar.setVisible(false);
      this.barricadeTarget = null;
    }

    _findNearbyBarricade() {
      if (!this.scene.machinesGroup) return null;
      const kids = this.scene.machinesGroup.getChildren();
      let best = null, bestD = 40 * 40;
      for (let i = 0; i < kids.length; i++) {
        const m = kids[i];
        if (!m.active || !m.blocksZombies) continue;
        const dx = m.x - this.x, dy = m.y - this.y;
        const d = dx * dx + dy * dy;
        // Only consider barricades on the side we're facing toward the player
        const playerSide = (this.scene.player.x - this.x);
        const barricadeSide = (m.x - this.x);
        if (Math.sign(playerSide) !== Math.sign(barricadeSide) && barricadeSide !== 0) continue;
        if (d < bestD) { bestD = d; best = m; }
      }
      return best;
    }

    update(delta) {
      if (!this.active || this.fsmState === STATES.DEAD) return;
      if (this.staggerTimer > 0) {
        this.staggerTimer -= delta;
        this.setVelocityX(this.body.velocity.x * 0.9);
        return;
      }
      const player = this.scene.player;
      if (!player) return;
      this.moanTimer -= delta;
      if (Math.random() < this.moanChance && this.moanTimer <= 0) {
        MACHINA.AudioManager.playRandomMoan();
        this.moanTimer = 4000 + Math.random() * 10000;
      }

      const dx = player.x - this.x;
      const dist = Math.abs(dx);
      const dir = dx > 0 ? 1 : -1;

      // Check for nearby barricade blocking path
      let barricade = null;
      if (!player.dead && (this.fsmState === STATES.CHASE || this.fsmState === STATES.ATTACK_BARRICADE)) {
        barricade = this._findNearbyBarricade();
      }

      if (player.dead) {
        this.fsmState = STATES.WANDER;
      } else if (barricade) {
        this.fsmState = STATES.ATTACK_BARRICADE;
        this.barricadeTarget = barricade;
      } else if (dist < this.attackRange && Math.abs(player.y - this.y) < 60) {
        this.fsmState = STATES.ATTACK;
      } else if (dist < this.detectRange) {
        this.fsmState = STATES.CHASE;
      }

      if (this.fsmState === STATES.CHASE) {
        this.setVelocityX(dir * this.speed);
        this.setFlipX(dir < 0);
        // NOTE: Deliberately NOT jumping when blocked so zombies cannot leap barricades.
        // tiny oscillation for walk
        this.scaleY = 1 + Math.sin(this.scene.time.now * 0.012 + this.x * 0.01) * 0.03;
      } else if (this.fsmState === STATES.ATTACK) {
        this.setVelocityX(0);
        this.attackCooldown -= delta;
        if (this.attackCooldown <= 0) {
          this.attackCooldown = 800;
          if (Math.abs(player.x - this.x) < this.attackRange + 6) {
            player.takeDamage(this.damage, this.x);
          }
        }
      } else if (this.fsmState === STATES.ATTACK_BARRICADE) {
        this.setVelocityX(0);
        this.setFlipX(dir < 0);
        // rapid attack oscillation (visual)
        this.scaleX = (dir < 0 ? -1 : 1) * (1 + Math.sin(this.scene.time.now * 0.025) * 0.05);
        // Deal 10 DPS to the barricade
        if (this.barricadeTarget && this.barricadeTarget.active) {
          this.barricadeTarget.takeDamage(10 * delta / 1000);
        } else {
          this.barricadeTarget = null;
          this.fsmState = STATES.CHASE;
        }
      } else {
        this.setVelocityX(this.wanderDir * (this.speed * 0.3));
        this.setFlipX(this.wanderDir < 0);
        if (Math.random() < 0.001) this.wanderDir *= -1;
        const onGround = this.body.blocked.down || this.body.touching.down;
        if (onGround && this.body.blocked[this.wanderDir > 0 ? 'right' : 'left']) {
          this.wanderDir *= -1;
        }
      }

      // HP bar for brute/mega
      if (this._hpBar && this._hpBarBg) {
        const dmg = this.health < this.maxHealth;
        const width = this.isMega ? 50 : 30;
        this._hpBarBg.setVisible(dmg);
        this._hpBar.setVisible(dmg);
        if (dmg) {
          this._hpBarBg.setPosition(this.x, this.y - (this.displayHeight / 2) - 8);
          this._hpBarBg.setSize(width, 3);
          this._hpBar.setPosition(this.x - width / 2, this.y - (this.displayHeight / 2) - 8);
          this._hpBar.width = width * Math.max(0, this.health / this.maxHealth);
        }
      }

      // Brute footstep shake
      if (this.type === 'brute' || this.isMega) {
        this._stompAccum = (this._stompAccum || 0) + delta;
        if (this._stompAccum > 1500) {
          this._stompAccum = 0;
          const cam = this.scene.cameras.main;
          if (cam && Math.abs(this.x - cam.scrollX - 640) < 900) {
            cam.shake(80, this.isMega ? 0.008 : 0.004);
          }
        }
      }
    }
  }

  MACHINA.Zombie = Zombie;
  MACHINA.ZombieStates = STATES;
  MACHINA.ZombieTypes = TYPES;
})();
