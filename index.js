const TelegramBot = require('node-telegram-bot-api');
const BOT_TOKEN = '7095518516:AAHn20SmaopM74R_CcnliJM9I_Qw6sGdwDA';  // Remember to replace this with your actual bot token
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Store for all message data
let messageData = [];

// Parses the drops from the message and uses the username as the client identifier
function parseMessage(message, username) {
    const parts = message.split('-');
    const drops = parseInt(parts[1].trim(), 10);
    return { client: username, drops };
}

// Prepares summary of all messages, grouped by client and drop amounts
function prepareMessageSummary() {
    const summary = {};
    messageData.forEach(({ client, drops }) => {
        if (!summary[client]) {
            summary[client] = {};
        }
        if (summary[client][drops]) {
            summary[client][drops] += 1;
        } else {
            summary[client][drops] = 1;
        }
    });
    return summary;
}

// Calculates total drops
function calculateTotalDrops() {
    return messageData.reduce((total, { drops }) => total + drops, 0);
}

// Command handler for "/sum"
bot.onText(/\/sum/, (msg) => {
    const chatId = msg.chat.id;
    const summary = prepareMessageSummary();
    const totalDrops = calculateTotalDrops();
    let resultText = '';

    // Generate summary text
    for (const [client, dropsInfo] of Object.entries(summary)) {
        for (const [dropAmount, count] of Object.entries(dropsInfo)) {
            resultText += `@${client}   ${dropAmount}*${count}\n`;
        }
    }

    const totalValue = (totalDrops / 2520 * 60).toFixed(2); // Calculate total equivalent value in dollars
    resultText += `total sum: ${totalDrops}\n`;
    resultText += `total price: $${totalValue}\n`;

    bot.sendMessage(chatId, resultText);
    messageData = [];  // Clear the data after sending the summary
});

// Save incoming messages
bot.on('message', (msg) => {
    console.log(msg.text);  // Logging the message text to the console
    if (msg.text && msg.text.includes('-')) {
        let username = 'unknown'; // Default username if not forwarded or username is hidden
        if (msg.from && msg.from.username) {
            username = msg.from.username;
        } else if (msg.forward_from && msg.forward_from.username) {
            username = msg.forward_from.username;
        }
        const messageInfo = parseMessage(msg.text, username);
        messageData.push(messageInfo);
    }
});

// Command handler for "/start"
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Hello! Forward messages to me and send /sum to calculate totals for all messages.");
});
