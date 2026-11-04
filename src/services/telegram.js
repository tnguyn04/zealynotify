const TelegramBot = require("node-telegram-bot-api");

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TOKEN || !CHAT_ID || TOKEN === "TOKEN_BOT_MOI") {
    throw new Error("Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID trong .env");
}

const bot = new TelegramBot(TOKEN, {
    polling: false
});

function createSlug(title) {
    return String(title || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]/g, "");
}

function escapeHTML(text) {
    return String(text ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

async function sendNewQuest(quest, community) {
    const types = (quest.task_types || ["custom"])
        .join(" + ");

    const taskCount = quest.task_count || 0;

    const slug = createSlug(quest.title);

    const questUrl =
        `https://zealy.io/cw/${encodeURIComponent(community)}/questboard/${slug}/${encodeURIComponent(quest.id)}`;

    const message = [
        "🚀 <b>NEW ZEALY QUEST</b>",
        "",
        `🌐 Community: <b>${escapeHTML(community)}</b>`,
        `📌 Quest: <b>${escapeHTML(quest.title)}</b>`,
        `🎁 Reward: <b>${Number(quest.reward) || 0} XP</b>`,
        `🆔 ID: <code>${escapeHTML(quest.id)}</code>`
    ].join("\n");

    await bot.sendMessage(CHAT_ID, message, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "🔎 OPEN QUEST",
                        url: questUrl
                    }
                ]
            ]
        }
    });

    console.log(`[TELEGRAM] Đã gửi: ${quest.title}`);

    return true;
}

module.exports = { sendNewQuest };