const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const getProxies = require("./get_proxies");

const scrapeData = async (url) => {
  const response = await axios.get(url);
  const html = response.data;
  const $ = cheerio.load(html);

  const phone = $("span[itemprop=telephone]").first().text().trim() || null;

  const emailElements = $("a[itemprop=email]")
    .map((_, el) => $(el).text().trim())
    .get();
  const email = emailElements.length
    ? Array.from(new Set(emailElements)).join(", ")
    : null;

  const address =
    $("span[itemprop=streetAddress]").first().text().trim() || null;

  const county =
    $("span[itemprop=addressLocality]").first().text().trim() || null;

  const city = $("span[itemprop=addressRegion]").first().text().trim() || null;

  const websiteElement = $("a[itemprop=url]")
    .filter((_, el) => $(el).attr("href").includes("http"))
    .first();
  const website = websiteElement.length ? websiteElement.attr("href") : null;

  const description = $("div.smalldesc").first().text().trim() || null;

  const instagramElement = $("a[itemprop=url]")
    .filter((_, el) => $(el).attr("href").includes("instagram"))
    .first();
  const instagram = instagramElement.length
    ? instagramElement.attr("href")
    : null;
  const facebookElement = $("a[itemprop=url]")
    .filter((_, el) => $(el).attr("href").includes("facebook"))
    .first();
  const facebook = facebookElement.length ? facebookElement.attr("href") : null;

  const categoryText =
    $(".right-category")
      .last()
      .text()
      .trim()
      .replace(/Kategóriák\s*\/\s*/, "") || null;

  return {
    phone,
    email,
    address,
    county,
    city,
    website,
    description,
    instagram,
    facebook,
    categories: categoryText,
  };
};

const fetchWithTimeout = (url, proxy, timeout = 3000) => {
  return new Promise((resolve, reject) => {
    const source = axios.CancelToken.source();
    const timer = setTimeout(() => {
      source.cancel();
      reject(new Error("Request timed out"));
    }, timeout);

    axios
      .get(url, { proxy, cancelToken: source.token })
      .then((response) => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

const updateData = async (item, proxy) => {
  try {
    const result = await fetchWithTimeout(item.url, proxy);
    const scrapedData = await scrapeData(result.config.url);

    item.scraped = true;
    item.phone = scrapedData.phone;
    item.email = scrapedData.email;
    item.address = scrapedData.address;
    item.county = scrapedData.county;
    item.city = scrapedData.city;
    item.website = scrapedData.website;
    item.description = scrapedData.description;
    item.instagram = scrapedData.instagram;
    item.facebook = scrapedData.facebook;
    item.categories = scrapedData.categories;

    console.log(`Successfully scraped: ${item.url}`);
  } catch (error) {
    console.error(
      `Failed to scrape: ${item.url} with proxy: ${proxy.host}:${proxy.port}, Error: ${error.message}`
    );
    throw new Error("Proxy failed");
  }
};

const checkAndRefillProxies = async (proxies, threshold = 25) => {
  if (proxies.length < threshold) {
    console.log(`Proxy count below ${threshold}. Fetching new proxies...`);
    const newProxies = await getProxies();
    proxies.push(...newProxies);
    console.log(`Refilled proxies. Total available proxies: ${proxies.length}`);
  }
};

const main = async () => {
  try {
    let proxies = await getProxies();
    let data = JSON.parse(fs.readFileSync("data.json", "utf-8"));

    while (proxies.length > 0) {
      const unsupervisedData = data.filter((item) => !item.scraped);
      const n = Math.min(proxies.length, unsupervisedData.length);
      const itemsToScrape = unsupervisedData.slice(0, n);

      if (itemsToScrape.length === 0) break;

      console.log(
        `Scraping ${itemsToScrape.length} items using ${proxies.length} proxies...`
      );

      const scrapeTasks = itemsToScrape.map((item, index) => {
        const proxy = proxies[index % proxies.length];
        return updateData(item, proxy).catch(() => {
          proxies.splice(proxies.indexOf(proxy), 1);
        });
      });

      await Promise.all(scrapeTasks);

      await checkAndRefillProxies(proxies);

      fs.writeFileSync("data.json", JSON.stringify(data, null, 2), "utf-8");

      console.log(
        "Batch completed. Data saved to data.json. Checking for more items to scrape..."
      );
    }

    console.log("Scraping completed or no more proxies available.");
  } catch (error) {
    console.error(error);
  }
};

main();
