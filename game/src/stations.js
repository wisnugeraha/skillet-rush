// Skillet Rush — the two timed crafts: the knife on the prep block and the
// heat on the flat-top. Each station owns its mini-game state and answers
// one question per click: did the player land the window?
import { INGREDIENTS, CHOP_CYCLE, CHOP_GREEN, COOK_SECONDS, SEAR_WINDOW,
  BURNT_AFTER, PERFECT_CUT_BONUS } from "./config.js";

export class PrepBlock {
  constructor() { this.reset(); }

  reset() {
    this.item = null;      // {kind}
    this.phase = 0;        // 0..1 sawtooth, the knife meter
    this.direction = 1;
  }

  get busy() { return this.item !== null; }

  accept(carried) {
    if (this.item || !carried) return false;
    if (INGREDIENTS[carried.kind].prep !== "chop") return false;
    this.item = { kind: carried.kind };
    this.phase = 0;
    this.direction = 1;
    return true;
  }

  tick(dt) {
    if (!this.item) return;
    this.phase += this.direction * dt / CHOP_CYCLE;
    if (this.phase >= 1) { this.phase = 1; this.direction = -1; }
    if (this.phase <= 0) { this.phase = 0; this.direction = 1; }
  }

  // the sweet spot rides the middle of the sweep
  greenCenter() { return 0.5; }
  inGreen() { return Math.abs(this.phase - this.greenCenter()) <= CHOP_GREEN / 2; }

  strike() {
    if (!this.item) return null;
    const kind = this.item.kind;
    const hit = this.inGreen();
    this.reset();
    if (!hit) return { ok: false, kind };
    const closeness = 1 - Math.abs(this.phase - this.greenCenter()) / (CHOP_GREEN / 2);
    const bonus = closeness > 0.85 ? PERFECT_CUT_BONUS : 0;
    return { ok: true, kind, quality: 0.75 + 0.25 * closeness, perfect: bonus > 0, bonus };
  }
}

export class Pan {
  constructor(slot) { this.slot = slot; this.reset(); }

  reset() { this.item = null; this.elapsed = 0; }

  get busy() { return this.item !== null; }
  get ruined() { return this.item && this.elapsed > COOK_SECONDS * BURNT_AFTER; }
  progress() { return Math.min(1.4, this.elapsed / COOK_SECONDS); }

  accept(carried) {
    if (this.item || !carried) return false;
    if (INGREDIENTS[carried.kind].prep !== "cook") return false;
    this.item = { kind: carried.kind };
    this.elapsed = 0;
    return true;
  }

  tick(dt) {
    if (this.item) this.elapsed += dt;
  }

  inWindow() {
    if (!this.item) return false;
    const p = this.progress();
    return p >= 1 - SEAR_WINDOW && p <= 1.0;
  }

  // lift the food off the iron: done inside the window, burnt past the cliff
  lift() {
    if (!this.item) return null;
    const kind = this.item.kind;
    const p = this.progress();
    this.reset();
    if (p > 1.0) return { state: "burnt", kind };
    if (this.inWindow()) {
      const center = 1 - SEAR_WINDOW / 2;
      const closeness = 1 - Math.min(1, Math.abs(p - center) / (SEAR_WINDOW / 2));
      return { state: "done", kind, quality: 0.7 + 0.3 * closeness };
    }
    return { state: "under", kind }; // pulled too early, useless
  }
}
