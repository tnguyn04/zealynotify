
const { fetchQuests } = require("../services/zealy");

const {
    detectNewQuests,
    classifyQuest
} = require("../utils/detector");

const {
    loadQuests,
    saveQuests
} = require("../database/database");

const MIN_INTERVAL = Number(process.env.MIN_INTERVAL || 10000);
const MAX_INTERVAL = Number(process.env.MAX_INTERVAL || 15000);

const sleep = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

async function checkCommunity(community, onNewQuest) {
    const quests = await fetchQuests(community);

    // API lỗi: giữ nguyên dữ liệu cũ
    if (quests === null) return;

    const oldQuests = loadQuests(community);

    // Lần đầu: lưu dữ liệu gốc
    if (oldQuests === null) {
        saveQuests(community, quests);

        console.log(
            `[${community}] Đã lưu ${quests.length} quest ban đầu`
        );

        return;
    }

    const newQuests = detectNewQuests(oldQuests, quests);

    if (newQuests.length === 0) {
        return;
    }

    console.log(
        `[${community}] Phát hiện ${newQuests.length} quest mới`
    );

    // Chỉ đánh dấu quest đã xử lý khi callback thành công
    const knownIds = new Set(oldQuests.map(q => String(q.id)));

    for (const quest of newQuests) {
        const analysis = classifyQuest(quest);

        quest.task_types = analysis.task_types;
        quest.task_details = analysis.task_details;
        quest.task_count = analysis.task_count;
        quest.is_multi_step = analysis.is_multi_step;
        quest.condition_operator = analysis.condition_operator;
        quest.condition_count = analysis.condition_count;
        quest.description = analysis.description;

        console.log({
            community,
            id: quest.id,
            title: quest.title,
            XP: quest.reward,
            types: quest.task_types,
            task_count: quest.task_count,
            multi_step: quest.is_multi_step,
            condition: quest.condition_operator,
            details: quest.task_details
        });

        try {
            const success = await onNewQuest(quest, community);

            if (success) {
                knownIds.add(String(quest.id));
            }
        } catch (error) {
            console.error(
                `[${community}] Xử lý quest thất bại:`,
                error.message
            );
        }
    }

    // Chỉ lưu những quest đã xử lý thành công
    const mergedQuests = new Map(
        oldQuests.map(q => [String(q.id), q])
    );

    for (const quest of quests) {
        const id = String(quest.id);

        if (knownIds.has(id)) {
            mergedQuests.set(id, quest);
        }
    }

    saveQuests(community, [...mergedQuests.values()]);
}

async function monitorCommunity(community, onNewQuest) {
    console.log(`[MONITOR] Bắt đầu: ${community}`);

    while (true) {
        try {
            await checkCommunity(community, onNewQuest);
        } catch (error) {
            console.error(
                `[MONITOR] ${community}:`,
                error.message
            );
        }

        const delay = MIN_INTERVAL +
            Math.random() * (MAX_INTERVAL - MIN_INTERVAL);

        await sleep(delay);
    }
}

async function startMonitor(communities, onNewQuest) {
    await Promise.all(
        communities.map(community =>
            monitorCommunity(community, onNewQuest)
        )
    );
}

module.exports = {
    startMonitor,
    checkCommunity
};
