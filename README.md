# MCBot

A simple Minecraft Bot with an Autoclicker.  

Perfect for Mobfarms, easy to use.  
Type the Username of the bot in chat to get help.

## Setup
### Create options.js
```
module.exports = {
    host: 'mcusw.de',
    port: 25565,
    auth: 'microsoft',
    username: 'e-mail',
    password: 'password',
  };
```

### Create whitelist.json  
Use "Server" to issue commands from the Server Console
```
["Username1", "Username2"]
```

### Install Packages
```
npm i
```

### Run the Bot
```
node bot.js
```
