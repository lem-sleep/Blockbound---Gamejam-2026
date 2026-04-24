// CraftingUIScene.js - FIX 1: inventory-style crafting GUI
(function () {
  const RECIPE_ICONS = {
    medkit: 'icon_medkit_big',
    ammo: 'icon_ammopack',
    fuel: 'res_fuel',
    t_ammo: 'icon_turretammo',
    molotov: 'icon_molotov',
    pipebomb: 'icon_pipebomb'
  };

  const RECIPE_DESC = {
    medkit: 'Instant heal. Restores 50 HP when used.',
    ammo: 'A box of pistol rounds. Refills 30 rounds.',
    fuel: 'Generator fuel canister. Keeps the lights on.',
    t_ammo: 'Reloads the nearest Auto Turret by 15 rounds.',
    molotov: 'Incendiary bottle. Burns clusters of zombies.',
    pipebomb: 'Pipe bomb. Large explosion damages everything.'
  };

  class CraftingUIScene extends Phaser.Scene {
    constructor() { super({ key: 'CraftingUIScene', active: false }); }

    init(data) {
      this.inventory = (data && data.inventory) || {};
      this.recipes = (data && data.recipes) || MACHINA.CraftingRecipes || [];
      this.selectedIndex = 0;
    }

    create() {
      const W = this.scale.width, H = this.scale.height;
      // Full-screen dim overlay
      this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65).setDepth(0);

      // Main panel
      const panelW = 640, panelH = 400;
      const panelX = W / 2, panelY = H / 2;
      this.panel = this.add.rectangle(panelX, panelY, panelW, panelH, 0x111111)
        .setStrokeStyle(2, 0x555555).setDepth(1);

      // Title bar
      this.add.text(panelX - panelW / 2 + 16, panelY - panelH / 2 + 10, 'CRAFTING BENCH', {
        fontFamily: 'Courier New', fontSize: '18px', color: '#ffffff'
      }).setDepth(2);
      // separator line below title
      this.add.rectangle(panelX, panelY - panelH / 2 + 40, panelW - 4, 1, 0x444444).setDepth(2);

      // Recipe list container (left)
      this.recipeCards = [];
      const listX = panelX - panelW / 2 + 16;
      const listY = panelY - panelH / 2 + 60;
      this.recipes.forEach((r, i) => {
        this._makeRecipeCard(r, i, listX, listY + i * 64);
      });

      // Right detail panel
      this.detailContainer = this.add.container(0, 0).setDepth(2);
      this._renderDetail();

      // Bottom bar
      this.add.rectangle(panelX, panelY + panelH / 2 - 24, panelW - 4, 1, 0x333333).setDepth(2);
      this.add.text(panelX, panelY + panelH / 2 - 14, '[W/S] Navigate    [ENTER/F] Craft    [TAB/ESC] Close', {
        fontFamily: 'Courier New', fontSize: '11px', color: '#888888'
      }).setOrigin(0.5).setDepth(2);

      // Keyboard
      const kb = this.input.keyboard;
      kb.on('keydown-W',     () => this._move(-1));
      kb.on('keydown-UP',    () => this._move(-1));
      kb.on('keydown-S',     () => this._move(1));
      kb.on('keydown-DOWN',  () => this._move(1));
      kb.on('keydown-ENTER', () => this._tryCraft());
      kb.on('keydown-F',     () => this._tryCraft());
      kb.on('keydown-TAB',   (e) => { if (e.preventDefault) e.preventDefault(); this._close(); });
      kb.on('keydown-ESC',   () => this._close());

      // Listen for inventory updates from GameScene
      this.game.events.on('crafting_inventory_update', this._onInventoryUpdate, this);

      // Ensure event listener is removed on shutdown
      this.events.on('shutdown', () => {
        this.game.events.off('crafting_inventory_update', this._onInventoryUpdate, this);
      });
    }

    _onInventoryUpdate(inv) {
      this.inventory = inv || {};
      this._refreshRecipeCards();
      this._renderDetail();
    }

    _move(dir) {
      const n = this.recipes.length;
      if (!n) return;
      this.selectedIndex = (this.selectedIndex + dir + n) % n;
      this._refreshRecipeCards();
      this._renderDetail();
    }

    _makeRecipeCard(recipe, index, x, y) {
      const cardW = 280, cardH = 60;
      const bg = this.add.rectangle(x + cardW / 2, y + cardH / 2, cardW, cardH, 0x1a1a1a)
        .setStrokeStyle(2, 0x333333).setDepth(2);
      const icon = this.add.image(x + 24, y + cardH / 2, RECIPE_ICONS[recipe.id] || 'res_parts')
        .setDepth(3).setOrigin(0.5).setDisplaySize(32, 32);
      const name = this.add.text(x + 50, y + 12, recipe.name, {
        fontFamily: 'Courier New', fontSize: '14px', color: '#ffffff'
      }).setDepth(3);
      const status = this.add.text(x + 50, y + 34, '', {
        fontFamily: 'Courier New', fontSize: '11px', color: '#888888'
      }).setDepth(3);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => {
        this.selectedIndex = index;
        this._refreshRecipeCards();
        this._renderDetail();
      });
      bg.on('pointerover', () => bg.setStrokeStyle(2, 0xaaaaaa));
      bg.on('pointerout', () => this._refreshRecipeCards());
      this.recipeCards.push({ bg, icon, name, status, recipe, index });
      this._refreshCard(this.recipeCards[index]);
    }

    _refreshCard(card) {
      const canAfford = this._canAfford(card.recipe);
      const selected = this.selectedIndex === card.index;
      if (selected) {
        card.bg.setStrokeStyle(3, 0xf0a500);
      } else {
        card.bg.setStrokeStyle(2, 0x333333);
      }
      card.status.setText(canAfford ? 'CRAFT' : 'INSUFFICIENT RESOURCES');
      card.status.setColor(canAfford ? '#44ff66' : '#666666');
      card.name.setColor(canAfford ? '#ffffff' : '#aaaaaa');
    }

    _refreshRecipeCards() {
      this.recipeCards.forEach(c => this._refreshCard(c));
    }

    _canAfford(recipe) {
      if (!recipe || !recipe.cost) return true;
      for (const k in recipe.cost) {
        if ((this.inventory[k] || 0) < recipe.cost[k]) return false;
      }
      return true;
    }

    _maxCraftable(recipe) {
      if (!recipe || !recipe.cost) return 99;
      let max = 99;
      for (const k in recipe.cost) {
        const have = this.inventory[k] || 0;
        const per = recipe.cost[k];
        if (per > 0) max = Math.min(max, Math.floor(have / per));
      }
      return max;
    }

    _renderDetail() {
      if (this.detailContainer) this.detailContainer.removeAll(true);
      const W = this.scale.width, H = this.scale.height;
      const recipe = this.recipes[this.selectedIndex];
      if (!recipe) return;
      const rx = W / 2 + 20; // right column start
      const ry = H / 2 - 130;

      const icon = this.add.image(rx + 24, ry + 20, RECIPE_ICONS[recipe.id] || 'res_parts')
        .setOrigin(0.5).setDisplaySize(48, 48).setDepth(3);
      const name = this.add.text(rx + 60, ry + 6, recipe.name, {
        fontFamily: 'Courier New', fontSize: '20px', color: '#ffdd88'
      }).setDepth(3);
      const desc = this.add.text(rx, ry + 56, RECIPE_DESC[recipe.id] || '-', {
        fontFamily: 'Courier New', fontSize: '11px', color: '#aaaaaa',
        wordWrap: { width: 260 }
      }).setDepth(3);

      const reqLabel = this.add.text(rx, ry + 100, 'REQUIRES:', {
        fontFamily: 'Courier New', fontSize: '11px', color: '#888888'
      }).setDepth(3);
      this.detailContainer.add([icon, name, desc, reqLabel]);

      const ingKeys = Object.keys(recipe.cost || {});
      ingKeys.forEach((k, i) => {
        const have = this.inventory[k] || 0;
        const need = recipe.cost[k];
        const ok = have >= need;
        const tex = MACHINA.ResourceTex && MACHINA.ResourceTex[k];
        const row = ry + 120 + i * 22;
        if (tex && this.textures.exists(tex)) {
          const ing = this.add.image(rx + 8, row, tex).setOrigin(0.5).setDepth(3);
          this.detailContainer.add(ing);
        }
        const txt = this.add.text(rx + 24, row - 6, 'x' + need + '  ' + k.toUpperCase() + '   (' + have + ')', {
          fontFamily: 'Courier New', fontSize: '12px', color: ok ? '#44ff66' : '#ff6666'
        }).setDepth(3);
        this.detailContainer.add(txt);
      });

      const canAfford = this._canAfford(recipe);
      const maxC = this._maxCraftable(recipe);
      this.craftBtn = this.add.text(rx + 40, H / 2 + 140, 'CRAFT [x' + Math.max(0, maxC) + ']', {
        fontFamily: 'Courier New', fontSize: '16px', color: canAfford ? '#ffffff' : '#888888',
        backgroundColor: canAfford ? '#2a6a30' : '#333333',
        padding: { x: 10, y: 6 }
      }).setDepth(3).setInteractive({ useHandCursor: true });
      this.craftBtn.on('pointerdown', () => this._tryCraft());
      this.detailContainer.add(this.craftBtn);
    }

    _tryCraft() {
      const recipe = this.recipes[this.selectedIndex];
      if (!recipe) return;
      if (!this._canAfford(recipe)) {
        // Shake craft button 3 times
        if (this.craftBtn) {
          const baseX = this.craftBtn.x;
          this.tweens.add({
            targets: this.craftBtn, x: baseX - 4, duration: 80, yoyo: true, repeat: 2,
            onComplete: () => { this.craftBtn.x = baseX; }
          });
        }
        return;
      }
      // Dispatch craft event back to GameScene
      this.game.events.emit('crafting_craft', { recipe });
      // Flash the selected card
      const card = this.recipeCards[this.selectedIndex];
      if (card) {
        const flash = this.add.rectangle(card.bg.x, card.bg.y, card.bg.width, card.bg.height, 0xffffff, 0.7)
          .setDepth(10);
        this.tweens.add({ targets: flash, alpha: 0, duration: 220, onComplete: () => flash.destroy() });
      }
    }

    _close() {
      // Emit closed event; GameScene will resume.
      this.game.events.emit('crafting_closed');
      this.scene.stop();
    }
  }

  MACHINA.CraftingUIScene = CraftingUIScene;
})();
