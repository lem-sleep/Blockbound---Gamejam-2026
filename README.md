# Blockbound — Game Jam 2026

## MACHINA — Survive the Factory Night

A side-scrolling zombie-survival HTML5 game built in **Phaser 3** for Blockbound
Game Jam 2026. You are a factory worker — the grid has fallen, a rogue factory
AI turned the staff into the walking dead, and the only things standing
between you and the end of the shift are the **machines** you can salvage,
build and power from scrap.

Survive **seven waves**, kill the Mega Brute, and the factory is yours.

Play the game directly from `Machina/index.html`.

---

## Features

- Seven distinct waves: **Dawn → Dusk → Midnight → Factory Alarm → Power
  Surge → The Horde → Factory Override**, each with unique scripted events
  (alarm horde, power surge damaging all machines, final boss wave).
- Four zombie archetypes with their own AI/FSM and visual identity:
  **Walker**, **Runner** (orange indicator, forward lean), **Brute**
  (yellow hazmat stripes, health bar) and the **Mega Brute** boss.
- Five build-able, salvageable machines forming the core theme:
  **Barricade** (tall stacked planks, zombies attack them — they cannot jump
  over), **Auto Turret** (powered, auto-aim, reload-able), **Generator**
  (fuel-burning, emits light + power), **Crafting Bench** (opens the full
  GUI), **Alarm Trap**.
- A full power grid: generators supply power, turrets demand it; watch the
  HUD `POWER X/Y` indicator because turrets go offline when unpowered.
- A proper inventory-style **Crafting UI scene** (W/S navigate, ENTER / F
  to craft, TAB / ESC to close) with procedurally drawn recipe icons for
  Medkit, Ammo Pack, Fuel Can, Turret Reload, Molotov, Pipe Bomb.
- **Hardcore mode**: only the high score is persisted
  (`machina_highscore` in localStorage). No continues, no mid-game saves —
  every run is a fresh one.
- Screen-edge directional threat indicators, dynamic darkness overlay
  lit by generators/turrets, vignette that ramps as HP drops,
  heartbeat SFX, hit-stop, slow-mo on last kill, ghost preview with
  live `[RIGHT CLICK] Place — cost` tooltip, held-item sprite on the
  player's hand, and a per-wave-cleared interstitial with stats +
  random tip + 30 s countdown.
- **Zero external assets.** Every sprite is drawn at runtime via Phaser's
  Graphics API; every sound is synthesized via Web Audio
  oscillators and noise buffers. No art files, no audio files, no
  bundler, no `npm install`.

---

## How to run

Phaser is loaded from the jsDelivr CDN and every asset is generated at
runtime, so any static server works:

```powershell
# Python (built-in)
python -m http.server 8080

# Node (http-server)
npx http-server Machina -p 8080 -c-1

# Or just double-click Machina/index.html (works from file://)
```

Then open <http://localhost:8080/Machina/> in any modern browser
(Chrome, Firefox, Edge).

---

## Controls

| Key                     | Action                                |
| ----------------------- | ------------------------------------- |
| `A` / `D` / arrows      | Move left / right                     |
| `W` / `↑` / `Space`     | Jump                                  |
| `S` / `↓` (hold)        | Crouch                                |
| `Shift`                 | Sprint (uses stamina)                 |
| `Left Click`            | Shoot                                 |
| `Right Click`           | Build selected machine at cursor X    |
| `Q` / `E`               | Cycle the selected machine            |
| `F`                     | Pickup / Interact / Refuel / Reload turret / Arm alarm |
| `R`                     | Reload weapon                         |
| `Tab`                   | Open Crafting Bench (within 80 px)    |
| `Esc`                   | Pause / close any overlay             |

---

## Project structure

```
Machina/
├── index.html                # CDN loader + DOM shell
├── main.js                   # Phaser config + scene registry
├── package.json              # optional live-server script
├── CHANGES.md                # change-log for the fix/improvement pass
├── DONE.md                   # detailed design doc
├── assets/README.md          # note: no external assets
└── src/
    ├── utils/                # ProceduralTextures, AudioManager, InputHandler, ParticlePool
    ├── entities/             # Projectile, Player, Zombie
    ├── machines/             # MachineBase, Barricade, AutoTurret, Generator, CraftingBench, AlarmTrap
    ├── systems/              # SaveManager, ResourceSystem, PowerGrid, ZombieSpawner, WaveManager
    └── scenes/               # Boot, MainMenu, Game, HUD, CraftingUI, GameOver
```

---

## Credits

Built alongside Tim for Blockbound Game Jam 2026.

Phaser 3 — <https://phaser.io/> (loaded from jsDelivr CDN).
