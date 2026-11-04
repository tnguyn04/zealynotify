
const axios = require("axios");

const BASE_URL = "https://api.zealy.io";

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json, text/plain, */*",
        "Origin": "https://zealy.io"
    }
});

/**
 * Lấy danh sách quest từ một community
 */
async function fetchQuests(community) {
    try {
        const response = await api.get(
            `/communities/${encodeURIComponent(community)}/quests`,
            {
                headers: {
                    Referer: `https://zealy.io/cw/${encodeURIComponent(community)}`
                }
            }
        );

        const body = response.data;

        // Chuẩn hóa các dạng response có thể gặp
        let quests;

        if (Array.isArray(body)) {
            quests = body;
        } else if (Array.isArray(body?.quests)) {
            quests = body.quests;
        } else if (Array.isArray(body?.data)) {
            quests = body.data;
        } else if (Array.isArray(body?.data?.quests)) {
            quests = body.data.quests;
        } else {
            throw new Error(
                "Không nhận diện được cấu trúc response Zealy"
            );
        }

        return quests
            .filter(q => q && q.id != null)
            .map(q => {
                const xp = (q.reward || []).find(
                    reward => reward.type === "xp"
                )?.value || 0;

                return {
                    id: String(q.id),
                    title: q.name?.trim() || q.title?.trim() || "Untitled quest",
                    reward: Number(xp),

                    category_id: q.categoryId || "",
                    questboard_id: q.questboard_id || q.questboardId || "",

                    type: q.type || "unknown",
                    tasks: Array.isArray(q.tasks) ? q.tasks : [],
                    condition: Array.isArray(q.condition) ? q.condition : [],
                    condition_operator: q.conditionOperator || "AND",

                    description: q.description || null,
                    submission_type: q.submissionType || null,
                    auto_validate: Boolean(q.autoValidate),

                    community
                };
            });

    } catch (error) {
        console.error(
            `[ZEALY] ${community}:`,
            error.response?.status || error.message
        );

        // null biểu thị lỗi API, không phải không có task
        return null;
    }
}

module.exports = { fetchQuests };
