// Player.js
(function () {
  const STATES = { IDLE: 'idle', RUN: 'run', JUMP: 'jump', CROUCH: 'crouch', DEAD: 'dead' };

  class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
      super(scene, x, y, 'player_idle');
      scene.add.existing(this);
      scene.physics.add.existing(this);
      this.setDepth(20);
      this.setOrigin(0.5, 0.5);
      this.body.setSize(20, 44);
      this.body.setOffset(6, 2);
      this.setCollideWorldBounds(true);

      this.maxHealth = 100;
      this.health = 100;
      this.maxStamina = 100;
      this.stamina = 100;
      this.moveSpeed = 180;
      this.sprintSpeed = 280;
      this.crouchSpeed = 80;
      this.jumpVelocity = -500;
      this.maxAmmo = 120;
      this.currentAmmo = 90;
      this.magSize = 10;
      this.mag = 10;
      this.facing = 1;
      this.state_ = STATES.IDLE;
      this.shootCooldown = 0;
      this.reloadTimer = 0;
      this.iframes = 0;
      this.canSprint = true;
      this.dead = false;
      this.interactTarget = null;

      // Held item sprite (follows player hand)
      this.heldItem = scene.add.image(x + 18, y + 8, 'icon_gun').setDepth(21).setOrigin(0.5);
      this.heldItemKey = 'icon_gun';

      // Label above head showing selected item name
      this.selectedItemLabel = scene.add.text(x, y - 52, 'RIFLE', {
        fontFamily: 'Courier New',
        fontSize: '10px',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: { x: 3, y: 1 }
      }).setOrigin(0.5).setDepth(22);
      this._labelName = 'RIFLE';
    }

    setSelectedItem(key, name) {
      if (this.heldItemKey !== key) {
        this.heldItemKey = key;
        if (this.heldItem) this.heldItem.setTexture(key);
      }
      if (this._labelName !== name) {
        this._labelName = name;
        if (this.selectedItemLabel) {
          this.selectedItemLabel.setText(name);
          // scale-up entrance tween
          this.selectedItemLabel.setScale(0);
          this.scene.tweens.add({
            targets: this.selectedItemLabel, scale: 1, duration: 150, ease: 'Back.easeOut'
          });
        }
      }
    }

    get isReloading() { return this.reloadTimer > 0; }

    takeDamage(amount, fromX) {
      if (this.dead || this.iframes > 0) return;
      this.health -= amount;
      this.iframes = 1500;
      MACHINA.AudioManager.play('sfx_player_hurt');
      const kb = fromX != null ? (fromX < this.x ? 220 : -220) : -150;
      this.setVelocity(kb, -200);
      this.scene.cameras.main.shake(120, 0.008);
      // hit stop
      this.scene._hitStop && this.scene._hitStop(60);
      // blood
      if (this.scene.particlePool) this.scene.particlePool.emit('blood', this.x, this.y);
      if (this.scene.events) this.scene.events.emit('player_damaged', this.health);
      if (this.health <= 0) this.die();
    }

    heal(amount) {
      if (this.dead) return;
      this.health = Math.min(this.maxHealth, this.health + amount);
      this.scene.events && this.scene.events.emit('player_damaged', this.health);
    }

    die() {
      if (this.dead) return;
      this.dead = true;
      this.health = 0;
      this.state_ = STATES.DEAD;
      this.setTexture('player_dead');
      this.setVelocity(0, 0);
      this.scene.cameras.main.shake(300, 0.02);
      this.scene.cameras.main.flash(500, 255, 0, 0);
      this.scene.events.emit('player_died');
    }

    reload() {
      if (this.isReloading) return;
      if (this.mag >= this.magSize) return;
      if (this.currentAmmo <= 0) return;
      this.reloadTimer = 1800;
      MACHINA.AudioManager.play('sfx_reload');
    }

    shoot(input) {
      if (this.dead) return;
      if (this.shootCooldown > 0) return;
      if (this.isReloading) return;
      if (this.state_ === STATES.CROUCH) return;
      if (this.mag <= 0) {
        this.reload();
        return;
      }
      this.mag--;
      this.shootCooldown = 250;
      // muzzle pos
      const mx = this.x + (this.facing * 22);
      const my = this.y - 4;
      // projectile from pool
      const proj = this.scene.projectilePool.get(mx, my);
      if (proj) {
        proj.fire(mx, my, this.facing, 700, 20);
      }
      // muzzle flash
      const flash = this.scene.add.image(mx, my, 'muzzle_flash').setDepth(31);
      flash.setScale(1.2);
      this.scene.tweens.add({ targets: flash, alpha: 0, duration: 80, onComplete: () => flash.destroy() });
      MACHINA.AudioManager.play('sfx_shoot');
      this.scene.cameras.main.shake(60, 0.003);
      // held item recoil
      if (this.heldItem) {
        this.scene.tweens.add({
          targets: this.heldItem, scale: 0.8, duration: 40, yoyo: true
        });
      }
      if (this.mag === 0) this.reload();
    }

    update(delta, input) {
      if (this.dead) {
        this.setVelocityX(0);
        if (this.heldItem) this.heldItem.setVisible(false);
        if (this.selectedItemLabel) this.selectedItemLabel.setVisible(false);
        return;
      }
      this.iframes = Math.max(0, this.iframes - delta);
      this.shootCooldown = Math.max(0, this.shootCooldown - delta);
      if (this.reloadTimer > 0) {
        this.reloadTimer -= delta;
        if (this.reloadTimer <= 0) {
          const need = this.magSize - this.mag;
          const take = Math.min(need, this.currentAmmo);
          this.mag += take;
          this.currentAmmo -= take;
        }
      }

      // Flicker during iframes
      this.alpha = this.iframes > 0 ? (Math.floor(this.iframes / 80) % 2 === 0 ? 0.4 : 1) : 1;

      const onGround = this.body.blocked.down || this.body.touching.down;
      const wantCrouch = input.isDown('down') && onGround;
      const wantSprint = input.isDown('sprint') && this.stamina > 10 && !wantCrouch && this.canSprint;

      // stamina
      if (wantSprint && Math.abs(this.body.velocity.x) > 10) {
        this.stamina -= (20 * delta / 1000);
        if (this.stamina <= 0) { this.stamina = 0; this.canSprint = false; }
      } else {
        this.stamina = Math.min(this.maxStamina, this.stamina + (10 * delta / 1000));
        if (this.stamina >= 30) this.canSprint = true;
      }

      let speed = this.moveSpeed;
      if (wantSprint) speed = this.sprintSpeed;
      if (wantCrouch) speed = this.crouchSpeed;

      let vx = 0;
      if (input.isDown('left')) { vx = -speed; this.facing = -1; }
      else if (input.isDown('right')) { vx = speed; this.facing = 1; }
      this.setVelocityX(vx);
      this.setFlipX(this.facing === -1);

      // jump
      if (input.justDown('jump') && onGround && !wantCrouch) {
        this.setVelocityY(this.jumpVelocity);
      }

      // shoot
      if (input.isDown('shoot')) this.shoot(input);
      if (input.justDown('reload')) this.reload();

      // state
      if (!onGround) this.state_ = STATES.JUMP;
      else if (wantCrouch) this.state_ = STATES.CROUCH;
      else if (Math.abs(vx) > 5) this.state_ = STATES.RUN;
      else this.state_ = STATES.IDLE;

      // animation
      if (this.state_ === STATES.RUN) {
        try { this.anims.play('player_walk', true); } catch(_) {}
      } else if (this.state_ === STATES.CROUCH) {
        this.anims.stop();
        this.setTexture('player_crouch');
      } else if (this.state_ === STATES.JUMP) {
        this.anims.stop();
        this.setTexture('player_run_1');
      } else {
        this.anims.stop();
        this.setTexture('player_idle');
      }

      // Crouch body
      if (wantCrouch) {
        this.body.setSize(22, 32);
        this.body.setOffset(5, 14);
      } else {
        this.body.setSize(20, 44);
        this.body.setOffset(6, 2);
      }

      // Held item follows hand
      if (this.heldItem) {
        this.heldItem.setVisible(true);
        this.heldItem.setPosition(this.x + (this.facing * 18), this.y + 8);
        this.heldItem.setFlipX(this.facing === -1);
      }
      if (this.selectedItemLabel) {
        this.selectedItemLabel.setVisible(true);
        this.selectedItemLabel.setPosition(this.x, this.y - 52);
      }
    }

    destroy(fromScene) {
      if (this.heldItem) this.heldItem.destroy();
      if (this.selectedItemLabel) this.selectedItemLabel.destroy();
      super.destroy(fromScene);
    }
  }

  MACHINA.Player = Player;
  MACHINA.PlayerStates = STATES;
})();
