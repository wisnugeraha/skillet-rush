// Skillet Rush — boot, input and the frame loop. Owns the world state, routes
// clicks and keys to the stations, and paints every screen: title, service,
// game over, and the deterministic shot stages used for the entry screenshots.
import { CANVAS_W, CANVAS_H, BOARD, STOVE, PASS, PAN_SLOTS, INGREDIENTS,
  CHOP_GREEN, SEAR_WINDOW, TICK_DT, START_LIVES } from "./config.js";
import * as art from "./art.js";
import * as audio from "./audio.js";
import { OrderBook, mulberry32 } from "./orders.js";
import { PrepBlock, Pan } from "./stations.js";
import { drawStatus, drawPlate, spawnPopup, drawPopups, SERVE_BTN } from "./hud.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const params = new URLSearchParams(location.search);

function freshWorld(rng) {
  return {
    rng,
    book: new OrderBook(rng),
    block: new PrepBlock(),
    pans: PAN_SLOTS.map((_, i) => new Pan(i)),
    plate: [],
    carried: null,
    score: 0,
    lives: START_LIVES,
    streak: 0,
    time: 0,
    popups: [],
    mouse: { x: 0, y: 0 },
    mode: "title",
  };
}

let world = freshWorld(mulberry32(Date.now() & 0xffffffff));

// ---- interactions -----------------------------------------------------------
function hitRect(x, y, r) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }
function hitPan(x, y, slot) { return Math.hypot(x - slot.cx, y - slot.cy) < 64; }

function onCrate(rect) {
  world.carried = { kind: rect.kind, state: "raw", quality: 1 };
  audio.coin();
}

function onBlock() {
  if (world.block.busy) {
    const res = world.block.strike();
    if (res.ok) {
      world.carried = { kind: res.kind, state: "cut", quality: res.quality };
      audio.chop(res.quality);
      if (res.perfect) spawnPopup(world.popups, "PERFECT CUT +" + res.bonus, BOARD.x + BOARD.w / 2, BOARD.y + 120, "#9fe6a4");
    } else {
      world.streak = 0;
      audio.buzz();
      spawnPopup(world.popups, "missed the cut", BOARD.x + BOARD.w / 2, BOARD.y + 120, "#ff8a7a");
    }
    return;
  }
  if (world.carried && world.block.accept(world.carried)) world.carried = null;
}

function onPan(pan) {
  if (pan.busy) {
    const res = pan.lift();
    if (res.state === "done") {
      world.carried = { kind: res.kind, state: "done", quality: res.quality };
      audio.ding(world.streak);
    } else if (res.state === "burnt") {
      world.streak = 0;
      audio.buzz();
      spawnPopup(world.popups, "burnt!", PAN_SLOTS[pan.slot].cx, PAN_SLOTS[pan.slot].cy - 60, "#ff8a7a");
    } else {
      spawnPopup(world.popups, "still raw", PAN_SLOTS[pan.slot].cx, PAN_SLOTS[pan.slot].cy - 60, "#ffd98a");
    }
    return;
  }
  if (world.carried && pan.accept(world.carried)) world.carried = null;
}

function onPass() {
  if (world.carried && world.carried.state === "done") {
    world.plate.push(world.carried);
    world.carried = null;
    audio.coin();
  }
}

function serve() {
  if (!world.plate.length) return;
  const kinds = world.plate.map((c) => c.kind);
  const avgQ = world.plate.reduce((s, c) => s + (c.quality || 1), 0) / world.plate.length;
  const match = world.book.matchPlate(kinds);
  const px = PASS.x + PASS.w / 2, py = PASS.y + 150;
  if (match && match.ticket) {
    let pts = world.book.scoreFor(match.ticket, avgQ, match.ticket.timeLeft / match.ticket.totalTime);
    world.streak += 1;
    pts += Math.round(pts * 0.1 * (world.streak - 1));
    world.score += pts;
    world.book.markServed(match.ticket);
    audio.ding(world.streak);
    spawnPopup(world.popups, `+$${pts} ${match.ticket.dish.name}`, px, py, "#9fe6a4");
  } else if (match && match.creation) {
    const pts = Math.round(match.creation * avgQ);
    world.score += pts;
    audio.coin();
    spawnPopup(world.popups, `chef's creation +$${pts}`, px, py, "#ffd98a");
  } else {
    world.streak = 0;
    audio.buzz();
    spawnPopup(world.popups, "nobody ordered that", px, py, "#ff8a7a");
  }
  world.plate = [];
}

canvas.addEventListener("mousemove", (e) => {
  const b = canvas.getBoundingClientRect();
  world.mouse.x = (e.clientX - b.left) * (CANVAS_W / b.width);
  world.mouse.y = (e.clientY - b.top) * (CANVAS_H / b.height);
});

canvas.addEventListener("mousedown", (e) => {
  audio.unlock();
  if (world.mode === "title") { startService(); return; }
  if (world.mode === "over") { restart(); return; }
  const b = canvas.getBoundingClientRect();
  const x = (e.clientX - b.left) * (CANVAS_W / b.width);
  const y = (e.clientY - b.top) * (CANVAS_H / b.height);
  for (const rect of art.crateRects()) {
    if (hitRect(x, y, rect)) { onCrate(rect); return; }
  }
  if (hitRect(x, y, BOARD)) { onBlock(); return; }
  for (let i = 0; i < PAN_SLOTS.length; i++) {
    if (hitPan(x, y, PAN_SLOTS[i])) { onPan(world.pans[i]); return; }
  }
  if (hitRect(x, y, SERVE_BTN)) { serve(); return; }
  if (hitRect(x, y, PASS)) { onPass(); return; }
});

window.addEventListener("keydown", (e) => {
  audio.unlock();
  if (e.code === "Space") {
    e.preventDefault();
    if (world.mode !== "play") return;
    if (world.block.busy) onBlock();
    else {
      const pan = world.pans.find((p) => p.busy);
      if (pan) onPan(pan);
    }
  } else if (e.code === "Enter") {
    if (world.mode === "title") startService();
    else if (world.mode === "over") restart();
    else serve();
  } else if (e.code === "KeyR" && world.mode === "over") restart();
});

function startService() {
  world.mode = "play";
  world.book.spawnTicket();
}

function restart() {
  world = freshWorld(mulberry32((Date.now() & 0xffffffff) + 7));
  startService();
}

// ---- simulation ---------------------------------------------------------------
function step(dt) {
  world.time += dt;
  if (world.mode !== "play") return;
  const events = [];
  world.book.tick(dt, events);
  world.block.tick(dt);
  for (const pan of world.pans) pan.tick(dt);
  for (const ev of events) {
    if (ev.type === "expired") {
      world.lives -= 1;
      world.streak = 0;
      audio.buzz();
      spawnPopup(world.popups, "order walked out", CANVAS_W / 2, 120, "#ff8a7a");
      if (world.lives <= 0) world.mode = "over";
    }
  }
  audio.sizzle(world.pans.some((p) => p.busy && !p.ruined));
}

// ---- painting -------------------------------------------------------------------
function paintMeters(ctx) {
  if (world.block.busy) {
    art.drawFoodIcon(ctx, world.block.item.kind, "raw", BOARD.x + BOARD.w / 2, BOARD.y + 168, 26);
    const mx = BOARD.x + 42, mw = BOARD.w - 84, my = BOARD.y + 252;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    art.roundRect(ctx, mx, my, mw, 14, 7); ctx.fill();
    const gc = 0.5, gw = CHOP_GREEN;
    ctx.fillStyle = "rgba(95,191,96,0.85)";
    art.roundRect(ctx, mx + mw * (gc - gw / 2), my, mw * gw, 14, 6); ctx.fill();
    ctx.fillStyle = "#fff3d6";
    ctx.fillRect(mx + mw * world.block.phase - 2, my - 4, 4, 22);
  }
  for (const pan of world.pans) {
    const slot = PAN_SLOTS[pan.slot];
    if (!pan.busy) continue;
    art.drawFoodIcon(ctx, pan.item.kind, pan.progress() > 1 ? "burnt" : "cooking", slot.cx, slot.cy, 24);
    art.paintSteam(ctx, slot.cx, slot.cy - 26, world.time, pan.progress() > 0.4 ? 1 : 0.4);
    const mw = 130, mx = slot.cx - mw / 2, my = slot.cy + 56;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    art.roundRect(ctx, mx, my, mw, 12, 6); ctx.fill();
    ctx.fillStyle = "rgba(255,196,80,0.85)";
    art.roundRect(ctx, mx + mw * ((1 - SEAR_WINDOW) / 1.4), my, mw * (SEAR_WINDOW / 1.4), 12, 5); ctx.fill();
    const p = pan.progress() / 1.4;
    ctx.fillStyle = pan.progress() > 1 ? "#ff6a4e" : "#fff3d6";
    ctx.fillRect(mx + mw * p - 2, my - 3, 4, 18);
  }
}

function paintTickets(ctx) {
  const n = world.book.tickets.length;
  const w = 172, gap = 12;
  const startX = (CANVAS_W - (n * w + (n - 1) * gap)) / 2;
  world.book.tickets.forEach((t, i) => {
    const frac = t.timeLeft / t.totalTime;
    art.paintTicket(ctx, startX + i * (w + gap), 14, w, 122, t.dish, frac, frac < 0.3);
  });
}

function paintTitle(ctx) {
  ctx.fillStyle = "rgba(10,7,5,0.72)";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.font = "900 74px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffd98a";
  ctx.fillText("SKILLET RUSH", CANVAS_W / 2, 300);
  ctx.font = "500 24px system-ui, sans-serif";
  ctx.fillStyle = "#ffe9c4";
  ctx.fillText("a short-order kitchen game", CANVAS_W / 2, 342);
  ctx.font = "600 20px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,233,196,0.85)";
  ctx.fillText("click an ingredient, then its station", CANVAS_W / 2, 430);
  ctx.fillText("SPACE chops and flips in the golden window", CANVAS_W / 2, 462);
  ctx.fillText("build the ticket at the pass, ENTER serves", CANVAS_W / 2, 494);
  ctx.font = "800 26px Georgia, serif";
  ctx.fillStyle = "#9fe6a4";
  ctx.fillText("click to open the diner", CANVAS_W / 2, 560);
}

function paintGameOver(ctx) {
  ctx.fillStyle = "rgba(10,7,5,0.78)";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.font = "900 64px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ff8a7a";
  ctx.fillText("LAST ORDER SERVED", CANVAS_W / 2, 320);
  ctx.font = "800 34px Georgia, serif";
  ctx.fillStyle = "#ffd98a";
  ctx.fillText(`$${world.score}  ·  ${world.book.serves} dishes out`, CANVAS_W / 2, 380);
  ctx.font = "600 22px system-ui, sans-serif";
  ctx.fillStyle = "#ffe9c4";
  ctx.fillText("click or press R for another shift", CANVAS_W / 2, 440);
}

function render(dt) {
  art.paintKitchen(ctx);
  art.paintBoardHousing(ctx);
  art.paintStoveHousing(ctx);
  art.paintPassHousing(ctx);
  for (const rect of art.crateRects()) {
    const hot = world.carried && world.carried.state === "raw" && rect.kind === world.carried.kind;
    art.paintCrate(ctx, rect, hot);
  }
  paintTickets(ctx);
  paintMeters(ctx);
  drawPlate(ctx, world);
  drawStatus(ctx, world);
  drawPopups(ctx, world.popups, dt);
  if (world.carried) {
    art.drawFoodIcon(ctx, world.carried.kind, world.carried.state === "done" ? "done" : world.carried.state === "cut" ? "cut" : "raw", world.mouse.x + 14, world.mouse.y - 10, 20);
  }
  if (world.mode === "title") paintTitle(ctx);
  if (world.mode === "over") paintGameOver(ctx);
}

// ---- shot stages for the entry screenshots -----------------------------------------
function stageShot(name) {
  world = freshWorld(mulberry32(Number(params.get("seed")) || 1));
  if (name === "title") { render(0); return; }
  startService();
  const book = world.book;
  if (name === "play") {
    book.tickets[0].dish = book.tickets[0].dish;
    book.spawnTicket();
    book.tickets[0].timeLeft = book.tickets[0].totalTime * 0.35;
    book.tickets[1].timeLeft = book.tickets[1].totalTime * 0.8;
    world.block.accept({ kind: "tomato" });
    world.block.phase = 0.5;
    world.pans[0].accept({ kind: "beef" });
    world.pans[0].elapsed = 4.9;
    world.plate.push({ kind: "onion", state: "done", quality: 0.9 });
    world.score = 460;
    world.streak = 3;
    for (let i = 0; i < 24; i++) step(TICK_DT);
  } else if (name === "pass") {
    book.spawnTicket();
    book.tickets[0].dish = { name: "Diner Burger", price: 120, components: ["beef", "tomato", "onion"] };
    book.tickets[0].timeLeft = book.tickets[0].totalTime * 0.6;
    world.plate.push({ kind: "beef", state: "done", quality: 0.95 });
    world.plate.push({ kind: "tomato", state: "done", quality: 0.9 });
    world.plate.push({ kind: "onion", state: "done", quality: 0.85 });
    world.score = 780;
    world.streak = 5;
    spawnPopup(world.popups, "+$198 Diner Burger", PASS.x + PASS.w / 2, PASS.y + 150, "#9fe6a4");
    for (let i = 0; i < 10; i++) step(TICK_DT);
  } else if (name === "rush") {
    book.rush.active = true;
    book.rush.timer = 17;
    while (book.tickets.length < 4) book.spawnTicket();
    book.tickets[0].timeLeft = book.tickets[0].totalTime * 0.28;
    world.block.accept({ kind: "chili" });
    world.block.phase = 0.52;
    world.pans[1].accept({ kind: "noodle" });
    world.pans[1].elapsed = 4.2;
    world.plate.push({ kind: "egg", state: "done", quality: 0.9 });
    world.score = 1240;
    world.streak = 7;
    for (let i = 0; i < 30; i++) step(TICK_DT);
  }
  render(0);
}

if (params.get("shot")) {
  stageShot(params.get("shot"));
  window.__shotDone = true;
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt);
    render(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
