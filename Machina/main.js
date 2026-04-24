// MACHINA - main entry
(function () {
  const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#0a0a0a',
    pixelArt: true,
    roundPixels: true,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 800 },
        debug: false
      }
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
      MACHINA.BootScene,
      MACHINA.MainMenuScene,
      MACHINA.GameScene,
      MACHINA.HUDScene,
      MACHINA.CraftingUIScene,
      MACHINA.GameOverScene
    ]
  };

  window.addEventListener('load', () => {
    MACHINA.game = new Phaser.Game(config);
  });
})();
