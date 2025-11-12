let CARD_POOL = [];
const RARITY_COLORS = {
  common: "#9ca3af",
  rare: "#3b82f6",
  epic: "#8b5cf6",
  legendary: "#fbbf24",
  mythic: "#f02121ff"
};
const PULL_COST = 10;

let gems = JSON.parse(localStorage.getItem("gems") || "100");
let inventory = JSON.parse(localStorage.getItem("inventory") || "{}");

// DOM references
const gemsEl = document.getElementById("gems");
const totalCardsEl = document.getElementById("totalCards");
const recentEl = document.getElementById("recent");
const circleEl = document.querySelector(".summon-circle");
const cardRevealEl = document.getElementById("cardReveal");
const multiRevealEl = document.getElementById("multiReveal");

// Sounds
const soundSummon = new Audio("sounds/summon.mp3");
const soundReveal = new Audio("sounds/reveal.mp3");
const soundRare = new Audio("sounds/rare.mp3");

let pulling = false; // ⛔ prevent double pull actions

// 🧠 Load cards.json dynamically
async function loadCardPool() {
  try {
    const response = await fetch("cards.json");
    if (!response.ok) throw new Error("Failed to load cards.json");
    CARD_POOL = await response.json();
    console.log("Card pool loaded:", CARD_POOL);
  } catch (err) {
    console.error(err);
    alert("Failed to load card data. Check cards.json file.");
  }
}

// 💾 Save & UI refresh
function saveData() {
  localStorage.setItem("gems", JSON.stringify(gems));
  localStorage.setItem("inventory", JSON.stringify(inventory));
}

function updateDashboard() {
  gemsEl.textContent = gems;
  const total = Object.values(inventory).reduce((a, b) => a + b, 0);
  totalCardsEl.textContent = total;
}

// 🎲 Weighted random selector
function weightedRandom(pool) {
  const total = pool.reduce((sum, c) => sum + (c.weight || 1), 0);
  let r = Math.random() * total;
  for (const c of pool) {
    if (r < (c.weight || 1)) return c;
    r -= (c.weight || 1);
  }
  return pool[pool.length - 1]; // fallback
}

// ✨ Summon animation
async function playAnimation() {
  circleEl.classList.add("active");
  soundSummon.play();
  await new Promise((r) => setTimeout(r, 2000));
  circleEl.classList.remove("active");
}

// 🃏 Pull one card
async function pullSingle() {
  if (pulling) return; // prevent double click
  if (CARD_POOL.length === 0) return alert("Card pool not loaded yet!");
  if (gems < PULL_COST) return alert("Not enough gems!");

  pulling = true;
  gems -= PULL_COST;
  saveData(); updateDashboard();

  // clear previous results
  cardRevealEl.innerHTML = "";
  multiRevealEl.innerHTML = "";
  cardRevealEl.classList.add("hidden");
  multiRevealEl.classList.add("hidden");

  await playAnimation();

  const card = weightedRandom(CARD_POOL);
  inventory[card.id] = (inventory[card.id] || 0) + 1;
  saveData(); updateDashboard();

  soundReveal.play();
  if (card.rarity === "legendary") soundRare.play();

  cardRevealEl.innerHTML = `
    <img src="${card.art}" alt="${card.name}" class="${card.rarity}" />
    <p style="color:${RARITY_COLORS[card.rarity]}"><b>${card.name}</b></p>
  `;
  cardRevealEl.classList.remove("hidden");
  cardRevealEl.classList.add("show");

  recentEl.innerHTML = `<p>You got: <b>${card.name}</b> (${card.rarity})</p>`;

  // re-enable pulling after short reveal delay
  setTimeout(() => { pulling = false; }, 1500);
}

// 🎁 Pull 10 cards
async function pullTen() {
  if (pulling) return;
  if (CARD_POOL.length === 0) return alert("Card pool not loaded yet!");
  if (gems < PULL_COST * 10) return alert("Not enough gems!");

  pulling = true;
  gems -= PULL_COST * 10;
  saveData(); updateDashboard();

  // clear previous results
  cardRevealEl.innerHTML = "";
  multiRevealEl.innerHTML = "";
  cardRevealEl.classList.add("hidden");
  multiRevealEl.classList.add("hidden");

  await playAnimation();

  const pulled = [];
  for (let i = 0; i < 10; i++) {
    const card = weightedRandom(CARD_POOL);
    pulled.push(card);
    inventory[card.id] = (inventory[card.id] || 0) + 1;
  }
  saveData(); updateDashboard();

  soundReveal.play();
  multiRevealEl.innerHTML = pulled
    .map(
      (c) =>
        `<div><img src="${c.art}" class="${c.rarity}" title="${c.name} - ${c.rarity}" /></div>`
    )
    .join("");

  multiRevealEl.classList.remove("hidden");
  multiRevealEl.classList.add("show");

  if (pulled.some((c) => c.rarity === "legendary")) soundRare.play();

  recentEl.innerHTML = `<p>You pulled ${pulled.length} cards!</p>`;

  setTimeout(() => { pulling = false; }, 2000);
}

// ⚙️ Dashboard buttons
document.getElementById("pullBtn").addEventListener("click", pullSingle);
document.getElementById("pull10Btn").addEventListener("click", pullTen);
document.getElementById("addGemsBtn").addEventListener("click", () => {
  gems += 50; saveData(); updateDashboard();
});
document.getElementById("resetBtn").addEventListener("click", () => {
  if (confirm("Reset all data?")) {
    localStorage.clear();
    gems = 100; inventory = {};
    updateDashboard(); recentEl.innerHTML = "";
  }
});

// 🚀 Init
loadCardPool().then(updateDashboard);
