// Skillet Rush — tuning constants, ingredient table and recipe book.
// Every visual and economic number the game uses lives here so balance
// passes touch one file, not six.

export const CANVAS_W = 1280;
export const CANVAS_H = 800;
export const TICK_DT = 1 / 60; // fixed simulation step, deterministic replays

// ---- economy / pressure ---------------------------------------------------
export const START_LIVES = 3;
export const BASE_TICKET_TIME = 46; // seconds a fresh order waits
export const MIN_TICKET_TIME = 19;
export const RUSH_EVERY_SERVES = 5;
export const RUSH_SECONDS = 22;
export const RUSH_SCORE_MULT = 2;
export const CHEF_CREATION_BONUS = 150;
export const PERFECT_CUT_BONUS = 40;
export const BURNT_PENALTY_SCORE = 0; // burnt plates simply fail to match

// ---- station geometry (canvas coords) -------------------------------------
export const RAIL_Y = 148;            // order board bottom edge
export const COUNTER_Y = 648;         // ingredient counter top edge
export const BOARD = { x: 92, y: 258, w: 330, h: 300 };
export const STOVE = { x: 470, y: 258, w: 420, h: 300 };
export const PASS = { x: 936, y: 258, w: 296, h: 300 };
export const PAN_SLOTS = [
  { cx: 575, cy: 400 },
  { cx: 785, cy: 400 },
];
export const PLATE_CENTER = { cx: 1084, cy: 402 };

// ---- ingredients -----------------------------------------------------------
// kind: shape family the art module draws; prep: the move it must make before
// it can join a plate (chop = knife timing, cook = pan timing).
export const INGREDIENTS = {
  tomato: { label: "Tomato", color: "#e8483f", prep: "chop" },
  onion:  { label: "Onion",  color: "#f3d7a4", prep: "chop" },
  chili:  { label: "Chili",  color: "#d51f2c", prep: "chop" },
  egg:    { label: "Egg",    color: "#f7efd8", prep: "chop" },
  beef:   { label: "Beef",   color: "#a34632", prep: "cook" },
  fish:   { label: "Fish",   color: "#f6a08a", prep: "chop" },
  noodle: { label: "Noodle", color: "#f0cf7e", prep: "cook" },
  rice:   { label: "Rice",   color: "#fbf6e8", prep: "cook" },
};
export const CRATE_ORDER = ["tomato", "onion", "chili", "egg", "beef", "fish", "noodle", "rice"];

// ---- recipe book -----------------------------------------------------------
// A dish is a multiset of components; the plate matches a ticket when the
// cooked components equal the recipe, in any order.
export const DISHES = [
  { name: "Diner Burger",  price: 120, components: ["beef", "tomato", "onion"] },
  { name: "Midnight Ramen", price: 140, components: ["noodle", "egg", "chili"] },
  { name: "Seared Sushi",  price: 130, components: ["fish", "rice", "chili"] },
  { name: "Garden Stir-Fry", price: 110, components: ["beef", "tomato", "onion", "chili"] },
  { name: "Sunrise Omelette", price: 100, components: ["egg", "tomato"] },
  { name: "Fire Noodles",  price: 150, components: ["noodle", "chili", "egg"] },
];

// ---- chop / sear timing windows ---------------------------------------------
export const CHOP_CYCLE = 1.35;      // seconds per knife-meter sweep
export const CHOP_GREEN = 0.16;      // fraction of the sweep that scores
export const COOK_SECONDS = 5.2;     // pan time before the window closes
export const SEAR_WINDOW = 0.20;     // share of cook time that is golden
export const BURNT_AFTER = 1.55;     // multiple of COOK_SECONDS before ruin
