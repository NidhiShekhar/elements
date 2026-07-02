/* Music modal — the vinyl player. Plays assets/audio/ambient-loop.mp3
   if present; otherwise falls back to a soft Web Audio "cozy vinyl"
   pad (warm chord + gentle crackle) so the room always has music. */
(function () {
  const VOL_KEY = 'bloom-music-volume';
  let playing = false;
  let volume = BloomStore.read(VOL_KEY, 0.6);

  /* ---- file-based playback ---- */
  const audio = new Audio('assets/audio/ambient-loop.mp3');
  audio.loop = true;
  let fileAvailable = null; // unknown until first play attempt
  audio.addEventListener('error', () => { fileAvailable = false; });

  /* ---- Web Audio fallback: warm pad + vinyl crackle ---- */
  let ctx = null, master = null, crackleTimer = null, oscs = [];

  function startSynth() {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    master.gain.linearRampToValueAtTime(volume * 0.16, ctx.currentTime + 2);

    // A warm Amaj7-ish pad, detuned slightly for softness
    const freqs = [110, 164.81, 220, 277.18, 329.63];
    oscs = freqs.map((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 ? 'sine' : 'triangle';
      osc.frequency.value = f;
      osc.detune.value = (Math.random() - 0.5) * 8;
      const g = ctx.createGain();
      g.gain.value = 0.5 / freqs.length;
      // slow independent swell so the pad breathes
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05 + Math.random() * 0.06;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.18 / freqs.length;
      lfo.connect(lfoGain);
      lfoGain.connect(g.gain);
      lfo.start();
      osc.connect(g);
      g.connect(master);
      osc.start();
      return { osc, lfo };
    });

    // vinyl crackle: sparse little noise ticks
    crackleTimer = setInterval(() => {
      if (!ctx || !master) return;
      if (Math.random() < 0.65) {
        const len = 0.02;
        const buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.3));
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g = ctx.createGain();
        g.gain.value = 0.05 + Math.random() * 0.1;
        src.connect(g);
        g.connect(master);
        src.start();
      }
    }, 220);
  }

  function stopSynth() {
    if (crackleTimer) { clearInterval(crackleTimer); crackleTimer = null; }
    if (master && ctx) {
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
      const done = oscs.slice();
      setTimeout(() => done.forEach(o => { try { o.osc.stop(); o.lfo.stop(); } catch (e) {} }), 900);
    }
    oscs = [];
    master = null;
  }

  function applyVolume() {
    audio.volume = volume;
    if (master && ctx) master.gain.setTargetAtTime(volume * 0.16, ctx.currentTime, 0.1);
  }

  function play() {
    if (fileAvailable !== false) {
      audio.volume = volume;
      audio.play().then(() => { fileAvailable = true; }).catch(() => {
        fileAvailable = false;
        startSynth();
      });
      if (fileAvailable === false) startSynth();
    } else {
      startSynth();
    }
    playing = true;
    syncUi();
  }

  function stop() {
    audio.pause();
    stopSynth();
    playing = false;
    syncUi();
  }

  function syncUi() {
    const disc = document.querySelector('#modal-music .music-disc');
    const btn = document.querySelector('#modal-music [data-playpause]');
    if (disc) disc.classList.toggle('playing', playing);
    if (btn) btn.textContent = playing ? 'Pause' : 'Play';
  }

  function render() {
    const body = document.getElementById('musicBody');
    body.innerHTML =
      bloomModalHead('Record player', 'A little something for the room') +
      '<div class="music-panel">' +
        '<div class="music-disc' + (playing ? ' playing' : '') + '"></div>' +
        '<div class="music-controls">' +
          '<button class="bloom-button" data-playpause>' + (playing ? 'Pause' : 'Play') + '</button>' +
        '</div>' +
        '<div style="width:100%; display:flex; align-items:center; gap:10px">' +
          '<span class="bloom-label" style="margin:0">Volume</span>' +
          '<input class="bloom-range" id="musicVolume" type="range" min="0" max="1" step="0.05" value="' + volume + '">' +
        '</div>' +
        '<p class="bloom-label" style="margin:0; text-align:center; text-transform:none; letter-spacing:0">' +
          'The record keeps spinning after you close this — click the player again to stop it.' +
        '</p>' +
      '</div>';

    body.querySelector('[data-playpause]').addEventListener('click', () => {
      playing ? stop() : play();
    });
    body.querySelector('#musicVolume').addEventListener('input', (e) => {
      volume = Number(e.target.value);
      BloomStore.write(VOL_KEY, volume);
      applyVolume();
    });
  }

  /* Music keeps playing when the modal closes — the room has a soundtrack. */
  BloomModals.register('music', render);
})();
