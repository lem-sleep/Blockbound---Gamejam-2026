// SaveManager.js - HARDCORE mode: no game state is saved, only the high score
(function () {
  const KEY = 'machina_highscore';

  const SaveManager = {
    // No-op: hardcore mode never persists game state.
    save(data) { /* intentionally empty */ },

    // Retrieve the high score only (or null if none). Returns the integer directly.
    getHighScore() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw == null) return null;
        const n = parseInt(raw, 10);
        return isNaN(n) ? null : n;
      } catch (_) { return null; }
    },

    // Back-compat shim used by older scenes; no longer carries session state.
    load() {
      const hs = SaveManager.getHighScore();
      return hs != null ? { highScore: hs } : null;
    },

    clear() { try { localStorage.removeItem(KEY); } catch (_) {} },

    saveHighScore(score) {
      if (typeof score !== 'number' || !isFinite(score)) return false;
      const current = SaveManager.getHighScore();
      if (current == null || score > current) {
        try { localStorage.setItem(KEY, String(Math.floor(score))); } catch (_) {}
        return true; // new high score
      }
      return false;
    }
  };

  MACHINA.SaveManager = SaveManager;
})();
