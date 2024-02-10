const axios = require("axios");

const getSimpleMovingAverage = async  (symbol, interval, length)=> {
    try {
      const response = await axios.get(`https://api.binance.com/api/v3/klines`, {
        params: {
          symbol: symbol,
          interval: interval,
          limit: length,
        },
      });

      const closingPrices = response.data.map((data) => parseFloat(data[4]));
      const sma = closingPrices.reduce((sum, price) => sum + price, 0) / closingPrices.length;
      return sma;
    } catch (error) {
      console.error("Error getting SMA:", error);
      return null;
    }
  }

  module.exports = getSimpleMovingAverage;