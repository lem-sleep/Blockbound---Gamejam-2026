// PowerGrid.js
(function () {
  class PowerGrid {
    constructor(scene) {
      this.scene = scene;
      this.supply = 0;
      this.demand = 0;
    }

    update(delta) {
      let supply = 0, demand = 0;
      const machines = this.scene.machinesGroup.getChildren();
      machines.forEach(m => {
        if (!m.active) return;
        if (m instanceof MACHINA.Generator) {
          if (m.running) supply += m.powerOutput;
        }
      });
      // Deterministic allocation: iterate requiring machines and power while supply remains
      let remaining = supply;
      machines.forEach(m => {
        if (!m.active) return;
        if (m.requiresPower) {
          if (remaining >= m.powerDraw) {
            if (!m.powered) m.powered = true;
            remaining -= m.powerDraw;
            demand += m.powerDraw;
          } else {
            m.powered = false;
            demand += m.powerDraw;
          }
        }
      });
      this.supply = supply;
      this.demand = demand;
    }
  }
  MACHINA.PowerGrid = PowerGrid;
})();
