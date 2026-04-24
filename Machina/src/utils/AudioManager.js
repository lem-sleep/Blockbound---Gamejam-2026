// AudioManager.js - procedural sound generation via Web Audio API
(function () {
  const AM = {
    ctx: null,
    masterGain: null,
    sfxGain: null,
    musicGain: null,
    buffers: {},
    active: {},           // playing loops { key: { source, gain } }
    instanceCounts: {},   // limit simultaneous sfx instances
    sfxVolume: 0.6,
    musicVolume: 0.3,
    ready: false,
    muted: false
  };

  AM.init = function (scene) {
    try {
      if (AM.ctx) return;
      AM.ctx = new (window.AudioContext || window.webkitAudioContext)();
      AM.masterGain = AM.ctx.createGain();
      AM.masterGain.gain.value = 1.0;
      AM.masterGain.connect(AM.ctx.destination);
      AM.sfxGain = AM.ctx.createGain();
      AM.sfxGain.gain.value = AM.sfxVolume;
      AM.sfxGain.connect(AM.masterGain);
      AM.musicGain = AM.ctx.createGain();
      AM.musicGain.gain.value = AM.musicVolume;
      AM.musicGain.connect(AM.masterGain);

      // Resume on first user interaction
      const resume = () => {
        if (AM.ctx.state === 'suspended') AM.ctx.resume();
      };
      window.addEventListener('pointerdown', resume);
      window.addEventListener('keydown', resume);

      AM._generateAll();
      AM.ready = true;
    } catch (e) {
      console.warn('AudioManager init failed:', e);
    }
  };

  function makeBuffer(duration) {
    const sr = AM.ctx.sampleRate;
    const length = Math.max(1, Math.floor(sr * duration));
    return AM.ctx.createBuffer(1, length, sr);
  }

  function noise(duration, filter) {
    const buf = makeBuffer(duration);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (filter ? filter(i / data.length) : 1);
    }
    return buf;
  }

  function sine(duration, freqFn, envFn) {
    const buf = makeBuffer(duration);
    const data = buf.getChannelData(0);
    const sr = AM.ctx.sampleRate;
    let phase = 0;
    for (let i = 0; i < data.length; i++) {
      const t = i / sr;
      const freq = typeof freqFn === 'function' ? freqFn(t) : freqFn;
      phase += (2 * Math.PI * freq) / sr;
      const env = envFn ? envFn(i / data.length) : 1;
      data[i] = Math.sin(phase) * env;
    }
    return buf;
  }

  function square(duration, freqFn, envFn) {
    const buf = makeBuffer(duration);
    const data = buf.getChannelData(0);
    const sr = AM.ctx.sampleRate;
    let phase = 0;
    for (let i = 0; i < data.length; i++) {
      const t = i / sr;
      const freq = typeof freqFn === 'function' ? freqFn(t) : freqFn;
      phase += (2 * Math.PI * freq) / sr;
      const env = envFn ? envFn(i / data.length) : 1;
      data[i] = (Math.sin(phase) >= 0 ? 1 : -1) * env;
    }
    return buf;
  }

  function mix(buffers, gains) {
    let maxLen = 0;
    buffers.forEach(b => { if (b.length > maxLen) maxLen = b.length; });
    const out = AM.ctx.createBuffer(1, maxLen, AM.ctx.sampleRate);
    const od = out.getChannelData(0);
    buffers.forEach((b, i) => {
      const d = b.getChannelData(0);
      const g = gains[i] || 1;
      for (let j = 0; j < d.length; j++) od[j] += d[j] * g;
    });
    return out;
  }

  AM._generateAll = function () {
    // sfx_shoot: sharp noise burst
    AM.buffers['sfx_shoot'] = (() => {
      const b = noise(0.08, (t) => Math.pow(1 - t, 4));
      const d = b.getChannelData(0);
      // simple high-pass imitation: differentiate
      for (let i = d.length - 1; i > 0; i--) d[i] = d[i] - d[i - 1] * 0.7;
      // gain
      for (let i = 0; i < d.length; i++) d[i] *= 0.4;
      return b;
    })();

    // sfx_hit_zombie
    AM.buffers['sfx_hit_zombie'] = (() => {
      const b = noise(0.12, (t) => Math.pow(1 - t, 2));
      const d = b.getChannelData(0);
      // low-pass (naive: 2-sample moving average repeated)
      for (let p = 0; p < 4; p++) {
        for (let i = 1; i < d.length; i++) d[i] = (d[i] + d[i - 1]) * 0.5;
      }
      for (let i = 0; i < d.length; i++) d[i] *= 0.5;
      return b;
    })();

    // zombie moans - three pitches
    [0, 1, 2].forEach((v) => {
      const base = 180 + v * 20;
      AM.buffers['sfx_zombie_moan_' + v] = sine(
        0.6,
        (t) => base + Math.sin(t * 2 * Math.PI * 4) * 8,
        (p) => {
          const env = p < 0.1 ? p * 10 : 1 - (p - 0.1) / 0.9;
          return env * (0.4 + 0.2 * Math.sin(p * Math.PI * 8)); // tremolo
        }
      );
    });

    // machine build - 3 metallic clicks
    AM.buffers['sfx_machine_build'] = (() => {
      const total = 0.25;
      const buf = makeBuffer(total);
      const d = buf.getChannelData(0);
      const sr = AM.ctx.sampleRate;
      for (let k = 0; k < 3; k++) {
        const start = Math.floor((0.01 + k * 0.08) * sr);
        const len = Math.floor(0.03 * sr);
        for (let i = 0; i < len && start + i < d.length; i++) {
          const env = Math.pow(1 - i / len, 3);
          d[start + i] += (Math.random() * 2 - 1) * env * 0.6;
        }
      }
      return buf;
    })();

    // generator hum (loopable, ~0.5s)
    AM.buffers['sfx_generator_hum'] = (() => {
      const b = makeBuffer(0.5);
      const d = b.getChannelData(0);
      const sr = AM.ctx.sampleRate;
      for (let i = 0; i < d.length; i++) {
        const t = i / sr;
        const v = Math.sin(2 * Math.PI * 60 * t) * 0.6
                + Math.sin(2 * Math.PI * 120 * t) * 0.2
                + Math.sin(2 * Math.PI * 180 * t) * 0.1;
        d[i] = v * 0.15;
      }
      return b;
    })();

    // alarm loop (~0.6s pattern)
    AM.buffers['sfx_alarm'] = (() => {
      const total = 0.6;
      const b = makeBuffer(total);
      const d = b.getChannelData(0);
      const sr = AM.ctx.sampleRate;
      for (let i = 0; i < d.length; i++) {
        const t = i / sr;
        let amp = 0;
        const phase = t % 0.3;
        if (phase < 0.2) {
          const freq = (t < 0.3) ? 880 : 1760;
          amp = Math.sin(2 * Math.PI * freq * t) >= 0 ? 1 : -1;
          // envelope
          const k = phase / 0.2;
          amp *= (1 - k) * 0.5;
        }
        d[i] = amp;
      }
      return b;
    })();

    // explosion
    AM.buffers['sfx_explosion'] = (() => {
      const noiseBuf = noise(0.25, (t) => Math.pow(1 - t, 1.5));
      const nd = noiseBuf.getChannelData(0);
      for (let p = 0; p < 3; p++) {
        for (let i = 1; i < nd.length; i++) nd[i] = (nd[i] + nd[i - 1]) * 0.5;
      }
      const lowBoom = sine(0.2, (t) => 80 - t * 200, (p) => Math.pow(1 - p, 2));
      const buf = mix([noiseBuf, lowBoom], [0.6, 0.7]);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.tanh(d[i] * 1.2) * 0.8;
      return buf;
    })();

    // ambient music loop
    AM.buffers['music_ambient'] = (() => {
      const total = 4.0;
      const b = makeBuffer(total);
      const d = b.getChannelData(0);
      const sr = AM.ctx.sampleRate;
      for (let i = 0; i < d.length; i++) {
        const t = i / sr;
        const fade = Math.min(1, t * 2) * Math.min(1, (total - t) * 2);
        const v = Math.sin(2 * Math.PI * 55 * t) * 0.5
                + Math.sin(2 * Math.PI * 55.3 * t) * 0.4
                + Math.sin(2 * Math.PI * 110 * t) * 0.3
                + Math.sin(2 * Math.PI * 110.2 * t) * 0.25
                + Math.sin(2 * Math.PI * 165 * t + Math.sin(t * 0.3) * 2) * 0.2
                + Math.sin(2 * Math.PI * 220 * t) * 0.12;
        const pulse = 0.9 + 0.1 * Math.sin(t * 2 * Math.PI * 0.2);
        d[i] = v * 0.15 * fade * pulse;
      }
      return b;
    })();

    // heartbeat
    AM.buffers['sfx_heartbeat'] = (() => {
      const b = makeBuffer(0.8);
      const d = b.getChannelData(0);
      const sr = AM.ctx.sampleRate;
      [0, 0.12].forEach((start) => {
        const s = Math.floor(start * sr);
        const len = Math.floor(0.08 * sr);
        for (let i = 0; i < len && s + i < d.length; i++) {
          const env = Math.pow(1 - i / len, 2);
          d[s + i] += Math.sin(2 * Math.PI * 60 * (i / sr)) * env * 0.5;
        }
      });
      return b;
    })();

    // pickup
    AM.buffers['sfx_pickup'] = sine(0.15, (t) => 600 + t * 1400, (p) => Math.pow(1 - p, 2) * 0.4);

    // reload
    AM.buffers['sfx_reload'] = (() => {
      const b = makeBuffer(0.3);
      const d = b.getChannelData(0);
      const sr = AM.ctx.sampleRate;
      [0, 0.12, 0.22].forEach((start) => {
        const s = Math.floor(start * sr);
        const len = Math.floor(0.04 * sr);
        for (let i = 0; i < len && s + i < d.length; i++) {
          const env = Math.pow(1 - i / len, 2);
          d[s + i] += (Math.random() * 2 - 1) * env * 0.5;
        }
      });
      return b;
    })();

    // player_hurt
    AM.buffers['sfx_player_hurt'] = sine(0.25, (t) => 220 - t * 180, (p) => Math.pow(1 - p, 2) * 0.5);
  };

  AM.play = function (key, options) {
    if (!AM.ready || AM.muted) return null;
    options = options || {};
    const buf = AM.buffers[key];
    if (!buf) return null;
    AM.instanceCounts[key] = AM.instanceCounts[key] || 0;
    if (AM.instanceCounts[key] >= 3 && !options.force) return null;
    try {
      const src = AM.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = !!options.loop;
      const g = AM.ctx.createGain();
      g.gain.value = options.volume != null ? options.volume : 1.0;
      src.connect(g).connect(options.music ? AM.musicGain : AM.sfxGain);
      src.start(0);
      AM.instanceCounts[key]++;
      src.onended = () => { AM.instanceCounts[key]--; };
      return { source: src, gain: g };
    } catch (e) {
      return null;
    }
  };

  AM.playLoop = function (key, volume) {
    if (AM.active[key]) return AM.active[key];
    const h = AM.play(key, { loop: true, volume: volume != null ? volume : 1.0 });
    if (h) AM.active[key] = h;
    return h;
  };

  AM.stop = function (key) {
    const h = AM.active[key];
    if (h) {
      try { h.source.stop(); } catch (_) {}
      delete AM.active[key];
    }
  };

  AM.playRandomMoan = function () {
    const v = Math.floor(Math.random() * 3);
    return AM.play('sfx_zombie_moan_' + v, { volume: 0.5 });
  };

  AM.setMasterVolume = function (v) {
    if (AM.masterGain) AM.masterGain.gain.value = v;
  };

  AM.setMuted = function (m) {
    AM.muted = m;
    if (AM.masterGain) AM.masterGain.gain.value = m ? 0 : 1;
  };

  AM.fadeOut = function (key, duration) {
    const h = AM.active[key];
    if (!h) return;
    try {
      const now = AM.ctx.currentTime;
      h.gain.gain.linearRampToValueAtTime(0, now + duration);
      setTimeout(() => AM.stop(key), duration * 1000 + 50);
    } catch (_) {}
  };

  MACHINA.AudioManager = AM;
})();
