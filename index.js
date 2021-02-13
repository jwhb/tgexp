require('dotenv').config();

const
  { Telegraf } = require('telegraf'),
  LocalSession = require('telegraf-session-local'),
  commandParts = require('telegraf-command-parts'),
  dayjs = require('dayjs'),
  table = require('markdown-table')

dayjs.extend(require('dayjs/plugin/localizedFormat'))

const datadir = (process.env.DATA_DIR) ? process.env.DATA_DIR : __dirname;

const currency = '€'

// Telegraf Setup
const bot = new Telegraf(process.env.BOT_TOKEN)
const property = 'data'
const localSession = new LocalSession({
  database: datadir + '/data.json',
  format: {
    serialize: (obj) => JSON.stringify(obj),
    deserialize: (str) => JSON.parse(str),
  },
  property: 'session',
  getSessionKey: (ctx) => ctx.chat.id,
  state: { positions: [] }
})
bot.use(localSession.middleware(property))

bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username
})

bot.use(commandParts());

// Telegraf Commands

bot.command('info', (ctx) => {
  let reset_date = getTotalsResetDate(ctx).date_str
  let positions_count = getPositions(ctx).length
  ctx.replyWithMarkdown(`Totals tracking since ${reset_date}.\nObjects in database: ${positions_count}`)
})

bot.command('last', (ctx) => {
  // determine number of items to show
  let recents = 10
  const args = ctx.state.command.splitArgs;
  if (args.length == 1 && args[0] == parseInt(args[0]))
    recents = parseInt(args[0])
  // get n last items
  const positions = getPositions(ctx)
  const last = positions.slice(-recents)

  // render a table
  let msg = `Last ${recents} items:\n`
  msg += '<pre>' + positionsToTable(last) + '</pre>'

  ctx.replyWithHTML(msg)
})

bot.command('reset_total', (ctx) => {
  const timestamp = Math.floor(new Date().getTime() / 1000)
  ctx.data.totals_since = timestamp

  const now = dayjs.unix(timestamp).format('DD.MM.YYYY HH:mm')
  ctx.replyWithMarkdown(`Totals tracking reset on ${now}.`)
})

bot.command('total', (ctx) => {
  // Get total positions since timestamp
  const reset_date = getTotalsResetDate(ctx)
  const positions = getPositions(ctx)
  let totals = {}
  positions.forEach(pos => {
    if (pos.timestamp >= reset_date.timestamp) {
      if (!totals[pos.from_id])
        totals[pos.from_id] = 0.0
      totals[pos.from_id] += parseFloat(pos.price)
    }
  })

  if(Object.keys(totals).length == 0) {
    ctx.replyWithMarkdown(`No entries since ${reset_date.date_str}.`)
  } else {
    // Get user names
    let users = []
    for (const from_id in totals)
      users.push(ctx.getChatMember(from_id))
    Promise.all(users).then(values => {
      // Create Table with totals and user names
      let arrTotals = []
      for (let i in values) {
        let user = values[i].user
        arrTotals.push([user.username, totals[user.id] + currency])
      }
      let msg = `Total expenses since ${reset_date.date_str}:\n`
      msg += arrayTable(['User', 'Total'], arrTotals)
      ctx.replyWithHTML(msg)
    })
  }
})

// Parse normal messages to extract price information
bot.on('text', (ctx, next) => {
  ctx.data.positions = getPositions(ctx)
  let position = readPrice(ctx.message.text);
  if (position.price == null || !position.comment) {
    ctx.replyWithMarkdown(getQuote())
  } else {
    position.from = ctx.message.from.first_name
    position.from_id = ctx.message.from.id
    position.timestamp = ctx.message.date

    ctx.data.positions.push(position)
    ctx.replyWithMarkdown(positionToString(position))
  }
  return next()
})

// Functions

function getPositions(ctx) {
  if(!ctx.data.positions)
    ctx.data.positions = []
  return ctx.data.positions
}

// Get timestamp and formatted date since reset
function getTotalsResetDate(ctx) {
  if (!ctx.data.totals_since)
    ctx.data.totals_since = Math.floor(new Date().getTime() / 1000)
  let timestamp = ctx.data.totals_since || 0
  let reset_date = dayjs.unix(timestamp).format('DD.MM.YYYY HH:mm')
  return { 'timestamp': timestamp, 'date_str': reset_date }
}

// Render markdown table and wrap in HTML
function arrayTable(headings, data) {
  let md_table = table([headings].concat(data), { delimiterStart: false, delimiterEnd: false });
  return '<pre>' + md_table + '</pre>'
}

// Position to Markdown table
function positionsToTable(positions) {
  let arrTable = []
  positions.forEach(pos => arrTable.push([pos.from, pos.price, pos.comment]))
  return arrayTable(['From', 'Price', 'Comment'], arrTable)
}

// Position to string
function positionToString(position) {
  let msg = `💰 ${position.price}${currency}    🏷️ ${position.comment}    👻 ${position.from}`
  return msg
}

// Parse price information from text
function readPrice(text) {
  let re_price = /(\d+([.,]\d{0,2})?)€/
  let price_match = text.match(re_price)
  if (price_match == null) {
    return { price: null, comment: null }
  } else {
    let comment = text.replace(re_price, '').trim()
    let price = price_match[1].replace(',', '.')
    price = parseFloat(price).toFixed(2)
    return { price: price, comment: comment }
  }
}

function getQuote() {
  let quotes = [
    "Oh, it was terrible. They recycled the air on board and it really did a number on my asthma. I-I-e-I asked them to turn up the oxygen and they wouldn't.",
    "I-I've tallied up all the times you've been naughty and deducted the times you've been nice.",
    "A-a-aactually it looks like this year you're gonna owe Santa three hundred and six presents.",
    "Hey, I'm just your naughty-and-nice accountant! Don't blame me for the numbers!",
    "If you cured cancer... and AIDS next week, you would still owe two presents. ",
    "I'm baaack!",
    "Oh Jesus, that flight was terrible. They served a chicken dish with hot sauce and it gave me gas.",
    "Sometimes I sweat from holding the bat for so long and then the heat steams up my glasses.",
    "Don't throw the ball too fast, because I might get startled and I have asthma.",
    "Is it cold out here? I think I need a jacket.",
    "I can't, I can't keep running like this! I have corns in my feet!",
    "Oh Jesus, we're gonna win! I I never won a sport before; this is so exciting."
  ];
  let index = Math.floor(Math.random() * quotes.length);
  return quotes[index];
}

// Start
bot.startPolling()
