// Skillet Rush — WebAudio foley, all synthesized, no sample files.
// The context is created lazily on the first gesture so autoplay policy
// never throws; every helper is safe to call before that (it no-ops).

let ac = null;
let master = null;
let sizzleNode = null;

export function unlock() {
  if (ac) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  ac = new Ctx();
  master = ac.createGain();
  master.gain.value = 0.5;
  master.connect(ac.destination);
}

function env(node, t0, attack, decay, peak) {
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
  node.connect(g);
  g.connect(master);
  return g;
}

function noiseBuffer(seconds) {
  const len = Math.floor(ac.sampleRate * seconds);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

export function chop(quality) {
  if (!ac) return;
  const t0 = ac.currentTime;
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(0.08);
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = quality > 0.8 ? 900 : 600;
  src.connect(lp);
  env(lp, t0, 0.002, 0.09, 0.9);
  src.start(t0);
  const thud = ac.createOscillator();
  thud.type = "sine";
  thud.frequency.setValueAtTime(160, t0);
  thud.frequency.exponentialRampToValueAtTime(60, t0 + 0.08);
  env(thud, t0, 0.003, 0.1, 0.5);
  thud.start(t0); thud.stop(t0 + 0.12);
}

export function sizzle(on) {
  if (!ac) return;
  if (on && !sizzleNode) {
    const src = ac.createBufferSource();
    src.buffer = noiseBuffer(2);
    src.loop = true;
    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 3400;
    bp.Q.value = 0.7;
    const g = ac.createGain();
    g.gain.value = 0.06;
    src.connect(bp); bp.connect(g); g.connect(master);
    src.start();
    sizzleNode = { src, g };
  } else if (!on && sizzleNode) {
    sizzleNode.g.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.3);
    sizzleNode.src.stop(ac.currentTime + 0.35);
    sizzleNode = null;
  }
}

export function ding(streak) {
  if (!ac) return;
  const t0 = ac.currentTime;
  const base = 660 + Math.min(streak, 6) * 55;
  for (const [mult, delay] of [[1, 0], [1.5, 0.07]]) {
    const osc = ac.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = base * mult;
    env(osc, t0 + delay, 0.005, 0.35, 0.4);
    osc.start(t0 + delay); osc.stop(t0 + delay + 0.4);
  }
}

export function buzz() {
  if (!ac) return;
  const t0 = ac.currentTime;
  const osc = ac.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(180, t0);
  osc.frequency.linearRampToValueAtTime(90, t0 + 0.3);
  env(osc, t0, 0.01, 0.32, 0.35);
  osc.start(t0); osc.stop(t0 + 0.35);
}

export function coin() {
  if (!ac) return;
  const t0 = ac.currentTime;
  const osc = ac.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(988, t0);
  osc.frequency.setValueAtTime(1319, t0 + 0.06);
  env(osc, t0, 0.004, 0.22, 0.25);
  osc.start(t0); osc.stop(t0 + 0.25);
}
