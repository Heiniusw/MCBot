const mineflayer = require('mineflayer');
const options = require('./options');

const bot = mineflayer.createBot(options);
let isItemActivated = false; // Flag to track item activation state
let intervalDelay = 2000; // Initial interval delay in milliseconds
let intervalId; // Variable to store the interval ID

bot.on('chat', (username, message) => {
  if (username === bot.username) return;

  bot.chat(message);
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
    }
  }
});

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

bot.on('kicked', console.log);
bot.on('error', console.log);
