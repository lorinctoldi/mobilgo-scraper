const fs = require("fs");

(async () => {
    try {
        const data = JSON.parse(fs.readFileSync("data.json", "utf-8"));

        const scrapedCount = data.filter(obj => obj.scraped === true).length;

        console.log(scrapedCount);
    } catch (error) {
        console.error(error);
    }
})();
