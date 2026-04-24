// InputHandler.js - wraps keyboard + pointer + basic gamepad
(function () {
  class InputHandler {
    constructor(scene) {
      this.scene = scene;
      this.keys = {};
      this.prev = {};
      const kb = scene.input.keyboard;
      const K = Phaser.Input.Keyboard.KeyCodes;
      this.bindings = {
        left:       [K.A, K.LEFT],
        right:      [K.D, K.RIGHT],
        up:         [K.W, K.UP],
        down:       [K.S, K.DOWN],
        jump:       [K.SPACE, K.W, K.UP],
        sprint:     [K.SHIFT],
        reload:     [K.R],
        interact:   [K.F],
        cyclePrev:  [K.Q],
        cycleNext:  [K.E],
        craft:      [K.TAB],
        pause:      [K.ESC],
        build:      [K.B],
        num1:       [K.ONE],
        num2:       [K.TWO],
        num3:       [K.THREE],
        num4:       [K.FOUR],
        num5:       [K.FIVE]
      };
      // Phaser Key objects (capture keys so browser doesn't scroll on space/arrows)
      this._k = {};
      Object.keys(this.bindings).forEach(name => {
        this._k[name] = this.bindings[name].map(kc => kb.addKey(kc, true, false));
      });

      // Pointer
      this.pointer = scene.input.activePointer;
      this.pointerJustDown = false;
      this.pointerJustDownRight = false;
      scene.input.on('pointerdown', (p) => {
        if (p.leftButtonDown()) this._shootDown = true;
        if (p.rightButtonDown()) this._buildDown = true;
      });
      scene.input.on('pointerup', (p) => {
        if (p.leftButtonReleased()) this._shootDown = false;
        if (p.rightButtonReleased()) this._buildDown = false;
      });
      // prevent context menu on right-click
      scene.input.mouse.disableContextMenu();
    }

    update() {
      // Track justDown edges
      Object.keys(this._k).forEach(name => {
        const downNow = this._k[name].some(k => k.isDown);
        this.prev[name] = !!this.keys[name];
        this.keys[name] = downNow;
      });
      // pointer edges
      const now = this.pointer.leftButtonDown();
      this.pointerJustDown = now && !this._prevLeft;
      this._prevLeft = now;
      const rnow = this.pointer.rightButtonDown();
      this.pointerJustDownRight = rnow && !this._prevRight;
      this._prevRight = rnow;
    }

    isDown(name) {
      if (name === 'shoot') return this.pointer.leftButtonDown();
      if (name === 'place') return this.pointer.rightButtonDown();
      return !!this.keys[name];
    }

    justDown(name) {
      if (name === 'shoot') return this.pointerJustDown;
      if (name === 'place') return this.pointerJustDownRight;
      return !!this.keys[name] && !this.prev[name];
    }
  }

  MACHINA.InputHandler = InputHandler;
})();
