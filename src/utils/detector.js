function detectNewQuests(oldQuests, newQuests) {
    const oldIds = new Set(
        oldQuests.map(q => String(q.id))
    );

    return newQuests.filter(
        quest => !oldIds.has(String(quest.id))
    );
}

function extractText(value) {
    if (!value) return "";

    if (typeof value === "string") {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(extractText).join(" ");
    }

    if (typeof value === "object") {
        let result = "";

        if (value.text) {
            result += value.text + " ";
        }

        if (value.content) {
            result += extractText(value.content);
        }

        return result;
    }

    return "";
}

function detectTaskType(task) {
    const rawType = String(task.type || "").toLowerCase();

    const settings = JSON.stringify(
        task.settings || {}
    ).toLowerCase();

    const text = `${rawType} ${settings}`;

    const patterns = [
        {
            type: "like",
            keywords: ["like", "favorite", "twitterlike", "xlike"]
        },
        {
            type: "retweet",
            keywords: ["retweet", "repost", "twitterretweet"]
        },
        {
            type: "comment",
            keywords: ["comment", "reply", "tweetreply"]
        },
        {
            type: "follow",
            keywords: ["follow", "twitterfollow", "xfollow"]
        },
        {
            type: "discord",
            keywords: ["discord", "joinserver"]
        },
        {
            type: "telegram",
            keywords: ["telegram", "joinchannel", "joingroup"]
        },
        {
            type: "visit",
            keywords: ["visitlink", "visitwebsite", "website"]
        },
        {
            type: "quiz",
            keywords: ["quiz", "question", "answer"]
        }
    ];

    const matches = patterns
        .filter(pattern =>
            pattern.keywords.some(keyword =>
                rawType.includes(keyword)
            )
        )
        .map(pattern => pattern.type);

    // Dùng settings bổ sung khi tên task type chưa đủ rõ.
    if (matches.length === 0) {
        if (settings.includes("twitter.com") || settings.includes("x.com")) {
            return ["x_custom"];
        }

        if (settings.includes("discord.gg")) {
            return ["discord"];
        }

        if (settings.includes("t.me/")) {
            return ["telegram"];
        }

        if (settings.includes("http")) {
            return ["visit"];
        }
    }

    return matches.length ? matches : ["custom"];
}

function classifyQuest(quest) {
    const tasks = Array.isArray(quest.tasks)
        ? quest.tasks
        : [];

    const description = extractText(quest.description);

    const taskDetails = tasks.map(task => ({
        id: task.id || "",
        raw_type: task.type || "unknown",
        types: detectTaskType(task),
        settings: task.settings || {}
    }));

    const detectedTypes = new Set();

    taskDetails.forEach(task => {
        task.types.forEach(type => detectedTypes.add(type));
    });

    const text = `${quest.title || ""} ${description}`.toLowerCase();

    if (detectedTypes.size === 0) {
        const titlePatterns = [
            { type: "like", keywords: ["like"] },
            { type: "retweet", keywords: ["retweet", "repost"] },
            { type: "comment", keywords: ["comment", "reply"] },
            { type: "follow", keywords: ["follow"] },
            { type: "discord", keywords: ["discord"] },
            { type: "telegram", keywords: ["telegram"] },
            { type: "visit", keywords: ["visit website", "visit link"] },
            { type: "quiz", keywords: ["quiz"] }
        ];

        titlePatterns.forEach(pattern => {
            if (pattern.keywords.some(keyword => text.includes(keyword))) {
                detectedTypes.add(pattern.type);
            }
        });
    }

    const types = [...detectedTypes];

    return {
        task_types: types.length ? types : ["custom"],
        task_details: taskDetails,
        task_count: tasks.length,
        is_multi_step: tasks.length > 1,
        condition_operator: quest.condition_operator || "AND",
        condition_count: quest.condition?.length || 0,
        description,
        reward_xp: Number(quest.reward || 0)
    };
}

module.exports = {
    detectNewQuests,
    classifyQuest
};