require("dotenv").config();

const COMMUNITIES = require("./config/communities");
const { startMonitor } = require("./workers/monitor");
const { sendNewQuest } = require("./services/telegram");

async function main() {
    console.log("================================");
    console.log("     ZEALY AUTO MONITOR");
    console.log("================================");

    console.log("Communities:", COMMUNITIES.join(", "));

    await startMonitor(
        COMMUNITIES,
        async (quest, community) => {
            console.log("\n========== NEW QUEST ==========");
            console.log("Community:", community);
            console.log("Title:", quest.title);
            console.log("ID:", quest.id);
            console.log("XP:", quest.reward);
            console.log("Types:", quest.task_types.join(", "));
            console.log("===============================\n");

            return await sendNewQuest(quest, community);
        }
    );
}

main().catch(error => {
    console.error("Application error:", error.message);
    process.exit(1);
});