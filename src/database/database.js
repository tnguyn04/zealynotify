
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../data");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getDatabaseFile(community) {
    return path.join(
        DATA_DIR,
        `tasks_${community}.json`
    );
}

function loadQuests(community) {
    const file = getDatabaseFile(community);

    if (!fs.existsSync(file)) {
        return null;
    }

    try {
        const data = JSON.parse(
            fs.readFileSync(file, "utf8")
        );

        return Array.isArray(data) ? data : null;

    } catch (error) {
        console.error(
            `[DATABASE] ${community}:`,
            error.message
        );

        return null;
    }
}

function saveQuests(community, quests) {
    const file = getDatabaseFile(community);
    const tempFile = `${file}.tmp`;

    fs.writeFileSync(
        tempFile,
        JSON.stringify(quests, null, 2),
        "utf8"
    );

    fs.renameSync(tempFile, file);
}

module.exports = {
    loadQuests,
    saveQuests
};
