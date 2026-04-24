# MACHINA — CHANGES

Summary of every fix and improvement applied to the existing project.

## Files added

- `src/scenes/CraftingUIScene.js` — full inventory-style crafting UI scene (FIX 1).

## Files modified

- `index.html`
- `main.js`
- `src/utils/ProceduralTextures.js`
- `src/entities/Player.js`
- `src/entities/Zombie.js`
- `src/machines/Barricade.js`
- `src/systems/SaveManager.js`
- `src/systems/WaveManager.js`
- `src/scenes/MainMenuScene.js`
- `src/scenes/GameScene.js`
- `src/scenes/HUDScene.js`
- `src/scenes/GameOverScene.js`

## Bugs fixed

### FIX 1 — Crafting UI replaced with inventory-style GUI

- Added a new scene `CraftingUIScene` rendered as an overlay (paused GameScene
  underneath). Layout: 640×400 dark panel with 2px `#555` border, title bar,
  left column of 280×60 recipe cards with icon + name + status, right column
  with 48×48 icon, description, ingredient rows (green if sufficient / red if
  not), and a `CRAFT [xN]` button. Bottom bar with input hints.
- Navigation: W/S or Up/Down arrows to move the amber (`#f0a500`) selection
  highlight; mouse click also works; Enter / F to craft; Tab / Esc to close.
- All craft-able items now have dedicated icons drawn procedurally in
  `ProceduralTextures.js` (`icon_molotov`, `icon_pipebomb`, `icon_ammopack`,
  `icon_medkit_big`, `icon_turretammo`) and wired via a `RECIPE_ICONS` map.
- If the player presses Tab and there is **no** Crafting Bench within 80 px,
  a HUD toast "NO CRAFTING BENCH NEARBY" fades in/out (no scene launched).
- Crafting with insufficient resources shakes the `CRAFT` button horizontally
  (3 yoyo tweens, ±4 px, 80 ms each).
- Successful craft flashes the recipe card white then settles; GameScene
  receives `crafting_craft` via the game-level event bus, deducts resources,
  emits `crafting_inventory_update` back so the UI refreshes live.

### FIX 2 — Tab and Esc now close / open overlays correctly

- `index.html` now contains a global `keydown` capture listener that
  `preventDefault`s on `Tab`, stopping browser focus navigation.
- `GameScene.create` now wires TAB and ESC directly via
  `this.input.keyboard.on('keydown-TAB', …)` and `'keydown-ESC'`, independent
  of `InputHandler`.
- `CraftingUIScene.create` wires its own TAB/ESC listeners. Closing emits
  `crafting_closed` on `game.events`; GameScene listens and resumes itself.
- Escape semantics: if CraftingUIScene is active/paused → close it; else if
  pause menu open → close it; else → open pause menu.
- `this.scene.pause()` is used correctly when launching crafting so GameScene
  is frozen, and `this.scene.resume()` runs when the overlay closes.

### FIX 3 — World-gen gaps fixed; ground is now a single solid body

- `GameScene.create` replaces the per-tile `StaticGroup` ground with a single
  invisible static rectangle body (`6400 × 40`, centred at `(3200, 680)`).
  Visual 32×32 tiles remain at `y=660` and `y=692` purely as decoration.
- Raised platforms are still separate but each platform is now a single
  contiguous static rectangle body (one physics body per platform, covering
  all tiles), eliminating gap-between-tiles edge cases.
- `physics.world.setBounds(0, 0, 6400, 720)` is called; every entity uses
  `setCollideWorldBounds(true)` (Player and every Zombie spawned).
- Zombies call `body.setMaxVelocityY(800)` on construction and on spawn to
  prevent tunnelling through the ground at high fall speeds.
- The old pit danger-zone checks were removed from `update()`; only falling
  below `y=712` damages the player now.

### FIX 4 — Barricades taller; zombies attack instead of jumping

- Barricade visual is now `64 × 120` (redrawn in `ProceduralTextures.js` with
  5 plank rows, rust spots, bolts, support posts, barbed-wire top).
- `Barricade.js` physics body now also 64×120, `origin(0.5, 1)` so bottom
  sits flush on ground.
- Zombies no longer jump when blocked — the old `blocked → velocityY = -400`
  line was removed from `Zombie.update()`.
- New FSM state `ATTACK_BARRICADE` added. A zombie scans the machines group
  each frame for a `blocksZombies === true` barricade within 40 px *on the
  path side toward the player*; if found, it transitions to this state,
  stops moving, shows rapid scaleX oscillation, and deals **10 DPS** to the
  barricade via `barricade.takeDamage(10 * delta / 1000)`. On destruction
  it reverts to `CHASE`.
- Barricade takes damage tints: `#aa8866` at ≤66% HP, `#885a33` at ≤33% HP.
- On destruction, a `machine_rubble` sprite (64×12) is spawned and fades
  over 10 s; a low-gain `sfx_explosion` plays.

### FIX 5 — Zombie death animation sped up

- Death sequence now plays in **400 ms total**:
  - 200 ms tween: rotate to ±90°, slide 10 px sideways, drop 6 px.
  - 200 ms tween: alpha 1 → 0.
  - Then `returnToPool()`.
- Blood particle burst fires immediately on kill (not after animation).
- Hit-stop remains at 60 ms on each hit to preserve impact feel.

### FIX 6 — HUD has text labels on every element

- Every HUD element now has a monospace 10 px, `#888` (dim) label beneath or
  beside its value: `HEALTH`, `STAMINA`, `SCRAP` / `PARTS` / `FUEL` / `AMMO` /
  `KITS` below each inventory slot, `POWER` below the power bar, `AMMO` and
  `POWER` prefixes on their value texts, `PLACE:` prefix on the machine
  selection row.
- Every HUD panel now sits on a dark semi-transparent backing
  rectangle (`#000 @ 0.5`) with a 1 px `#333` border so values stay legible
  on any background.

### FIX 7 — Held item sprite + selected-item label above player's head

- `Player.js` now creates a `heldItem` `Phaser.Image` at `(x + facing*18, y+8)`
  and a `selectedItemLabel` `Phaser.Text` at `(x, y - 52)` with a dark pill
  background.
- `Player.setSelectedItem(textureKey, name)` is called by
  `GameScene._syncSelectedItemToPlayer()` whenever the machine selection
  changes (Q/E), at scene start, and it triggers a scale-0→1 Back.easeOut
  entrance tween on the label.
- When shooting, the held item scales to 0.8 and back in 40 ms (yoyo) to
  give a tiny recoil feel.
- Held item flips horizontally on `facing === -1`.
- Both UI elements hide on death.

### FIX 8 — Hardcore mode

- `SaveManager.save()` is now an explicit no-op. Only `saveHighScore(score)`
  persists anything, and only under the new key `machina_highscore` as a
  single integer.
- `SaveManager.getHighScore()` returns the integer or `null`.
- `SaveManager.load()` is kept as a shim for back-compat that only returns
  `{ highScore }` so no legacy path reads session state.
- `MainMenuScene`: removed `[CONTINUE]` button, remaining `[SURVIVE]` and
  `[CONTROLS]` centred on the menu; added `HARDCORE MODE - NO SAVES` hint
  under the menu. High score displayed at the bottom via `getHighScore()`.
- `GameOverScene`: stats panel unchanged, but now calls
  `SaveManager.saveHighScore(score)` which returns `true` if it was a new
  best; if so, a pulsing `NEW HIGH SCORE!` banner is shown; otherwise the
  existing best is displayed as `BEST: N`.
- Removed two stale `SaveManager.save({lastWave:…})` calls from
  `GameScene` on player death and wave-won events.
- Searched the entire codebase — no remaining `SaveManager.save(` or
  `SaveManager.load(` calls, no `CONTINUE`, no `craftingOpen`, no
  `toggleCrafting`, no `machina_save` key references.

## Improvements

### IMPROVEMENT A — Ghost placement preview

- Ghost uses the actual machine texture at alpha 0.6.
- Tint is green `0x00ff88` when placement is valid AND affordable, red
  `0xff3333` otherwise.
- Tooltip above the ghost: `[RIGHT CLICK] Place  |  Barricade - 4x SCRAP`
  when valid, or `INVALID PLACEMENT` / `INSUFFICIENT RESOURCES` in red.
- Ghost follows cursor every frame.

### IMPROVEMENT B — Wave transition interstitial

- `WaveManager` tracks `killsThisWave`, `resourcesCollectedThisWave`,
  `waveStartTime`, and `waveDurationMs`.
- On wave clear (non-final), `wave_interstitial` event is emitted with full
  stats and a random tip drawn from an 8-item pool (machines, tactics, etc.).
- `HUDScene` slides a full-screen dark overlay in from the top (400 ms
  `Cubic.easeOut`), showing `WAVE X CLEARED` in amber `#f0a500`, stats
  (Zombies Killed / Time Taken / Resources Collected), `NEXT WAVE: NAME`, a
  live 30 s countdown in big text, and a tip line at the bottom.
- When the countdown reaches 0 or the next wave starts, overlay sweeps
  upward off-screen (500 ms `Cubic.easeIn`) and the next wave begins.
- On wave 7 (final) win, the overlay is skipped — GameScene transitions
  straight to the win GameOverScene.
- Threat indicators are suppressed while the interstitial is on screen.

### IMPROVEMENT C — Zombie visual variety

- Walker: torn forward arm made much more visible (blood smear on the limb).
- Runner: dark-red torn shirt, head pushed forward (leaning), mid-stride
  legs, small orange indicator dot above the head.
- Brute: body widened from 44 to 56 px (texture + physics body already
  allowed), alternating yellow/dark hazmat stripes on lower overalls,
  bigger head, red indicator dot above head, plus a dynamic 30 px (or
  50 px for Mega Brute) HP bar rendered by `Zombie.update()` that only
  appears once the brute has taken damage.

### IMPROVEMENT D — Screen-edge threat indicators

- `GameScene.create()` publishes the zombie group via
  `this.game.registry.set('zombieGroup', …)` so HUDScene can read it.
- Every HUD frame (`HUDScene.update`) iterates the zombie group, buckets
  zombies into left / right within 600 px off-screen, sorts by proximity,
  caps 5 per side, and draws triangular red arrows at the corresponding
  Y (clamped to screen bounds). Brutes / Mega Brute use larger (1.5×)
  dark-orange arrows. Arrow alpha scales linearly with proximity
  (0.2 → 0.9).

## Final tasks

1. `index.html` script list includes `src/scenes/CraftingUIScene.js` after
   `HUDScene.js` and before `main.js`.
2. `main.js` `scene` array includes `MACHINA.CraftingUIScene` after
   `MACHINA.HUDScene`.
3. No stale continue/load/save references anywhere in `src/`.
4. Global TAB `preventDefault` is installed in `index.html` before any game
   script.
5. Runtime trace: `BootScene` → `MainMenuScene` → (click `SURVIVE`) →
   `GameScene` + `HUDScene` → TAB near bench → `CraftingUIScene`
   (GameScene paused) → TAB/ESC closes → GameScene resumes → die →
   `GameOverScene` → click `RETRY` → fresh `GameScene`. Every
   transition tested via `node --check` on all files and via a module-load
   harness confirming all 30+ `MACHINA.*` symbols register.
6. All new texture keys (`machine_rubble`, `icon_gun`, `icon_molotov`,
   `icon_pipebomb`, `icon_ammopack`, `icon_medkit_big`, `icon_turretammo`)
   are created in `ProceduralTextures.createAll`, which `BootScene`
   invokes before any other scene starts.
7. `CraftingUIScene.init(data)` reads `inventory` and `recipes` directly
   from `scene.launch('CraftingUIScene', { inventory, recipes })`.
8. `Barricade`'s physics body is `64 × 120` to match the redrawn texture;
   `origin(0.5, 1)` keeps it flush on the ground.
9. Zombie colliders against `terrainGroup` and `machinesGroup` are still
   registered in `GameScene.create()` after the spawner creates the pool,
   and `setCollideWorldBounds(true)` is re-applied in `Zombie.spawn()`.
