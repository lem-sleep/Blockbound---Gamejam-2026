// AlarmTrap.js
(function () {
  class AlarmTrap extends MACHINA.MachineBase {
    constructor(scene, x, y) {
      super(scene, x, y, 'machine_alarm');
      this.setOrigin(0.5, 1);
      this.body.setSize(24, 32);
      this.body.setOffset(0, 0);
      this.body.updateFromGameObject();
      this.maxHealth = 60;
      this.health = 60;
      this.buildCost = { scrap: 2 };
      this.name_ = 'Alarm Trap';
      this.armed = true;
      this.triggered = false;
      this.triggerTimer = 0;

      this.light = scene.add.circle(x, y - 30, 5, 0xff3333).setDepth(16).setAlpha(0.8);
      this.statusText = scene.add.text(x, y - 48, 'ARMED', {
        fontFamily: 'Courier New', fontSize: '10px', color: '#ffaaaa', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(17);
      this.uiText = this.statusText;
    }

    toggleArm() {
      this.armed = !this.armed;
      this.triggered = false;
      return this.armed;
    }

    destroyMachine() {
      if (this.light) this.light.destroy();
      if (this.statusText) this.statusText.destroy();
      super.destroyMachine();
    }

    update(delta) {
      if (!this.active) return;
      if (this.light) {
        this.light.setPosition(this.x, this.y - 30);
        if (this.triggered) {
          this.light.setAlpha(0.5 + Math.abs(Math.sin(this.scene.time.now * 0.02)) * 0.5);
          this.light.setRadius(8);
          this.light.setFillStyle(0xff0000);
        } else if (this.armed) {
          this.light.setAlpha(0.4 + Math.sin(this.scene.time.now * 0.004) * 0.2);
          this.light.setRadius(5);
          this.light.setFillStyle(0xff3333);
        } else {
          this.light.setAlpha(0.3);
          this.light.setRadius(4);
          this.light.setFillStyle(0x444444);
        }
      }
      if (this.statusText) {
        this.statusText.setPosition(this.x, this.y - 48);
        this.statusText.setText(this.triggered ? 'ALARM!' : (this.armed ? 'ARMED' : 'OFF'));
      }
      if (this.triggered) {
        this.triggerTimer -= delta;
        if (this.triggerTimer <= 0) {
          this.triggered = false;
        }
      } else if (this.armed) {
        // detect zombies within 80
        const zombies = this.scene.zombieSpawner && this.scene.zombieSpawner.zombies;
        if (zombies) {
          const children = zombies.getChildren();
          for (let i = 0; i < children.length; i++) {
            const z = children[i];
            if (!z.active) continue;
            const dx = z.x - this.x, dy = z.y - this.y;
            if (dx * dx + dy * dy < 80 * 80) {
              this.trigger();
              break;
            }
          }
        }
      }
    }

    trigger() {
      this.triggered = true;
      this.triggerTimer = 2500;
      MACHINA.AudioManager.play('sfx_alarm', { volume: 0.5 });
      // Attract nearby zombies (boost their detect range temporarily)
      const zombies = this.scene.zombieSpawner && this.scene.zombieSpawner.zombies;
      if (zombies) {
        zombies.getChildren().forEach(z => {
          if (!z.active) return;
          z.fsmState = 'chase';
        });
      }
    }
  }
  AlarmTrap.displayName = 'Alarm Trap';
  AlarmTrap.cost = { scrap: 2 };
  AlarmTrap.max = 4;
  MACHINA.AlarmTrap = AlarmTrap;
})();
