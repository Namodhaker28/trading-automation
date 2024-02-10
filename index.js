

const axios = require('axios');
const crypto = require('crypto');

const apiKey = '3bVcGQnY5ojwlLA8RMkBeXlOjrMnJZ3ty7mT8HcjPHSnn0KVNsgGEmAVolT5mHNE';
const apiSecret = '4NmUo9uPGIgmurx58pbiHhDY9cr13whM3EWrD2ga9Rg07uB3ZTw3RYF7gPHp46rV';
const symbol = 'BTCUSDT'; // Replace with the trading pair you want to trade
const quantity = 0.01; // Replace with the quantity you want to trade
const price = 0.8;
const side = 'BUY'; // 'BUY' for buying, 'SELL' for selling
const type = 'MARKET'; // 'LIMIT' or 'MARKET'
const leverage = 25;
const timestamp = Date.now();

const queryString = `symbol=${symbol}&side=${side}&type=${type}&quantity=${quantity}&timestamp=${timestamp}`;
const orderQueryString = `symbol=${symbol}&timestamp=${timestamp}`;
const queryStringLev = `symbol=${symbol}&leverage=${leverage}&timestamp=${timestamp}`;

const signature = crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex');
const OrderSignature = crypto.createHmac('sha256', apiSecret).update(orderQueryString).digest('hex');
const signatureLev = crypto.createHmac('sha256', apiSecret).update(queryStringLev).digest('hex');

let sideOfSignal

// Set up the request parameters
const params = {
  symbol,
  side,
  type,
  quantity,
  timestamp,
  signature,
};
const paramsLev = {
  symbol,
  leverage,
  timestamp,
  signature: signatureLev,
};

const orderParams = {
  symbol,
  timestamp,
  signature: OrderSignature,
}

const headers = {
  'X-MBX-APIKEY': apiKey,
};

const smaAutomation = async () => {

  // Make the API request to place the order
  const placeOrder = async () => {
    try {
      const leverageChangeRes = await axios.post('https://fapi.binance.com/fapi/v1/leverage', null, { params: paramsLev, headers })
      const orederPlacedRes = await axios.post('https://fapi.binance.com/fapi/v1/order', null, { params, headers })
      console.log("leverageChangeRes", leverageChangeRes.data)
      console.log("orederPlacedRes", orederPlacedRes.data)
    } catch (error) {
      console.log(error.response.data)
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await axios.get('https://fapi.binance.com/fapi/v1/allOrders', {
        params: orderParams,
        headers: {
          'Content-Type': 'application/json',
          'X-MBX-APIKEY': apiKey,
        },
      });

      console.log('Orders:', response.data);
    } catch (error) {
      console.error('Error fetching orders:', error.response ? error.response.data : error.message);
    }
  };

  async function getSimpleMovingAverage(symbol, interval, length) {

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
      console.error('Error getting SMA:', error.response);
      return null;
    }
  }



  const sma15 = await getSimpleMovingAverage(symbol, '15m', 15);
  const sma35 = await getSimpleMovingAverage(symbol, '15m', 35);
  // const isOrderPlaced = await fetchOrders();

  console.log(sma15, sma35)


  placeOrder()
  if (sma15 > sma35) {
    fetchOrders()
  }
  else {
    fetchOrders()
  }





}

smaAutomation();