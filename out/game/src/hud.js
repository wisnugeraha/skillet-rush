// Skillet Rush — heads-up display: score strip, lives, streak, rush banner,
// floating score popups and the service-pass plate with its SERVE button.
import { CANVAS_W, PASS, PLATE_CENTER } from "./config.js";
import { roundRect, drawFoodIcon, label } from "./art.js";

export const SERVE_BTN = { x: PASS.x + 38, y: PASS.y + 212, w: 220, h: 54 };

export function drawStatus(ctx, world) {
  // score strip under the order rail
  ctx.font = "800 30px Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffd98a";
  ctx.fillText(`$${world.score}`, 26, 44);
  ctx.font = "600 15px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,230,190,0.75)";
  ctx.fillText(`served ${world.book.serves}`, 26, 66);
  // lives as little skillets, top-right
  for (let i = 0; i < 3; i++) {
    const cx = CANVAS_W - 40 - i * 44;
    ctx.globalAlpha = i < world.lives ? 1 : 0.22;
    ctx.fillStyle = "#20272e";
    ctx.beginPath(); ctx.arc(cx, 40, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#59646e";
    ctx.beginPath(); ctx.arc(cx, 38, 12, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#20272e"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx + 13, 38); ctx.lineTo(cx + 26, 34); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (world.streak >= 2) {
    ctx.font = "800 20px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillStyle = "#ff9d5c";
    ctx.fillText(`x${world.streak} streak`, CANVAS_W - 180, 46);
  }
  if (world.book.rush.active) {
    const pulse = 0.75 + 0.25 * Math.sin(world.time * 6);
    roundRect(ctx, CANVAS_W / 2 - 150, 96, 300, 40, 10);
    ctx.fillStyle = `rgba(214,58,40,${0.85 * pulse})`;
    ctx.fill();
    ctx.font = "800 22px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff3d6";
    ctx.fillText(`LUNCH RUSH  x2  ${Math.ceil(world.book.rush.timer)}s`, CANVAS_W / 2, 123);
  }
}

export function drawPlate(ctx, world) {
  const { cx, cy } = PLATE_CENTER;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
  ctx.fillStyle = "#f4efe4";
  ctx.beginPath(); ctx.arc(cx, cy, 74, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "#d8cfbc"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, 60, 0, Math.PI * 2); ctx.stroke();
  const n = world.plate.length;
  world.plate.forEach((comp, i) => {
    const ang = (i / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2;
    const r = n === 1 ? 0 : 30;
    drawFoodIcon(ctx, comp.kind, "done", cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, 17);
  });
  if (n === 0) label(ctx, "empty plate", cx, cy + 6);
  // SERVE button lights when the plate carries anything
  const hot = n > 0;
  roundRect(ctx, SERVE_BTN.x, SERVE_BTN.y, SERVE_BTN.w, SERVE_BTN.h, 12);
  const g = ctx.createLinearGradient(0, SERVE_BTN.y, 0, SERVE_BTN.y + SERVE_BTN.h);
  g.addColorStop(0, hot ? "#4fae57" : "#3a4a3d");
  g.addColorStop(1, hot ? "#2f7f3a" : "#2c362e");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = hot ? "#9fe6a4" : "#465448"; ctx.lineWidth = 2; ctx.stroke();
  ctx.font = "800 22px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillStyle = hot ? "#f2fff0" : "rgba(220,230,220,0.4)";
  ctx.fillText("SERVE  [Enter]", SERVE_BTN.x + SERVE_BTN.w / 2, SERVE_BTN.y + 35);
}

export function spawnPopup(popups, text, x, y, color) {
  popups.push({ text, x, y, ttl: 1.6, color: color || "#ffd98a" });
}

export function drawPopups(ctx, popups, dt) {
  for (const p of [...popups]) {
    p.ttl -= dt;
    p.y -= 34 * dt;
    if (p.ttl <= 0) { popups.splice(popups.indexOf(p), 1); continue; }
    ctx.globalAlpha = Math.min(1, p.ttl / 0.6);
    ctx.font = "800 24px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y);
    ctx.globalAlpha = 1;
  }
}
