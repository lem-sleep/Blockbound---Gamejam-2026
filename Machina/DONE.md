# MACHINA — DONE

A side-scrolling zombie survival game built with Phaser 3. You are the last
factory worker. Scavenge scrap, build machines, survive 7 waves, and kill the
Mega Brute to silence the rogue factory AI.

## How to run

MACHINA has **zero npm dependencies** for the runtime — Phaser is loaded from
CDN and every asset is synthesized at runtime.

### Option A — simple HTTP server (recommended)

Any static server works, because the game only needs to load `.js` and `.html`
files. Examples:

```powershell
# Python (built-in)
python -m http.server 8080

# Node — http-server
npx http-server -p 8080 -c-1

# Node — live-server (auto-reload)
npx live-server --port=8080
```

Then open http://localhost:8080 in any modern browser (Chrome, Firefox, Edge).

### Option B — open directly

Because all scripts are plain (non-module) script tags and assets are procedural,
you can also just double-click `index.html` and it runs from `file://`.

## Controls

- **A / D** or **Left / Right** — Move
- **W / Up / SPACE** — Jump
- **S / Down (hold)** — Crouch
- **SHIFT** — Sprint
- **Left Click** — Shoot
- **Right Click** — Build selected machine at cursor X (on ground)
- **Q / E** — Cycle machine selection
- **F** — Interact / Pickup / Refuel / Reload turret / Arm alarm / Use medkit
- **R** — Reload weapon
- **TAB** — Open crafting menu (only while game is running)
- **ESC** — Pause

## Files created

```
Machina/
├── index.html               # CDN script loader + DOM shell
├── main.js                  # Phaser game config + scene registration
├── package.json             # optional live-server / http-server scripts
├── DONE.md                  # this file
├── assets/README.md         # note — no external assets
└── src/
    ├── utils/
    │   ├── ProceduralTextures.js   # draws every sprite via Graphics API
    │   ├── AudioManager.js         # procedural Web Audio synth (all SFX + music)
    │   ├── InputHandler.js         # keyboard + pointer wrapper
    │   └── ParticlePool.js         # blood / sparks / smoke / explosion / muzzle
    ├── entities/
    │   ├── Projectile.js
    │   ├── Player.js               # FSM, stamina, shoot, reload
    │   └── Zombie.js               # walker, runner, brute, mega — WANDER/CHASE/ATTACK
    ├── machines/
    │   ├── MachineBase.js
    │   ├── Barricade.js
    │   ├── AutoTurret.js
    │   ├── Generator.js
    │   ├── CraftingBench.js
    │   └── AlarmTrap.js
    ├── systems/
    │   ├── SaveManager.js          # localStorage
    │   ├── ResourceSystem.js       # inventory + pickups
    │   ├── PowerGrid.js            # supply vs demand
    │   ├── ZombieSpawner.js        # pool + wave queue
    │   └── WaveManager.js          # 7 waves + scripted events
    └── scenes/
        ├── BootScene.js            # texture + anim + audio setup
        ├── MainMenuScene.js        # title, controls, background silhouettes
        ├── GameScene.js            # gameplay, lighting, ghost preview
        ├── HUDScene.js             # parallel overlay
        └── GameOverScene.js        # DEAD or SURVIVED
```

## Waves

1. DAWN            — 8 walkers.
2. DUSK            — walkers + runners.
3. MIDNIGHT        — first Brute appears, darkness deepens.
4. FACTORY ALARM   — scripted alarm event, doubled spawn pressure.
5. POWER SURGE     — all machines take 30% damage at wave start, screen flash.
6. THE HORDE       — rapid spawn, 3 Brutes.
7. FACTORY OVERRIDE — Mega Brute boss + 20 runners. Kill him to WIN.

## Machines (the theme)

| Machine         | Cost             | Power | Max | Role                                             |
|-----------------|------------------|-------|-----|--------------------------------------------------|
| Barricade       | scrap x4         | no    | 6   | Static wall; zombies attack it.                  |
| Auto Turret     | scrap x6 parts x3| 1     | 3   | Auto-targets zombies within 350px. Needs ammo.   |
| Generator       | scrap x5 parts x2| +2    | 2   | Provides power. Burns 1 fuel / 30s. Light radius.|
| Crafting Bench  | scrap x3 parts x1| no    | 1   | Opens crafting menu. Light safe zone.            |
| Alarm Trap      | scrap x2         | no    | 4   | Detects zombies within 80px; sounds alarm.       |

## Key decisions / deviations from the original spec

- **No ES modules.** The spec lists `type="module"`, but modules require a real
  HTTP server due to CORS restrictions on `file://`. I used plain `<script>`
  tags with a `window.MACHINA` namespace so the game also runs from a
  double-clicked `index.html`.
- **Lighting** uses a RenderTexture with `erase()` calls against a pre-baked
  soft circle texture instead of ERASE blend modes; visually equivalent.
- **Zombie walk animation** uses a small y-scale oscillation rather than a
  frame-based spritesheet (since all sprites are drawn procedurally).
- **Molotov / Pipe Bomb recipes** were collapsed into simpler crafting outputs
  (ammo pack, medkit, fuel can, turret reload pack) to keep the throwable-weapon
  system out of scope. The theme is fully expressed through the machines.
- **Hit-stop** uses a native `setTimeout` so it isn't itself slowed by
  `time.timeScale = 0`.
- **AI staggering** runs zombies in two alternating buckets; with the 40-cap on
  screen that's enough to keep frame time low.
- **Power grid** allocates greedily in iteration order; "flickering" is handled
  implicitly when supply drops.

## Known limitations

- No gamepad / touch controls (keyboard + mouse only).
- Mega Brute uses the same texture as Brute but is scaled up and recoloured.
- No proper ragdoll — dead zombies tween-slide and fade.
- Explosion frames exist as textures but particle burst is preferred at runtime.
- Save slot stores only summary stats (no mid-game save/load).

## Verifying it runs

1. Start a server in this folder (`python -m http.server 8080`).
2. Open http://localhost:8080.
3. You should see "LOADING MACHINA..." then the MainMenu.
4. Click `> SURVIVE`. GameScene starts, player spawns on the left of a long
   industrial map, hearts appear in the top-left, zombies begin spawning on
   wave 1. Holding left-click fires, moving with A/D, right-click places a
   barricade on the ground. Survive to wave 7 and kill the Mega Brute to win.
