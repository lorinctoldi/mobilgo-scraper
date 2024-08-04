const axios = require("axios");

const getProxies = async () => {
  try {
    const response = await axios.get(
      "https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=1500&country=all&ssl=all&anonymity=all"
    );
    const data = response.data.split("\n").filter((line) => line.trim() !== "");
    return data.map((proxy) => {
      const [host, port] = proxy.split(":");
      return {
        protocol: "http",
        host: host,
        port: parseInt(port, 10),
      };
    });
  } catch (error) {
    console.error("Error while fetching proxies: ", error.message);
    return [];
  }
};

module.exports = getProxies;
