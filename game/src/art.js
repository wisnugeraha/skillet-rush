// Skillet Rush — all drawing lives here: kitchen bones, crates, food, pans,
// tickets. Nothing in this module mutates game state; it reads and paints.
import { CANVAS_W, CANVAS_H, RAIL_Y, COUNTER_Y, BOARD, STOVE, PASS, CRATE_ORDER, INGREDIENTS } from "./config.js";

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
export { roundRect };

// ---- room ------------------------------------------------------------------
export function paintKitchen(ctx) {
  const wall = ctx.createLinearGradient(0, 0, 0, COUNTER_Y);
  wall.addColorStop(0, "#3a2b22");
  wall.addColorStop(1, "#2a1e18");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, CANVAS_W, COUNTER_Y);
  // tiled backsplash between the stations
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.strokeStyle = "#ffd9a0";
  ctx.lineWidth = 1;
  for (let gx = 0; gx <= CANVAS_W; gx += 46) {
    ctx.beginPath(); ctx.moveTo(gx, RAIL_Y); ctx.lineTo(gx, COUNTER_Y); ctx.stroke();
  }
  for (let gy = RAIL_Y; gy <= COUNTER_Y; gy += 46) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(CANEL(gy), gy); ctx.stroke();
  }
  ctx.restore();
  // heat lamps glow over the line
  for (const lx of [250, 660, 1050]) {
    const glow = ctx.createRadialGradient(lx, RAIL_Y + 20, 8, lx, RAIL_Y + 20, 190);
    glow.addColorStop(0, "rgba(255,196,110,0.34)");
    glow.addColorStop(1, "rgba(255,196,110,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(lx - 200, RAIL_Y, 400, 320);
  }
  paintCounter(ctx);
}
function CANEL(y) { return CANVAS_W; }

export function paintCounter(ctx) {
  const wood = ctx.createLinearGradient(0, COUNTER_Y, 0, CANVAS_H);
  wood.addColorStop(0, "#8a5a33");
  wood.addColorStop(0.12, "#7c4f2c");
  wood.addColorStop(1, "#5e3a20");
  ctx.fillStyle = wood;
  ctx.fillRect(0, COUNTER_Y, CANVAS_W, CANVAS_H - COUNTER_Y);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(0, COUNTER_Y, CANVAS_W, 6);
}

// ---- station plates ----------------------------------------------------------
export function paintBoardHousing(ctx) {
  roundRect(ctx, BOARD.x, BOARD.y, BOARD.w, BOARD.h, 16);
  ctx.fillStyle = "#4b3524";
  ctx.fill();
  ctx.strokeStyle = "#6d4c31"; ctx.lineWidth = 3; ctx.stroke();
  // the wooden block itself
  roundRect(ctx, BOARD.x + 42, BOARD.y + 96, BOARD.w - 84, 148, 10);
  const block = ctx.createLinearGradient(0, BOARD.y + 96, 0, BOARD.y + 244);
  block.addColorStop(0, "#d8ab6a");
  block.addColorStop(1, "#b9884b");
  ctx.fillStyle = block;
  ctx.fill();
  label(ctx, "PREP BLOCK", BOARD.x + BOARD.w / 2, BOARD.y + 30);
}

export function paintStoveHousing(ctx) {
  roundRect(ctx, STOVE.x, STOVE.y, STOVE.w, STOVE.h, 16);
  ctx.fillStyle = "#26313a";
  ctx.fill();
  ctx.strokeStyle = "#415463"; ctx.lineWidth = 3; ctx.stroke();
  label(ctx, "FLAT-TOP LINE", STOVE.x + STOVE.w / 2, STOVE.y + 30);
}

export function paintPassHousing(ctx) {
  roundRect(ctx, PASS.x, PASS.y, PASS.w, PASS.h, 16);
  ctx.fillStyle = "#3c2a3a";
  ctx.fill();
  ctx.strokeStyle = "#5d4057"; ctx.lineWidth = 3; ctx.stroke();
  label(ctx, "SERVICE PASS", PASS.x + PASS.w / 2, PASS.y + 30);
}

export function label(ctx, text, cx, cy) {
  ctx.font = "600 15px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,224,178,0.78)";
  ctx.fillText(text, cx, cy);
}

// ---- crates -----------------------------------------------------------------
export function crateRects() {
  const n = CRATE_ORDER.length;
  const gap = 14;
  const w = (CANVAS_W - 60 - gap * (n - 1)) / n;
  return CRATE_ORDER.map((kind, i) => ({
    kind, x: 30 + i * (w + gap), y: COUNTER_Y + 26, w, h: 108,
  }));
}

export function paintCrate(ctx, rect, hot) {
  const ing = INGREDIENTS[rect.kind];
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  const g = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  g.addColorStop(0, hot ? "#6b4a2c" : "#57391f");
  g.addColorStop(1, "#3d2714");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = hot ? "#ffc46b" : "#7a5230";
  ctx.lineWidth = hot ? 3 : 2;
  ctx.stroke();
  drawFoodIcon(ctx, rect.kind, "raw", rect.x + rect.w / 2, rect.y + 44, 20);
  ctx.font = "600 13px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffe9c4";
  ctx.fillText(ing.label, rect.x + rect.w / 2, rect.y + rect.h - 14);
}

// ---- food -------------------------------------------------------------------
// state: raw | cut | cooking | done | burnt — same silhouette, different dress.
export function drawFoodIcon(ctx, kind, state, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  const ing = INGREDIENTS[kind];
  if (state === "burnt") {
    charcoal(ctx, r);
  } else if (kind === "tomato") {
    sphere(ctx, "#ff6a5e", ing.color, r);
    if (state === "cut") wedgeSlice(ctx, r, "#ffb3a8");
    if (state === "done") glaze(ctx, r);
  } else if (kind === "onion") {
    sphere(ctx, "#fff3d6", ing.color, r);
    ctx.strokeStyle = "rgba(160,120,60,0.55)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2); ctx.stroke();
    if (state === "cut") rings(ctx, r);
    if (state === "done") glaze(ctx, r);
  } else if (kind === "chili") {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(-r, -r * 0.2);
    ctx.quadraticCurveTo(0, r * 0.9, r, r * 0.1);
    ctx.quadraticCurveTo(0, -r * 0.5, -r, -r * 0.2);
    ctx.fill();
    ctx.fillStyle = "#3f7a2c";
    ctx.fillRect(-r - 3, -r * 0.45, 7, 8);
    if (state === "cut") sliceMarks(ctx, r);
  } else if (kind === "egg") {
    if (state === "done") {
      ctx.fillStyle = "#fbf3da";
      blob(ctx, r * 1.25, 0.8);
      sphere(ctx, "#ffe28a", "#f4b942", r * 0.55);
    } else {
      sphere(ctx, "#fffdf4", ing.color, r);
      if (state === "cut") sliceMarks(ctx, r);
    }
  } else if (kind === "beef") {
    roundRectShape(ctx, r);
    const meat = ctx.createLinearGradient(0, -r, 0, r);
    if (state === "done") { meat.addColorStop(0, "#8c4a2f"); meat.addColorStop(1, "#5e2c1a"); }
    else { meat.addColorStop(0, "#c46148"); meat.addColorStop(1, ing.color); }
    ctx.fillStyle = meat;
    ctx.fill();
    marbling(ctx, r, state);
  } else if (kind === "fish") {
    fillet(ctx, r, state);
  } else if (kind === "noodle") {
    nest(ctx, r, state, ing.color);
  } else if (kind === "rice") {
    mound(ctx, r, state, ing.color);
  }
  ctx.restore();
}

function sphere(ctx, hi, base, r) {
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.2, 0, 0, r);
  g.addColorStop(0, hi);
  g.addColorStop(1, base);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
}
function blob(ctx, rx, ryRatio) {
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, rx * ryRatio * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
}
function roundRectShape(ctx, r) {
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.1, r * 0.78, 0, 0, Math.PI * 2);
}
function marbling(ctx, r, state) {
  ctx.strokeStyle = state === "done" ? "rgba(255,220,180,0.25)" : "rgba(255,235,220,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.15); ctx.quadraticCurveTo(0, r * 0.1, r * 0.5, -r * 0.2); ctx.stroke();
  if (state === "done") {
    ctx.strokeStyle = "rgba(40,20,10,0.6)"; ctx.lineWidth = 3;
    for (const off of [-r * 0.4, 0, r * 0.4]) {
      ctx.beginPath(); ctx.moveTo(off - 6, -r * 0.6); ctx.lineTo(off + 6, r * 0.6); ctx.stroke();
    }
  }
}
function fillet(ctx, r, state) {
  const g = ctx.createLinearGradient(-r, 0, r, 0);
  if (state === "done") { g.addColorStop(0, "#e8b088"); g.addColorStop(0.5, "#f6d2a8"); g.addColorStop(1, "#d99968"); }
  else { g.addColorStop(0, "#ffc9b4"); g.addColorStop(0.5, "#f6a08a"); g.addColorStop(1, "#e98a72"); }
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-r, r * 0.35);
  ctx.quadraticCurveTo(-r * 0.2, -r * 0.85, r, -r * 0.3);
  ctx.quadraticCurveTo(r * 0.3, r * 0.8, -r, r * 0.35);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1.5;
  for (const k of [-0.3, 0, 0.3]) {
    ctx.beginPath(); ctx.moveTo(-r * 0.6, r * k); ctx.quadraticCurveTo(0, r * k - 6, r * 0.6, r * k - 2); ctx.stroke();
  }
  if (state === "cut") sliceMarks(ctx, r);
}
function nest(ctx, r, state, base) {
  ctx.strokeStyle = state === "done" ? "#e7b45c" : base;
  ctx.lineWidth = 4;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(0, (i - 1.5) * 5, r * (0.9 - i * 0.08), r * 0.32, 0.2, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (state === "done") glaze(ctx, r);
}
function mound(ctx, r, state, base) {
  ctx.fillStyle = state === "done" ? "#fffdf2" : base;
  ctx.beginPath();
  ctx.moveTo(-r, r * 0.5);
  ctx.quadraticCurveTo(0, -r * 1.1, r, r * 0.5);
  ctx.quadraticCurveTo(0, r * 0.8, -r, r * 0.5);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  for (let i = 0; i < 6; i++) ctx.fillRect(-r * 0.7 + i * r * 0.24, -r * 0.2 + (i % 2) * 6, 3, 3);
}
function wedgeSlice(ctx, r, hi) {
  ctx.strokeStyle = hi; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-r * 0.7, 0); ctx.lineTo(r * 0.7, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -r * 0.7); ctx.lineTo(0, r * 0.7); ctx.stroke();
}
function rings(ctx, r) {
  ctx.strokeStyle = "rgba(190,150,90,0.9)"; ctx.lineWidth = 2.5;
  for (const rr of [0.35, 0.6, 0.85]) {
    ctx.beginPath(); ctx.arc(0, 0, r * rr, 0, Math.PI * 2); ctx.stroke();
  }
}
function sliceMarks(ctx, r) {
  ctx.strokeStyle = "rgba(60,30,20,0.55)"; ctx.lineWidth = 2;
  for (const off of [-0.4, 0, 0.4]) {
    ctx.beginPath(); ctx.moveTo(off * r, -r * 0.6); ctx.lineTo(off * r + 4, r * 0.6); ctx.stroke();
  }
}
function glaze(ctx, r) {
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.4, 2, 0, 0, r * 1.2);
  g.addColorStop(0, "rgba(255,240,200,0.55)");
  g.addColorStop(1, "rgba(255,200,120,0)");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r * 1.2, 0, Math.PI * 2); ctx.fill();
}
function charcoal(ctx, r) {
  ctx.fillStyle = "#2b2420";
  blob(ctx, r, 0.7);
  ctx.fillStyle = "rgba(120,60,30,0.6)";
  for (const [dx, dy] of [[-0.3, -0.1], [0.2, 0.15], [0.05, -0.3]]) {
    ctx.fillRect(dx * r, dy * r, 4, 3);
  }
}

// ---- pan ---------------------------------------------------------------------
export function paintPan(ctx, cx, cy, radius) {
  ctx.save();
  ctx.fillStyle = "#1b242c";
  ctx.beginPath(); ctx.ellipse(cx, cy + 6, radius * 1.12, radius * 0.92, 0, 0, Math.PI * 2); ctx.fill();
  const steel = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
  steel.addColorStop(0, "#39434d");
  steel.addColorStop(0.5, "#59646e");
  steel.addColorStop(1, "#313941");
  ctx.fillStyle = steel;
  ctx.beginPath(); ctx.ellipse(cx, cy, radius, radius * 0.82, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#222a31"; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(cx + radius * 0.9, cy); ctx.lineTo(cx + radius * 1.9, cy - 10); ctx.stroke();
  ctx.restore();
}

export function paintSteam(ctx, cx, cy, t, strength) {
  ctx.save();
  ctx.globalAlpha = 0.35 * strength;
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 5; i++) {
    const phase = t * 1.6 + i * 1.3;
    const rise = (phase % 2) * 42;
    const sway = Math.sin(phase * 2.1 + i) * 9;
    ctx.beginPath();
    ctx.arc(cx + sway + (i - 2) * 11, cy - 14 - rise, 7 - rise * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---- ticket paper --------------------------------------------------------------
export function paintTicket(ctx, x, y, w, h, dish, timeFrac, urgent) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 12; ctx.shadowOffsetY = 5;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = urgent ? "#ffe1d6" : "#fdf6e3";
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "rgba(120,90,50,0.35)";
  ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
  roundRect(ctx, x + 5, y + 5, w - 10, h - 10, 6); ctx.stroke();
  ctx.setLineDash([]);
  // pin
  ctx.fillStyle = urgent ? "#ff5d4e" : "#c9a24d";
  ctx.beginPath(); ctx.arc(x + w / 2, y + 2, 6, 0, Math.PI * 2); ctx.fill();
  ctx.font = "700 17px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#3a2c1c";
  ctx.fillText(dish.name, x + w / 2, y + 34);
  let iy = y + 58;
  ctx.font = "500 13px system-ui, sans-serif";
  ctx.textAlign = "left";
  for (const comp of dish.components) {
    drawFoodIcon(ctx, comp, "raw", x + 24, iy - 4, 9);
    ctx.fillStyle = "#4c3a26";
    ctx.fillText(INGREDIENTS[comp].label, x + 40, iy);
    iy += 22;
  }
  // timer bar along the ticket foot
  const bx = x + 10, by = y + h - 14, bw = w - 20;
  ctx.fillStyle = "rgba(60,40,20,0.2)";
  roundRect(ctx, bx, by, bw, 8, 4); ctx.fill();
  const frac = Math.max(0, Math.min(1, timeFrac));
  const tg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
  tg.addColorStop(0, frac > 0.4 ? "#5fbf60" : "#ff8a4e");
  tg.addColorStop(1, frac > 0.4 ? "#2f8f3a" : "#e04a2f");
  ctx.fillStyle = tg;
  roundRect(ctx, bx, by, Math.max(6, bw * frac), 8, 4); ctx.fill();
}
