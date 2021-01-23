Telegram Expense Tracking Bot
=============================

This Bot can track expenses privately for you or for a group chat, e.g. in a household Telegram group.
Messages like "12€ Reichelt" or "Bakery 4,12€" will be interpreted and added to a per-chat database.

Usage
-----

### Adding expenses
Type a message containing "xx€", "xx,xx€" or "xx.xx€" to let the Bot add an expense.
The rest of the message will be interpreted as an expense comment.

*Hint*: The currency symbol can be changed in `index.js`.

### Showing last expenses
Type `/last` to show the 10 most recent expenses.
Append a number to show more entries (e.g. `/last 50`).

### Viewing total expenses
Type `/total` to see the accumulated expenses for all participating users.
The Bot will count all expenses since the counter has been reset.

### Reset total expenses counter
Type `/total_reset` to reset the total expense counter.
This will cause `/total` to only accumulate expenses that will be added from now on.

### Show general info
Type `/info` to see when the total expense counter was reset and how many expense records are in the Bot's database.

Installation
------------

* Clone this repository.
* Create a file `.env` with the following content:
  ```shell
  BOT_TOKEN="1103391776:AAHjr4aiRqtOrlYqqCPlOy8tNZvXDdJbsRg"
  ```
  Replace the `BOT_TOKEN` content with a Bot Token given to you by the [BotFather](https://t.me/BotFather).
* Run the Bot with NodeJS
    * Install NodeJS 15.6+ and NPM.
    * `npm install`
    * `npm start`
* Run the Bot with Docker
    * Install Docker 19.03.0+ with Docker Compose.
    * `docker-compose up`
