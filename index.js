const axios = require("axios");
const fs = require("fs");

const getProxies = async () => {
  try {
    const response = await axios.get(
      "https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=all&country=all&ssl=all&anonymity=all"
    );
    const data = response.data.split("\n").filter((line) => line.trim() !== "");
    return data.map(proxy => {
      const [host, port] = proxy.split(":");
      return {
        protocol: "http",
        host: host,
        port: parseInt(port, 10)
      };
    });
  } catch (error) {
    console.error("Error while fetching proxies: ", error.message);
    return [];
  }
};

const makeRequestWithProxy = async (url, body, proxy, timeout) => {
  try {
    const response = await axios.post(url, body, {
      proxy: proxy,
      timeout: timeout,
    });
    return { proxy, success: true };
  } catch (error) {
    return { proxy, success: false, error: error.message };
  }
};

const tryYearWithProxies = async (year, proxies, url, body, timeout) => {
  let successful = false;
  let failedProxies = new Set();

  const requests = proxies.map(async (proxy) => {
    const result = await makeRequestWithProxy(url, { ...body, evjarat_min: year, evjarat_max: year }, proxy, timeout);
    
    if (result.success) {
      console.log(`Successfully saved data for year ${year} with proxy ${proxy.host}:${proxy.port}`);
      successful = true;
    } else {
      console.error(`Failed with proxy ${proxy.host}:${proxy.port}: ${result.error}`);
      failedProxies.add(proxy);
    }
    
    return result;
  });

  await Promise.all(requests);

  // Remove failed proxies
  proxies = proxies.filter(proxy => !failedProxies.has(proxy));

  return successful;
};

const main = async () => {
  const url = 'https://www.hasznaltauto.hu/egyszeru/szemelyauto';
  const baseBody = {
    marka_id: 12,
    modell_id: 105,
    results: 600,
    allapot: [1, 2, 3, 4, 5]
  };
  const timeout = 3000; // 1 second timeout for each request

  let proxies = await getProxies();

  if (proxies.length === 0) {
    console.error("No proxies found.");
    return;
  }

  for (let year = 2014; year <= 2024; year++) {
    console.log(`Starting requests for year ${year}...`);
    const success = await tryYearWithProxies(year, proxies, url, { ...baseBody, evjarat_min: year, evjarat_max: year }, timeout);

    if (success) {
      // Stop processing if successful
      console.log(`Data successfully scraped for year ${year}. Moving to next year.`);
    } else {
      console.log(`No successful requests for year ${year}.`);
    }
  }

  // Exit the process explicitly
  process.exit(0);
};

main();
