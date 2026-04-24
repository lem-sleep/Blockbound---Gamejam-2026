// CraftingBench.js
(function () {
  class CraftingBench extends MACHINA.MachineBase {
    constructor(scene, x, y) {
      super(scene, x, y, 'machine_crafting');
      this.setOrigin(0.5, 1);
      this.body.setSize(64, 56);
      this.body.setOffset(0, 0);
      this.body.updateFromGameObject();
      this.maxHealth = 120;
      this.health = 120;
      this.buildCost = { scrap: 3, parts: 1 };
      this.name_ = 'Crafting Bench';
      this.requiresPower = false;

      this.hintText = scene.add.text(x, y - 60, '[F] CRAFT', {
        fontFamily: 'Courier New', fontSize: '10px', color: '#ffdd88', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(17);
      this.uiText = this.hintText;
    }
    destroyMachine() { if (this.hintText) this.hintText.destroy(); super.destroyMachine(); }
    update() {
      if (this.hintText) this.hintText.setPosition(this.x, this.y - 60);
    }
  }
  CraftingBench.displayName = 'Crafting Bench';
  CraftingBench.cost = { scrap: 3, parts: 1 };
  CraftingBench.max = 1;
  MACHINA.CraftingBench = CraftingBench;

  MACHINA.CraftingRecipes = [
    { id: 'medkit', name: 'Medkit',      cost: { scrap: 1, parts: 2 },         give: { medkit: 1 } },
    { id: 'ammo',   name: 'Ammo Pack',   cost: { scrap: 2, parts: 1 },         give: { ammo: 30 } },
    { id: 'fuel',   name: 'Fuel Can',    cost: { scrap: 2, parts: 2 },         give: { fuel: 1 } },
    { id: 't_ammo', name: 'Turret Reload',cost: { scrap: 2, ammo: 5 },          give: { turret_ammo: 15 } },
  ];
})();
