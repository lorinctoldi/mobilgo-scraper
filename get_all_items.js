const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

(async () => {
    try {
        const response = await axios.get('https://mobilgo.eu/cegkereso_grid.php?pageLimit=1&per_page=100000&nev=&cim=&bankkari=&orszag=0&megye=&varos=&kat1=&kat2=&lat=&lon=&_=1722735942503');
        const html = response.data;
        
        const $ = cheerio.load(html);
        
        const urls = [];
        
        $('.grid-item a[itemprop="url"]').each((index, element) => {
            const url = $(element).attr('href').replace('./','');
            const obj = {
                url: `https://mobilgo.eu/${url}`,
                scraped: false,
                phone: null,
                email: null,
                address: null,
                county: null,
                city: null,
                website: null,
                description: null,
                instagram: null,
                facebook: null,
                categories: null
            }
            urls.push(obj);
        });
        
        fs.writeFileSync('data.json', JSON.stringify(urls, null, 2), 'utf-8');
        
        console.log(`Extracted ${urls.length} URLs and saved to urls.json.`);
    } catch (error) {
        console.error(error);
    }
})();
