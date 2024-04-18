const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mineflayer = require('mineflayer');
const autoeat = require('mineflayer-auto-eat').plugin
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const Movements = require('mineflayer-pathfinder').Movements
const { GoalNear } = require('mineflayer-pathfinder').goals
const options = require('./options');

// Setup console readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Setup minflayer
const bot = mineflayer.createBot(options);
bot.loadPlugin(autoeat)
bot.loadPlugin(pathfinder);

// Whitelist
const whitelist = new Set();
const filePath = 'whitelist.json'
loadWhitelistFromFile();

// Global Parameters
let isItemActivated = false;
let intervalDelay = 1500;
let intervalId;
let lastHealth = bot.health;
let swordNotFoundTrys = 0;

function saveWhitelistToFile() {
  const whitelistArray = Array.from(whitelist);

  try {
    const data = JSON.stringify(whitelistArray, null, 2);
    fs.writeFileSync(filePath, data, 'utf8');
    console.log('Whitelist saved to file.');
  } catch (error) {
    console.error('Error saving whitelist to file:', error.message);
  }
}

function loadWhitelistFromFile() {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const loadedWhitelist = JSON.parse(data);
    loadedWhitelist.forEach(player => whitelist.add(player));
    console.log('Whitelist loaded from file.');
  } catch (error) {
    console.log('Whitelist file not found. Creating a new one.');
    saveWhitelistToFile()
  }
}

function handleWhitelistCommand(requester, action, player) {
  if (action === "add") {
    whitelist.add(player);
    saveWhitelistToFile();
    log(`Player ${player} has been added to the whitelist by ${requester}.`);
  } else if (action === "remove") {
    whitelist.delete(player);
    saveWhitelistToFile();
    log(`Player ${player} has been removed from the whitelist by ${requester}.`);
  } else {
    log("Invalid whitelist action. Use 'add' or 'remove'.");
  }
}

function activateSpecificItem(itemName) {
  const targetItem = bot.inventory.items().find((item) => item.name === itemName);
  if (targetItem) {
    swordNotFoundTrys = 0;
    bot.equip(targetItem, 'hand');
      const mobFilter = e => e.type === 'hostile';
      const mob = bot.nearestEntity(mobFilter);
      if (!mob) return;
      bot.lookAt(mob.position, true)
      bot.attack(mob);
  } else {
    log(`I need this Item: ${itemName}`);
    swordNotFoundTrys ++;
    if (swordNotFoundTrys > 30){
      bot.quit();
    }
  }
}

function resetInterval() {
  clearInterval(intervalId);
  intervalId = setInterval(() => {
    if (isItemActivated) {
      activateSpecificItem('diamond_sword');
    }
  }, intervalDelay);
}

function moveToCoordinates(x, y, z, yaw, pitch) {
  log(`Moving to coordinates: X=${x}, Y=${y}, Z=${z}, Yaw=${yaw}, Pitch=${pitch}`);

  bot.look(yaw, pitch, true);

  const movements = new Movements(bot);

  bot.pathfinder.setMovements(movements);

  const goal = new GoalNear(x, y, z, 1);
  bot.pathfinder.setGoal(goal);
}

function displayBotStatus() {
  log(`Current Status:\nHealth - ${bot.health}\nFood - ${bot.food}\nAutoClicker - ${isItemActivated ? 'ON' : 'OFF'}\nInterval - ${intervalDelay}`);
}

function printItems() {
  let message = "All Items in Inventory:"
  bot.inventory.items().forEach(item => {
    message += `\n[${item.displayName}] ${item.name} x ${item.count}`;
    if (item.maxDurability !== undefined) {
      let durability = item.metadata.durability
      if (durability == undefined) {
        durability = item.maxDurability;
      }
      message += ` - Durability: ${durability}/${item.maxDurability} (${Math.round(durability / item.maxDurability * 100)} %)`;
    }
  });
  message += "\n----------"
  log(message);
}

function printHelp() {
  log("Commands:\ntoggleac\nsetinterval [ms]\nstatus\nmoveto [x] [y] [z] [yaw] [pitch]\nwhitelist add|remove [username]\nrun [minecraft command]\nitems\nquit\n-----------");
}

function log(message){
  console.log(message);
  bot.chat(message);
}

function handleCommand(command) {
  if (command[0] === "toggleac") {

    isItemActivated = !isItemActivated;

    if (isItemActivated) {
      log(`AutoClicker is now ON (${intervalDelay} ms)`);
      resetInterval();
    } else {
      log("AutoClicker is now OFF");
      clearInterval(intervalId);
    }

  } else if (command[0] === "setinterval") {

    const newDelay = parseInt(command[2]);
    intervalDelay = !isNaN(newDelay) ? newDelay : intervalDelay;
    log(`Interval delay set to ${intervalDelay} ms.`);
    if (isItemActivated) resetInterval();

  } else if (command[0] === "status") {

    displayBotStatus();

  } else if (command[0] === "moveto" && command.length === 7) {

    const x = parseFloat(command[1]);
    const y = parseFloat(command[2]);
    const z = parseFloat(command[3]);
    const yaw = parseFloat(command[4]);
    const pitch = parseFloat(command[5]);
    if (!isNaN(x) && !isNaN(y) && !isNaN(z) && !isNaN(yaw) && !isNaN(pitch)) {
      moveToCoordinates(x, y, z, yaw, pitch);
    } else {
      log("Invalid coordinates or angles provided.");
    }

  } else if (command[0] === "whitelist" && command.length === 4) {

    handleWhitelistCommand(username, command[1], command[2]);

  } else if (command[0] === "run") {

    minecraftCommand = command.slice(2).join(" ");
    bot.chat(`/${minecraftCommand}`)

  } else if (command[0] === "items") {

    printItems();

  } else if (command[0] === "quit") {

    bot.quit();

  } else {

    log("Invalid command");
    printHelp();

  }
}

rl.on('line', (input) => {
  handleCommand(input.trim().split(" "))
});

bot.on('chat', (username, message) => {
  if (username === bot.username) return;
  let command = message.split(" ");

  if (command.shift() != bot.username) {
    return
  }

  console.log('Command recieved: ' + message)

  if (!whitelist.has(username)) {
    log(`You are not Whitelisted ${username}!`);
    return
  }

  handleCommand(command);
});


bot.on('autoeat_error', (error) => {
  log(error.message)
})

bot.on('kicked', console.log);
bot.on('error', console.log);

bot.on('health', () => {
  const healthLevel = bot.health;
  if (lastHealth > healthLevel) {
    log(`I got Damage! ${healthLevel - lastHealth} HP`)
    if (healthLevel < 10 && healthLevel != 0 && lastHealth != 0) {
      log("Low on health. Disconnecting from the server.");
      bot.quit();
    }
  }
  lastHealth = bot.health
});

bot.on('spawn', () => {
  // bot.chat('/server smp')
  let lastHealth = bot.health;
  bot.autoEat.options.startAt = 19
});
