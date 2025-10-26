#!/usr/bin/env node


import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";

const API = "https://pokeapi.co/api/v2";
const HP_START = 300;


const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const toTitle = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Progres du HP
function hpBar(current, total) {
  const width = 22;
  const filled = Math.round((current / total) * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  return `[${bar}] ${clamp(current, 0, total)}/${total}`;
}


const cache = new Map();
async function getJSON(url) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const data = await res.json();
  cache.set(url, data);
  return data;
}


async function getPokemon(nameOrId) {
  const data = await getJSON(`${API}/pokemon/${String(nameOrId).toLowerCase()}`);
  return {
    id: data.id,
    name: data.name,
    moves: data.moves
      ?.map((m) => ({ name: m.move.name, url: m.move.url }))
      ?? []
  };
}


async function getMove(moveUrlOrName) {
  const url = moveUrlOrName.startsWith("http")
    ? moveUrlOrName
    : `${API}/move/${moveUrlOrName}`;
  const m = await getJSON(url);
  return {
    id: m.id,
    name: m.name,
    accuracy: m.accuracy ?? 100,    
    power: m.power ?? 0,              
    pp: m.pp ?? 99,
    type: m.type?.name ?? "unknown",
    damage_class: m.damage_class?.name ?? "status"
  };
}


async function pickCandidateMoves(pokemon, limitList = 30) {
  const subset = pokemon.moves.slice(0, limitList);
  const details = [];
  for (const mv of subset) {
    try {
      const d = await getMove(mv.url);
      if (d.power > 0 && d.damage_class !== "status") details.push(d);
    } catch {
    }
  }
  details.sort((a, b) => (b.power || 0) - (a.power || 0));
  const seen = new Set();
  const unique = [];
  for (const d of details) {
    if (!seen.has(d.name)) {
      seen.add(d.name);
      unique.push(d);
    }
  }
  return unique;
}

// Random Pokémon 
async function randomPokemon() {
  const id = randInt(1, 151);
  return getPokemon(id);
}


function computeDamage(move) {
  const variance = randInt(85, 100) / 100;
  const raw = Math.round((move.power || 0) * variance);
  return Math.max(10, raw);
}


async function doTurn(attacker, defender, move) {
  const hitRoll = randInt(1, 100);
  const acc = move.accuracy ?? 100;

  console.log(`\n${toTitle(attacker.name)} uses ${toTitle(move.name)}! (Pow ${move.power}, Acc ${acc}%)`);
  await sleep(400);

  if (hitRoll > acc) {
    console.log("→ The attack missed!");
    return { hit: false, dmg: 0 };
  }
  const dmg = computeDamage(move);
  defender.hp = clamp(defender.hp - dmg, 0, HP_START);
  console.log(`→ It hits for ${dmg} damage.`);
  return { hit: true, dmg };
}

function printStatus(p, b) {
  console.log(`\n=== Status ================================`);
  console.log(`${toTitle(p.name)}  HP ${hpBar(p.hp, HP_START)}`);
  console.log(`${toTitle(b.name)}  HP ${hpBar(b.hp, HP_START)}`);
  console.log(`==========================================`);
}

async function chooseFromList(rl, prompt, items, formatter) {
  for (let i = 0; i < items.length; i++) {
    console.log(`${String(i + 1).padStart(2, " ")}. ${formatter(items[i])}`);
  }
  let idx;
  while (true) {
    const ans = await rl.question(`${prompt} (1-${items.length}): `);
    idx = Number(ans);
    if (Number.isInteger(idx) && idx >= 1 && idx <= items.length) break;
    console.log("Please enter a valid number.");
  }
  return items[idx - 1];
}

async function interactive() {
  const rl = readline.createInterface({ input, output });

  try {
    const cliPokemon =
      process.argv.includes("--pokemon")
        ? process.argv[process.argv.indexOf("--pokemon") + 1]
        : null;

    let playerPoke;
    while (true) {
      const name = cliPokemon ?? (await rl.question("Choose your Pokémon (e.g., pikachu, charizard): "));
      try {
        playerPoke = await getPokemon(name.trim());
        break;
      } catch {
        if (cliPokemon) throw new Error(`Could not load Pokémon "${cliPokemon}"`);
        console.log("Hmm, couldn't find that Pokémon. Try another name/id.");
      }
    }
    console.log(`\nLoading moves for ${toTitle(playerPoke.name)}...`);
    const candidates = await pickCandidateMoves(playerPoke, 60);
    if (candidates.length < 5) {
      throw new Error(`Not enough usable moves found for ${playerPoke.name}. Try another Pokémon.`);
    }
    const show = candidates.slice(0, 12);
    console.log(`\nPick 5 moves from the list below (strongest shown first):`);
    const fmt = (m) => `${toTitle(m.name)}  —  Type: ${toTitle(m.type)}  Pow:${m.power}  Acc:${m.accuracy}%`;

    const selected = [];
    const available = [...show];
    for (let i = 0; i < 5; i++) {
      const choice = await chooseFromList(rl, `Select move #${i + 1}`, available, fmt);
      selected.push(choice);
      const idx = available.indexOf(choice);
      available.splice(idx, 1);
    }
    console.log("\nChoosing a bot opponent...");
    const botPoke = await randomPokemon();
    const botMoves = (await pickCandidateMoves(botPoke, 60)).slice(0, 10);
    
    while (botMoves.length < 5) {
      const more = await pickCandidateMoves(await randomPokemon(), 60);
      botMoves.push(...more.slice(0, 10));
    }
    const botSelected = [];
    const pool = [...botMoves];
    while (botSelected.length < 5 && pool.length) {
      const i = randInt(0, pool.length - 1);
      const mv = pool.splice(i, 1)[0];
      if (!botSelected.find((m) => m.name === mv.name)) botSelected.push(mv);
    }
    if (botSelected.length < 5) botSelected.push(...botMoves.slice(0, 5 - botSelected.length));
    const player = { name: playerPoke.name, hp: HP_START, moves: selected };
    const bot = { name: botPoke.name, hp: HP_START, moves: botSelected };

    console.log(`\nYour Pokémon: ${toTitle(player.name)}`);
    console.log("Your moves:");
    player.moves.forEach((m, i) =>
      console.log(`  ${i + 1}. ${toTitle(m.name)} (Pow ${m.power}, Acc ${m.accuracy}%)`)
    );
    console.log(`\nOpponent: ${toTitle(bot.name)}`);
    console.log("Bot moves (hidden… but shown here for transparency):");
    bot.moves.forEach((m, i) =>
      console.log(`  ${i + 1}. ${toTitle(m.name)} (Pow ${m.power}, Acc ${m.accuracy}%)`)
    );

    await sleep(600);
    printStatus(player, bot);
    let turn = 1;
    while (player.hp > 0 && bot.hp > 0) {
      console.log(`\n===== Turn ${turn} =====`);
      const move = await chooseFromList(
        rl,
        "Choose your move",
        player.moves,
        (m) => `${toTitle(m.name)} (Pow ${m.power}, Acc ${m.accuracy}%)`
      );
      await doTurn(player, bot, move);
      printStatus(player, bot);
      if (bot.hp <= 0) break;

      await sleep(400);
      const botMove = bot.moves[randInt(0, bot.moves.length - 1)];
      await doTurn(bot, player, botMove);
      printStatus(player, bot);

      turn++;
      await sleep(400);
    }
    console.log("\n===== Result =====");
    if (player.hp <= 0 && bot.hp <= 0) {
      console.log("It's a draw! Both fainted!");
    } else if (player.hp <= 0) {
      console.log(`You lose… ${toTitle(bot.name)} wins.`);
    } else {
      console.log(`You win! ${toTitle(player.name)} triumphs!`);
    }
  } catch (err) {
    console.error("\nError:", err.message);
    process.exitCode = 1;
  } finally {
    rl?.close?.();
  }
}
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  interactive();
}