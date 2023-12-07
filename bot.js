const fs = require('fs');
const path = require('path');
const mineflayer = require('mineflayer');
const options = require('./options');

const filePath = 'whitelist.json'
let isItemActivated = false; // Flag to track item activation state
let intervalDelay = 2000; // Initial interval delay in milliseconds
let intervalId; // Variable to store the interval ID
const whitelist = new Set();
loadWhitelistFromFile();
const bot = mineflayer.createBot(options);

bot.on('chat', (username, message) => {
  if (username === bot.username) return;
  if (!whitelist.has(username)){
    bot.chat(`You are not Whitelisted $(username)!`);
    return
  }
  let command = message.split(" ");

  if (command[0] === bot.username) {
    bot.chat("This message was for me!");

    // Check for the command to toggle item activation
    if (command[1] === "toggleItemActivation") {
      isItemActivated = !isItemActivated; // Toggle the state

      if (isItemActivated) {
        bot.chat("Item activation is now ON.");
        resetInterval(); // Start the interval when the autoclicker is turned on
      } else {
        bot.chat("Item activation is now OFF.");
        clearInterval(intervalId); // Clear the interval when the autoclicker is turned off
        // Add your logic to deactivate the item here
      }
    } else if (command[1] === "setInterval") {
      const newDelay = parseInt(command[2]);
      intervalDelay = !isNaN(newDelay) ? newDelay : intervalDelay;
      bot.chat(`Interval delay set to ${intervalDelay} milliseconds.`);
      if (isItemActivated) resetInterval(); // Restart the interval with the new delay if the autoclicker is on
    } else if (command[1] === "status") {
      displayBotStatus(); // Call the function to display the bot status
    } else if (command[1] === "moveto" && command.length === 7) {
      const x = parseFloat(command[2]);
      const y = parseFloat(command[3]);
      const z = parseFloat(command[4]);
      const yaw = parseFloat(command[5]);
      const pitch = parseFloat(command[6]);
      if (!isNaN(x) && !isNaN(y) && !isNaN(z) && !isNaN(yaw) && !isNaN(pitch)) {
        moveToCoordinates(x, y, z, yaw, pitch);
      } else {
        bot.chat("Invalid coordinates or angles provided.");
      }
    } else if (command[1] === "whitelist" && command.length === 4) {
      handleWhitelistCommand(username, command[2], command[3]);
    }else{
      bot.chat("Invalid command.");
    }
  }
});

function handleWhitelistCommand(requester, action, player) {
  if (action === "add") {
    whitelist.add(player);
    saveWhitelistToFile();
    bot.chat(`Player ${player} has been added to the whitelist by ${requester}.`);
  } else if (action === "remove") {
    whitelist.delete(player);
    saveWhitelistToFile();
    bot.chat(`Player ${player} has been removed from the whitelist by ${requester}.`);
  } else {
    bot.chat("Invalid whitelist action. Use 'add' or 'remove'.");
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

bot.on('health', () => {
  const foodLevel = bot.food;

  // Check if the bot needs to eat
  if (foodLevel < 20) {
    bot.chat("Low on food. Eating...");
    // Add your logic to eat here
    bot.equip(bot.inventory.itemsByName['bread'], 'hand');
    bot.activateItem();
  }
});

bot.once('spawn', () => {
  // Customize the behavior here
});

function activateSpecificItem(itemName) {
  const targetItem = bot.inventory.items().find((item) => item.name === itemName);
  if (targetItem) {
    // Select the item
    bot.equip(targetItem, 'hand', () => {
      // Activate the item once it's equipped
      bot.activateItem();
    });
  } else {
    bot.chat(`I need this Item: ${itemName}`);
  }
}

function resetInterval() {
  // Clear the existing interval and start a new one with the updated delay
  clearInterval(intervalId);
  intervalId = setInterval(() => {
    // Execute action based on the updated interval delay
    if (isItemActivated) {
      activateSpecificItem('minecraft:diamond_sword');
    }
  }, intervalDelay);
}

function displayBotStatus() {
  bot.chat(`Current Status:\nHealth - ${bot.health}\nFood - ${bot.food}\nItem Activation - ${isItemActivated ? 'ON' : 'OFF'}`);
}

function moveToCoordinates(x, y, z, yaw, pitch) {
  bot.chat(`Moving to coordinates: X=${x}, Y=${y}, Z=${z}, Yaw=${yaw}, Pitch=${pitch}`);

  // Set the bot's yaw and pitch
  bot.look(yaw, pitch, true);

  // Add your logic to move the bot to the specified coordinates
  // For example, you can use bot.pathfinder to navigate to the target location.
  bot.pathfinder.setMovements(require('mineflayer-pathfinder').Movements(bot));
  const goal = new mineflayer.pathfinder.goals.GoalNear(x, y, z, 1); // adjust the threshold as needed
  bot.pathfinder.setGoal(goal);
}


bot.on('kicked', console.log);
bot.on('error', console.log);
