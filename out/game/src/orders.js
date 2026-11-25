// Skillet Rush — the order book: ticket spawning, patience timers, rush
// scheduling and plate matching. Pure state + dt in, events out.
import { DISHES, BASE_TICKET_TIME, MIN_TICKET_TIME, RUSH_EVERY_SERVES,
  RUSH_SECONDS, RUSH_SCORE_MULT, CHEF_CREATION_BONUS } from "./config.js";

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class OrderBook {
  constructor(rng) {
    this.rng = rng;
    this.tickets = [];
    this.serves = 0;
    this.spawnGap = 2.2;
    this.rush = { active: false, timer: 0 };
    this.nextId = 1;
  }

  ticketLimit() { return this.rush.active ? 4 : 3; }

  freshMinutes() {
    return Math.max(MIN_TICKET_TIME, BASE_TICKET_TIME - this.serves * 1.2);
  }

  spawnTicket() {
    const dish = DISHES[Math.floor(this.rng() * DISHES.length)];
    const total = this.freshMinutes() * (this.rush.active ? 0.8 : 1);
    const ticket = { id: this.nextId++, dish, timeLeft: total, totalTime: total };
    this.tickets.push(ticket);
    return ticket;
  }

  tick(dt, events) {
    // rush countdown
    if (this.rush.active) {
      this.rush.timer -= dt;
      if (this.rush.timer <= 0) {
        this.rush.active = false;
        events.push({ type: "rush_end" });
      }
    }
    // trickle new tickets in while the rail has room
    this.spawnGap -= dt;
    if (this.spawnGap <= 0 && this.tickets.length < this.ticketLimit()) {
      this.spawnTicket();
      events.push({ type: "spawn" });
      this.spawnGap = (this.rush.active ? 4.5 : 8.5) + this.rng() * 3;
    }
    // patience burns
    for (const t of [...this.tickets]) {
      t.timeLeft -= dt;
      if (t.timeLeft <= 0) {
        this.tickets.splice(this.tickets.indexOf(t), 1);
        events.push({ type: "expired", ticket: t });
      }
    }
  }

  markServed(ticket) {
    const i = this.tickets.indexOf(ticket);
    if (i >= 0) this.tickets.splice(i, 1);
    this.serves += 1;
    if (this.serves % RUSH_EVERY_SERVES === 0 && !this.rush.active) {
      this.rush.active = true;
      this.rush.timer = RUSH_SECONDS;
    }
  }

  // A plate of cooked components vs the rail: exact multiset wins a ticket,
  // three or more unmatched parts still pay as a chef's creation.
  matchPlate(kinds) {
    const sorted = [...kinds].sort().join(",");
    for (const t of this.tickets) {
      if ([...t.dish.components].sort().join(",") === sorted) return { ticket: t };
    }
    if (kinds.length >= 3) return { creation: CHEF_CREATION_BONUS };
    return null;
  }

  scoreFor(ticket, avgQuality, timeFrac) {
    const timeBonus = 0.6 + 0.9 * timeFrac;
    const rushMult = this.rush.active ? RUSH_SCORE_MULT : 1;
    return Math.round(ticket.dish.price * avgQuality * timeBonus * rushMult);
  }
}
