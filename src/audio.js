/** Quiet original bed and show stingers. Nothing is loaded from a recording. */

export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;
  let lastDrum = -999;
  let lastFlute = -999;
  let lastTick = -999;

  function ensure() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.85;
    master.connect(ctx.destination);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 880;
    filter.Q.value = 0.4;
    filter.connect(master);
    const tone = (freq, type, gain) => {
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      amp.gain.value = gain;
      osc.connect(amp);
      amp.connect(filter);
      osc.start();
    };
    tone(196, 'sine', 0.018);
    tone(246.94, 'sine', 0.01);
    tone(293.66, 'triangle', 0.006);
  }

  function blip(freq, dur, vol, type) {
    if (!ctx || muted || vol < 0.002) return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    const t0 = ctx.currentTime;
    amp.gain.setValueAtTime(vol, t0);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp);
    amp.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  return {
    setMuted(value) {
      muted = !!value;
      if (master) master.gain.setValueAtTime(muted ? 0 : 0.85, ctx ? ctx.currentTime : 0);
    },
    isMuted() { return muted; },
    unlock() {
      try {
        ensure();
        if (ctx && ctx.state === 'suspended') ctx.resume();
      } catch { /* headless or blocked */ }
    },
    update(time, dist, watching) {
      if (!ctx || muted) return;
      const parade = dist.parade ?? 99;
      if (watching === 'parade' || parade < 20) {
        const beat = Math.floor(time * 2.05);
        if (beat !== lastDrum) {
          lastDrum = beat;
          const close = watching === 'parade' ? 1 : Math.max(0, 1 - parade / 20);
          const accent = beat % 4 === 0;
          blip(accent ? 78 : 128, accent ? 0.12 : 0.06, close * (accent ? 0.07 : 0.04), 'square');
        }
      }
      const stage = dist.stage ?? 99;
      if (watching === 'stage' || stage < 16) {
        const phrase = Math.floor(time / 3.4);
        if (phrase !== lastFlute) {
          lastFlute = phrase;
          const notes = [494, 587, 659, 587, 523, 440];
          const close = watching === 'stage' ? 1 : Math.max(0, 1 - stage / 16);
          blip(notes[Math.abs(phrase) % notes.length], 0.28, close * 0.035, 'triangle');
        }
      }
      const street = dist.street ?? 99;
      if (watching === 'street' || street < 14) {
        const beat = Math.floor(time * 3.1);
        if (beat !== lastTick && beat % 2 === 0) {
          lastTick = beat;
          const close = watching === 'street' ? 1 : Math.max(0, 1 - street / 14);
          blip(740 + (beat % 4) * 40, 0.035, close * 0.02, 'square');
        }
      }
    },
  };
}
