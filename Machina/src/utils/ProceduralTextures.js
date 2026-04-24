// ProceduralTextures.js - draws every sprite used in MACHINA via Phaser Graphics
(function () {
  const PT = {};

  function gfx(scene) { return scene.make.graphics({ x: 0, y: 0, add: false }); }

  function makeTexture(scene, key, w, h, drawFn) {
    if (scene.textures.exists(key)) return;
    const g = gfx(scene);
    drawFn(g, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  // -------- Ground / terrain --------
  function drawGroundTile(g, w, h) {
    g.fillStyle(0x1a1a1a, 1).fillRect(0, 0, w, h);
    g.fillStyle(0x222222, 1);
    for (let i = 0; i < 4; i++) {
      const y = 4 + i * 7;
      g.fillRect(2, y, w - 4, 1);
    }
    g.fillStyle(0x3d2200, 1);
    for (let i = 0; i < 3; i++) {
      const x = (i * 11 + 3) % w;
      const y = (i * 13 + 5) % h;
      g.fillRect(x, y, 2, 2);
    }
    g.lineStyle(1, 0x0a0a0a, 1).strokeRect(0, 0, w, h);
  }

  function drawGroundMid(g, w, h) {
    g.fillStyle(0x242424, 1).fillRect(0, 0, w, h);
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(0, 0, w, 2);
    g.fillStyle(0x111111, 1);
    // cracks
    for (let i = 0; i < 2; i++) {
      const x = 6 + i * 14;
      g.fillRect(x, 10, 1, 10);
    }
    g.fillStyle(0x3d2200, 1).fillRect(5, 6, 3, 1);
    g.lineStyle(1, 0x0a0a0a, 1).strokeRect(0, 0, w, h);
  }

  function drawBgFactory(g, w, h) {
    // Gradient-ish sky
    g.fillStyle(0x050508, 1).fillRect(0, 0, w, Math.floor(h * 0.4));
    g.fillStyle(0x0a0f18, 1).fillRect(0, Math.floor(h * 0.4), w, Math.floor(h * 0.3));
    g.fillStyle(0x0f1520, 1).fillRect(0, Math.floor(h * 0.7), w, Math.floor(h * 0.3));

    // Distant factory silhouette
    g.fillStyle(0x080808, 1);
    const base = h - 40;
    // Buildings
    const buildings = [
      { x: 30, w: 140, h: 180 },
      { x: 180, w: 90, h: 140 },
      { x: 290, w: 200, h: 220 },
      { x: 520, w: 120, h: 160 },
      { x: 660, w: 170, h: 200 },
      { x: 850, w: 90, h: 120 },
      { x: 960, w: 180, h: 240 },
      { x: 1160, w: 100, h: 140 }
    ];
    buildings.forEach(b => {
      g.fillRect(b.x, base - b.h, b.w, b.h);
    });
    // Chimneys
    g.fillStyle(0x060606, 1);
    g.fillRect(80, base - 260, 20, 80);
    g.fillRect(380, base - 300, 22, 80);
    g.fillRect(710, base - 280, 18, 80);
    g.fillRect(1000, base - 320, 22, 80);
    // Broken chimney
    g.fillRect(380, base - 300, 22, 10);
    // Dim yellow windows
    g.fillStyle(0xaa8833, 0.9);
    const windows = [
      [70, base - 130], [110, base - 110], [220, base - 100],
      [350, base - 170], [430, base - 140], [560, base - 110],
      [700, base - 150], [780, base - 120], [1000, base - 190],
      [1060, base - 150], [1180, base - 110]
    ];
    windows.forEach(pt => g.fillRect(pt[0], pt[1], 3, 3));
    // Occasional dim red
    g.fillStyle(0x883322, 0.8);
    g.fillRect(140, base - 150, 3, 3);
    g.fillRect(900, base - 90, 3, 3);
  }

  function drawSkyGradient(g, w, h) {
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const r = Math.floor(5 + (15 - 5) * t);
      const gr = Math.floor(5 + (21 - 5) * t);
      const b = Math.floor(8 + (32 - 8) * t);
      const col = (r << 16) | (gr << 8) | b;
      g.fillStyle(col, 1).fillRect(0, Math.floor(i * h / steps), w, Math.ceil(h / steps) + 1);
    }
  }

  // -------- Player --------
  function drawPlayerBase(g, legOffset) {
    // body
    g.fillStyle(0x2a2a2e, 1).fillRect(8, 14, 16, 22);
    // tool belt
    g.fillStyle(0x4a3020, 1).fillRect(6, 28, 20, 3);
    g.fillStyle(0x222222, 1).fillRect(12, 29, 2, 2);
    // head
    g.fillStyle(0x9c8470, 1).fillRect(11, 4, 10, 10);
    // hard hat
    g.fillStyle(0xd4a017, 1).fillRect(9, 0, 14, 6);
    g.fillStyle(0x8a6a10, 1).fillRect(9, 0, 14, 1);
    // eyes
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(13, 8, 2, 2);
    g.fillRect(17, 8, 2, 2);
    // arm
    g.fillStyle(0x2a2a2e, 1).fillRect(4, 16, 6, 14);
    g.fillStyle(0x9c8470, 1).fillRect(4, 30, 6, 4);
    // legs
    g.fillStyle(0x1c1c1c, 1);
    g.fillRect(9, 36, 5, 12 + legOffset);
    g.fillRect(18, 36 - legOffset, 5, 12 + legOffset);
    // boots
    g.fillStyle(0x0a0a0a, 1);
    g.fillRect(8, 46, 7, 2);
    g.fillRect(17, 46 - legOffset, 7, 2);
  }

  function drawPlayerCrouch(g) {
    g.fillStyle(0x2a2a2e, 1).fillRect(6, 18, 20, 18);
    g.fillStyle(0x9c8470, 1).fillRect(11, 10, 10, 10);
    g.fillStyle(0xd4a017, 1).fillRect(9, 6, 14, 6);
    g.fillStyle(0x1a1a1a, 1).fillRect(13, 14, 2, 2).fillRect(17, 14, 2, 2);
    g.fillStyle(0x4a3020, 1).fillRect(4, 30, 24, 3);
    g.fillStyle(0x1c1c1c, 1).fillRect(8, 36, 6, 10).fillRect(18, 36, 6, 10);
    g.fillStyle(0x0a0a0a, 1).fillRect(7, 44, 8, 4).fillRect(17, 44, 8, 4);
  }

  function drawPlayerDead(g) {
    // lying sideways
    g.fillStyle(0x2a2a2e, 1).fillRect(2, 34, 24, 12);
    g.fillStyle(0x9c8470, 1).fillRect(22, 30, 8, 10);
    g.fillStyle(0xd4a017, 1).fillRect(22, 26, 10, 6);
    g.fillStyle(0x6a0000, 0.8).fillRect(2, 44, 26, 4);
  }

  // -------- Zombies --------
  function drawZombieWalker(g) {
    g.fillStyle(0x3a4a2a, 1).fillRect(6, 14, 16, 20); // torn shirt
    g.fillStyle(0x2a3520, 1).fillRect(6, 18, 16, 2).fillRect(8, 24, 5, 4); // tear
    g.fillStyle(0x5a4020, 1).fillRect(6, 30, 16, 3); // belt
    g.fillStyle(0xc8b89a, 1).fillRect(10, 2, 8, 12); // head
    g.fillStyle(0x1a1a1a, 1).fillRect(11, 6, 2, 3).fillRect(15, 6, 2, 3);
    g.fillStyle(0x6a0000, 1).fillRect(10, 12, 8, 2); // mouth blood
    // torn outstretched forward arm (much more visible)
    g.fillStyle(0x3a4a2a, 1).fillRect(20, 15, 5, 3);
    g.fillStyle(0xc8b89a, 1).fillRect(21, 18, 8, 4);
    g.fillStyle(0x6a0000, 1).fillRect(26, 19, 3, 2); // blood on arm
    // rear arm
    g.fillStyle(0x3a4a2a, 1).fillRect(2, 14, 6, 14);
    g.fillStyle(0xc8b89a, 1).fillRect(2, 26, 6, 4);
    // legs
    g.fillStyle(0x1c1810, 1).fillRect(8, 34, 5, 10).fillRect(15, 34, 5, 10);
    g.fillStyle(0x0a0a0a, 1).fillRect(7, 42, 7, 2).fillRect(14, 42, 7, 2);
  }

  function drawZombieRunner(g) {
    // leaning forward shape (angled body via offset)
    g.fillStyle(0x6a1a1a, 1).fillRect(5, 15, 18, 16); // dark red shirt
    g.fillStyle(0x4a0a0a, 1).fillRect(5, 20, 18, 2).fillRect(10, 26, 6, 3); // tears
    // head pushed forward
    g.fillStyle(0xa89478, 1).fillRect(15, 3, 9, 11);
    g.fillStyle(0x1a1a1a, 1).fillRect(17, 7, 2, 3).fillRect(21, 7, 2, 3);
    g.fillStyle(0x6a0000, 1).fillRect(16, 12, 7, 2);
    // forward arms (aggressive reach)
    g.fillStyle(0x6a1a1a, 1).fillRect(21, 17, 5, 3);
    g.fillStyle(0xa89478, 1).fillRect(22, 20, 4, 3);
    g.fillStyle(0x6a1a1a, 1).fillRect(0, 16, 6, 3);
    g.fillStyle(0xa89478, 1).fillRect(0, 19, 5, 3);
    // legs (mid-stride)
    g.fillStyle(0x1c1810, 1).fillRect(7, 31, 4, 11).fillRect(15, 32, 4, 10);
    g.fillStyle(0x0a0a0a, 1).fillRect(6, 40, 6, 2).fillRect(14, 40, 6, 2);
    // orange indicator dot above head
    g.fillStyle(0xff7a00, 1).fillCircle(19, 1, 2);
  }

  function drawZombieBrute(g) {
    // much wider body
    g.fillStyle(0x2a2a30, 1).fillRect(4, 12, 48, 30);
    // yellow hazmat stripes on lower body
    g.fillStyle(0xd4a017, 1).fillRect(4, 34, 48, 3);
    g.fillStyle(0x1a1a20, 1).fillRect(4, 37, 48, 2);
    g.fillStyle(0xd4a017, 1).fillRect(4, 39, 48, 3);
    // overall straps
    g.fillStyle(0x5a5a20, 1).fillRect(4, 14, 48, 2);
    g.fillStyle(0x5a5a20, 1).fillRect(12, 12, 4, 20).fillRect(40, 12, 4, 20);
    // bigger head
    g.fillStyle(0x7a7060, 1).fillRect(20, 0, 16, 14);
    g.fillStyle(0x1a1a1a, 1).fillRect(22, 5, 3, 4).fillRect(31, 5, 3, 4);
    g.fillStyle(0x6a0000, 1).fillRect(22, 11, 12, 3);
    // arms
    g.fillStyle(0x2a2a30, 1).fillRect(0, 14, 6, 24).fillRect(46, 14, 6, 24);
    g.fillStyle(0x7a7060, 1).fillRect(0, 36, 6, 6).fillRect(46, 36, 6, 6);
    // legs
    g.fillStyle(0x151520, 1).fillRect(10, 42, 10, 14).fillRect(30, 42, 10, 14);
    g.fillStyle(0x050505, 1).fillRect(8, 54, 14, 2).fillRect(28, 54, 14, 2);
    // red indicator dot above head
    g.fillStyle(0xff0000, 1).fillCircle(28, 2, 3);
    g.fillStyle(0xff8888, 1).fillCircle(27, 1, 1);
  }

  // -------- Machines --------
  function drawBarricade(g, w, h) {
    // taller barricade: 5 plank rows
    g.fillStyle(0x3a2a1c, 1).fillRect(0, 0, w, h);
    const plankCount = 5;
    const plankH = Math.floor((h - 4) / plankCount);
    for (let i = 0; i < plankCount; i++) {
      const py = 2 + i * plankH;
      g.fillStyle(i % 2 === 0 ? 0x4a3424 : 0x5a4030, 1);
      g.fillRect(0, py, w, plankH - 2);
      // dark gap below plank
      g.fillStyle(0x1a0a04, 1).fillRect(0, py + plankH - 2, w, 2);
      // bolts on plank corners
      g.fillStyle(0x888888, 1);
      g.fillRect(4, py + 5, 3, 3);
      g.fillRect(w - 7, py + 5, 3, 3);
      // rust
      g.fillStyle(0x6a3a10, 1).fillRect(w / 2 - 2 + (i * 3) % 10, py + 8, 3, 2);
    }
    // support posts
    g.fillStyle(0x2a1c10, 1).fillRect(0, 0, 3, h).fillRect(w - 3, 0, 3, h);
    // barbed wire top
    g.fillStyle(0x888888, 1);
    for (let x = 2; x < w - 2; x += 4) {
      g.fillRect(x, 0, 1, 2);
    }
    g.lineStyle(1, 0x000000, 1).strokeRect(0, 0, w, h);
  }

  // -------- Held-item / recipe icons --------
  function drawIconGun(g, w, h) {
    g.fillStyle(0x252528, 1).fillRect(0, h / 2 - 3, w - 4, 6);
    g.fillStyle(0x404045, 1).fillRect(0, h / 2 - 3, w - 4, 2);
    g.fillStyle(0x555555, 1).fillRect(w - 4, h / 2 - 2, 4, 4);
    g.fillStyle(0x151515, 1).fillRect(w - 2, h / 2 - 1, 2, 2);
    // grip
    g.fillStyle(0x2a1c10, 1).fillRect(2, h / 2 + 3, 5, 4);
  }

  function drawIconMolotov(g, w, h) {
    // bottle body
    g.fillStyle(0x4a3424, 1).fillRect(w / 2 - 5, h / 2 - 2, 10, 14);
    g.fillStyle(0x6a4a30, 1).fillRect(w / 2 - 5, h / 2 - 2, 10, 2);
    // neck
    g.fillStyle(0x4a3424, 1).fillRect(w / 2 - 2, h / 2 - 8, 4, 6);
    // rag / flame
    g.fillStyle(0xffaa00, 1).fillTriangle(w / 2, h / 2 - 14, w / 2 - 4, h / 2 - 8, w / 2 + 4, h / 2 - 8);
    g.fillStyle(0xffff44, 1).fillTriangle(w / 2, h / 2 - 12, w / 2 - 2, h / 2 - 8, w / 2 + 2, h / 2 - 8);
    g.lineStyle(1, 0x000000, 1).strokeRect(w / 2 - 5, h / 2 - 2, 10, 14);
  }

  function drawIconPipeBomb(g, w, h) {
    // cylinder pipe
    g.fillStyle(0x606060, 1).fillRect(w / 2 - 6, h / 2 - 4, 12, 8);
    g.fillStyle(0x808080, 1).fillRect(w / 2 - 6, h / 2 - 4, 12, 2);
    g.fillStyle(0x303030, 1).fillRect(w / 2 - 6, h / 2 + 2, 12, 2);
    // caps
    g.fillStyle(0x404040, 1).fillRect(w / 2 - 7, h / 2 - 5, 2, 10);
    g.fillRect(w / 2 + 5, h / 2 - 5, 2, 10);
    // fuse
    g.fillStyle(0xffdd44, 1);
    g.fillRect(w / 2, h / 2 - 10, 1, 6);
    g.fillRect(w / 2 + 1, h / 2 - 14, 1, 4);
    g.fillStyle(0xff4400, 1).fillCircle(w / 2 + 1, h / 2 - 14, 1);
    g.lineStyle(1, 0x000000, 1).strokeRect(w / 2 - 6, h / 2 - 4, 12, 8);
  }

  function drawIconAmmoPack(g, w, h) {
    // box
    g.fillStyle(0x4a3a20, 1).fillRect(w / 2 - 9, h / 2 - 5, 18, 12);
    g.fillStyle(0x2a1c10, 1).fillRect(w / 2 - 9, h / 2 - 5, 18, 2);
    // bullets peeking out
    g.fillStyle(0xd4a017, 1);
    g.fillRect(w / 2 - 7, h / 2 - 7, 3, 4);
    g.fillRect(w / 2 - 2, h / 2 - 7, 3, 4);
    g.fillRect(w / 2 + 4, h / 2 - 7, 3, 4);
    g.fillStyle(0xaa8833, 1);
    g.fillRect(w / 2 - 7, h / 2 - 7, 1, 4);
    g.fillRect(w / 2 - 2, h / 2 - 7, 1, 4);
    g.fillRect(w / 2 + 4, h / 2 - 7, 1, 4);
    g.lineStyle(1, 0x000000, 1).strokeRect(w / 2 - 9, h / 2 - 5, 18, 12);
  }

  function drawIconMedkitBig(g, w, h) {
    g.fillStyle(0xaa1a1a, 1).fillRect(w / 2 - 10, h / 2 - 8, 20, 16);
    g.fillStyle(0x6a0000, 1).fillRect(w / 2 - 10, h / 2 - 8, 20, 2);
    g.fillStyle(0xffffff, 1).fillRect(w / 2 - 2, h / 2 - 5, 4, 10).fillRect(w / 2 - 7, h / 2 - 1, 14, 4);
    g.lineStyle(1, 0x000000, 1).strokeRect(w / 2 - 10, h / 2 - 8, 20, 16);
  }

  function drawIconTurretAmmo(g, w, h) {
    // gear
    g.fillStyle(0x808088, 1).fillCircle(w / 2 - 4, h / 2, 6);
    g.fillStyle(0x1a1a1a, 1).fillCircle(w / 2 - 4, h / 2, 2);
    // gear teeth
    g.fillStyle(0x808088, 1);
    g.fillRect(w / 2 - 5, h / 2 - 8, 2, 2);
    g.fillRect(w / 2 - 5, h / 2 + 6, 2, 2);
    g.fillRect(w / 2 - 12, h / 2 - 1, 2, 2);
    // bullet
    g.fillStyle(0xd4a017, 1).fillRect(w / 2 + 2, h / 2 - 3, 8, 6);
    g.fillStyle(0xaa8833, 1).fillRect(w / 2 + 2, h / 2 - 3, 1, 6);
    g.fillStyle(0x665522, 1).fillRect(w / 2 + 8, h / 2 - 3, 2, 6);
  }

  function drawRubble(g, w, h) {
    g.fillStyle(0x2a1c10, 1).fillRect(0, 2, w, h - 2);
    g.fillStyle(0x1a0a04, 1).fillRect(0, h - 2, w, 2);
    g.fillStyle(0x4a3424, 1);
    for (let i = 0; i < 6; i++) {
      g.fillRect(2 + i * 10, 3 + (i % 2) * 2, 6, 3);
    }
    g.fillStyle(0x888888, 1);
    g.fillRect(10, 4, 2, 2);
    g.fillRect(40, 5, 2, 2);
  }

  function drawTurretBase(g, w, h) {
    g.fillStyle(0x303035, 1).fillRect(0, 8, w, h - 8);
    g.fillStyle(0x505055, 1).fillRect(0, 8, w, 3);
    // vents
    g.fillStyle(0x1a1a1a, 1);
    for (let i = 0; i < 4; i++) {
      g.fillRect(6 + i * 10, 18, 6, 1);
      g.fillRect(6 + i * 10, 22, 6, 1);
    }
    // mount
    g.fillStyle(0x606065, 1).fillRect(w / 2 - 6, 2, 12, 8);
    g.lineStyle(1, 0x000000, 1).strokeRect(0, 8, w, h - 8);
  }

  function drawTurretGun(g, w, h) {
    g.fillStyle(0x252528, 1).fillRect(0, 4, w - 6, 8);
    g.fillStyle(0x404045, 1).fillRect(0, 4, w - 6, 2);
    g.fillStyle(0x555555, 1).fillRect(w - 6, 6, 6, 4);
    g.fillStyle(0x151515, 1).fillRect(w - 2, 7, 2, 2);
  }

  function drawGenerator(g, w, h) {
    g.fillStyle(0x2a2a30, 1).fillRect(0, 4, w, h - 4);
    // warning stripes
    g.fillStyle(0xd4a017, 1);
    for (let i = 0; i < 6; i++) {
      g.fillTriangle(i * 10, 4, i * 10 + 6, 4, i * 10 + 3, 10);
    }
    // control panel
    g.fillStyle(0x151518, 1).fillRect(8, 18, 20, 14);
    g.fillStyle(0x00ff44, 1).fillRect(10, 20, 3, 3);
    g.fillStyle(0xff3300, 1).fillRect(14, 20, 3, 3);
    g.fillStyle(0xaaaaaa, 1).fillRect(10, 26, 16, 4);
    // exhaust pipe
    g.fillStyle(0x404040, 1).fillRect(w - 16, 0, 8, 10);
    g.fillStyle(0x101010, 1).fillRect(w - 15, 0, 6, 3);
    g.lineStyle(1, 0x000000, 1).strokeRect(0, 4, w, h - 4);
  }

  function drawCrafting(g, w, h) {
    // workbench
    g.fillStyle(0x4a3424, 1).fillRect(0, 16, w, 8);
    g.fillStyle(0x2a1c10, 1).fillRect(0, 24, w, 4);
    // legs
    g.fillStyle(0x2a1c10, 1).fillRect(4, 28, 5, h - 28).fillRect(w - 9, 28, 5, h - 28);
    // back panel
    g.fillStyle(0x1a1a1a, 1).fillRect(0, 0, w, 16);
    // tools
    g.fillStyle(0x888888, 1).fillRect(8, 2, 2, 12).fillRect(14, 2, 4, 10);
    g.fillStyle(0xaaaaaa, 1).fillRect(26, 4, 10, 3).fillRect(42, 2, 3, 12);
    // gear
    g.fillStyle(0x606060, 1).fillRect(w - 14, 8, 10, 10);
    g.fillStyle(0x1a1a1a, 1).fillRect(w - 11, 11, 4, 4);
    g.lineStyle(1, 0x000000, 1).strokeRect(0, 0, w, h);
  }

  function drawAlarm(g, w, h) {
    // pole
    g.fillStyle(0x404040, 1).fillRect(w / 2 - 2, 8, 4, h - 8);
    // base
    g.fillStyle(0x303030, 1).fillRect(2, h - 4, w - 4, 4);
    // top light
    g.fillStyle(0x1a1a1a, 1).fillRect(2, 0, w - 4, 10);
    g.fillStyle(0xff3333, 1).fillCircle(w / 2, 5, 4);
    g.fillStyle(0xffaaaa, 1).fillCircle(w / 2 - 1, 4, 1);
  }

  // -------- Resources --------
  function drawResScrap(g, w, h) {
    g.fillStyle(0x666670, 1);
    g.fillTriangle(2, 12, 6, 4, 10, 10);
    g.fillTriangle(8, 14, 12, 6, 14, 12);
    g.fillStyle(0x888890, 1);
    g.fillRect(3, 10, 2, 2);
    g.fillStyle(0x3a2a1c, 1).fillRect(1, 12, 4, 2);
  }

  function drawResFuel(g, w, h) {
    g.fillStyle(0xd4a017, 1).fillRect(3, 3, 10, 11);
    g.fillStyle(0x8a6a10, 1).fillRect(3, 3, 10, 2);
    g.fillStyle(0x404040, 1).fillRect(6, 1, 4, 2);
    g.fillStyle(0x000000, 1).fillRect(5, 7, 6, 1);
    g.lineStyle(1, 0x000000, 1).strokeRect(3, 3, 10, 11);
  }

  function drawResAmmo(g, w, h) {
    g.fillStyle(0xd4a017, 1);
    g.fillRect(2, 6, 4, 4);
    g.fillRect(8, 6, 4, 4);
    g.fillStyle(0xaa8833, 1);
    g.fillRect(1, 6, 1, 4);
    g.fillRect(7, 6, 1, 4);
    g.fillStyle(0x665522, 1);
    g.fillRect(6, 6, 2, 4);
    g.fillRect(12, 6, 2, 4);
  }

  function drawResParts(g, w, h) {
    g.fillStyle(0x808088, 1).fillCircle(8, 8, 6);
    g.fillStyle(0x1a1a1a, 1).fillCircle(8, 8, 2);
    g.fillStyle(0x808088, 1);
    g.fillRect(7, 0, 2, 3);
    g.fillRect(7, 13, 2, 3);
    g.fillRect(0, 7, 3, 2);
    g.fillRect(13, 7, 3, 2);
  }

  function drawResMedkit(g, w, h) {
    g.fillStyle(0xaa1a1a, 1).fillRect(1, 1, 14, 14);
    g.fillStyle(0xffffff, 1).fillRect(6, 3, 4, 10).fillRect(3, 6, 10, 4);
    g.lineStyle(1, 0x000000, 1).strokeRect(1, 1, 14, 14);
  }

  // -------- HUD --------
  function drawHeart(g, w, h) {
    g.fillStyle(0xd42a2a, 1);
    g.fillCircle(5, 5, 4);
    g.fillCircle(11, 5, 4);
    g.fillTriangle(1, 6, 15, 6, 8, 14);
    g.fillStyle(0xff6666, 1).fillCircle(4, 3, 1);
  }

  function drawBattery(g, w, h) {
    g.fillStyle(0x1a1a1a, 1).fillRect(0, 4, 14, 8);
    g.fillStyle(0x00ff44, 1).fillRect(1, 5, 12, 6);
    g.fillStyle(0x404040, 1).fillRect(14, 6, 2, 4);
    g.lineStyle(1, 0x000000, 1).strokeRect(0, 4, 14, 8);
  }

  function drawAmmoIcon(g, w, h) {
    g.fillStyle(0xd4a017, 1).fillRect(2, 6, 10, 4);
    g.fillStyle(0xaa8833, 1).fillRect(2, 6, 1, 4);
    g.fillStyle(0x665522, 1).fillRect(10, 6, 4, 4);
  }

  // -------- Effects --------
  function drawMuzzleFlash(g, w, h) {
    g.fillStyle(0xffff88, 1).fillCircle(8, 8, 6);
    g.fillStyle(0xffffff, 1).fillCircle(8, 8, 3);
    g.fillStyle(0xffcc33, 0.7);
    g.fillTriangle(0, 8, 8, 6, 8, 10);
    g.fillTriangle(16, 8, 8, 6, 8, 10);
    g.fillTriangle(8, 0, 6, 8, 10, 8);
    g.fillTriangle(8, 16, 6, 8, 10, 8);
  }

  function drawBloodSplat(g, w, h, variant) {
    g.fillStyle(0x6a0000, 1);
    const offsets = [
      [[2, 4, 4, 4], [6, 2, 3, 3], [8, 7, 2, 3]],
      [[3, 3, 5, 5], [7, 6, 4, 4]],
      [[1, 5, 3, 3], [5, 3, 5, 6], [9, 8, 2, 2]],
      [[3, 2, 6, 7], [8, 8, 3, 3]]
    ][variant];
    offsets.forEach(o => g.fillRect(o[0], o[1], o[2], o[3]));
    g.fillStyle(0xaa0000, 1);
    g.fillRect(4, 4, 2, 2);
  }

  function drawSpark(g, w, h) {
    g.fillStyle(0xffff88, 1).fillCircle(4, 4, 3);
    g.fillStyle(0xffffff, 1).fillCircle(4, 4, 1);
  }

  function drawBulletTrail(g, w, h) {
    for (let i = 0; i < w; i++) {
      const a = 1 - (i / w);
      g.fillStyle(0xffffff, a);
      g.fillRect(i, 0, 1, h);
    }
  }

  function drawExplosion(g, w, h, frame) {
    const radius = 6 + frame * 8;
    g.fillStyle(0x000000, 0);
    g.fillStyle(0xff3300, 0.9).fillCircle(w / 2, h / 2, radius);
    g.fillStyle(0xffaa00, 0.9).fillCircle(w / 2, h / 2, Math.max(2, radius - 6));
    g.fillStyle(0xffff88, 0.9).fillCircle(w / 2, h / 2, Math.max(1, radius - 12));
    if (frame >= 2) {
      g.fillStyle(0x0a0a0a, 0.5).fillCircle(w / 2, h / 2, Math.max(0, radius - 16));
    }
  }

  function drawPixel(g, w, h, color) {
    g.fillStyle(color, 1).fillRect(0, 0, w, h);
  }

  // -------- Main create --------
  PT.createAll = function (scene) {
    makeTexture(scene, 'ground_tile', 32, 32, drawGroundTile);
    makeTexture(scene, 'ground_mid', 32, 32, drawGroundMid);
    makeTexture(scene, 'bg_factory', 1280, 300, drawBgFactory);
    makeTexture(scene, 'sky_gradient', 1280, 400, drawSkyGradient);

    // Player
    makeTexture(scene, 'player_idle', 32, 48, (g) => drawPlayerBase(g, 0));
    makeTexture(scene, 'player_run_1', 32, 48, (g) => drawPlayerBase(g, 2));
    makeTexture(scene, 'player_run_2', 32, 48, (g) => drawPlayerBase(g, -2));
    makeTexture(scene, 'player_crouch', 32, 48, drawPlayerCrouch);
    makeTexture(scene, 'player_dead', 32, 48, drawPlayerDead);

    // Zombies
    makeTexture(scene, 'zombie_walker', 28, 44, drawZombieWalker);
    makeTexture(scene, 'zombie_runner', 26, 42, drawZombieRunner);
    makeTexture(scene, 'zombie_brute', 44, 56, drawZombieBrute);

    // Machines
    makeTexture(scene, 'machine_barricade', 64, 120, drawBarricade);
    makeTexture(scene, 'machine_turret_base', 48, 32, drawTurretBase);
    makeTexture(scene, 'machine_turret_gun', 40, 16, drawTurretGun);
    makeTexture(scene, 'machine_generator', 56, 48, drawGenerator);
    makeTexture(scene, 'machine_crafting', 64, 56, drawCrafting);
    makeTexture(scene, 'machine_alarm', 24, 32, drawAlarm);
    makeTexture(scene, 'machine_rubble', 64, 12, drawRubble);

    // Held-item and recipe icons
    makeTexture(scene, 'icon_gun', 24, 16, drawIconGun);
    makeTexture(scene, 'icon_molotov', 24, 32, drawIconMolotov);
    makeTexture(scene, 'icon_pipebomb', 24, 32, drawIconPipeBomb);
    makeTexture(scene, 'icon_ammopack', 32, 24, drawIconAmmoPack);
    makeTexture(scene, 'icon_medkit_big', 32, 24, drawIconMedkitBig);
    makeTexture(scene, 'icon_turretammo', 32, 24, drawIconTurretAmmo);

    // Resources
    makeTexture(scene, 'res_scrap', 16, 16, drawResScrap);
    makeTexture(scene, 'res_fuel', 16, 16, drawResFuel);
    makeTexture(scene, 'res_ammo', 16, 16, drawResAmmo);
    makeTexture(scene, 'res_parts', 16, 16, drawResParts);
    makeTexture(scene, 'res_medkit', 16, 16, drawResMedkit);

    // HUD
    makeTexture(scene, 'hud_heart', 16, 16, drawHeart);
    makeTexture(scene, 'hud_battery', 16, 16, drawBattery);
    makeTexture(scene, 'hud_ammo_icon', 16, 16, drawAmmoIcon);

    // Effects
    makeTexture(scene, 'muzzle_flash', 16, 16, drawMuzzleFlash);
    for (let i = 1; i <= 4; i++) {
      makeTexture(scene, 'blood_' + i, 12, 12, (g, w, h) => drawBloodSplat(g, w, h, i - 1));
    }
    makeTexture(scene, 'spark', 8, 8, drawSpark);
    makeTexture(scene, 'bullet_trail', 20, 4, drawBulletTrail);
    for (let i = 1; i <= 4; i++) {
      makeTexture(scene, 'explosion_frame_' + i, 48, 48, (g, w, h) => drawExplosion(g, w, h, i - 1));
    }

    // Simple color pixels for particles
    makeTexture(scene, 'pixel_white', 2, 2, (g, w, h) => drawPixel(g, w, h, 0xffffff));
    makeTexture(scene, 'pixel_orange', 2, 2, (g, w, h) => drawPixel(g, w, h, 0xff8800));
    makeTexture(scene, 'pixel_red', 2, 2, (g, w, h) => drawPixel(g, w, h, 0xff3300));
    makeTexture(scene, 'pixel_yellow', 2, 2, (g, w, h) => drawPixel(g, w, h, 0xffcc00));
    makeTexture(scene, 'pixel_grey', 4, 4, (g, w, h) => drawPixel(g, w, h, 0x606060));
  };

  MACHINA.ProceduralTextures = PT;
})();
