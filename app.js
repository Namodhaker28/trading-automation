const Binance = require("node-binance-api");
const express = require("express");
const fs = require("fs");
const getSimpleMovingAverage = require("./helper");
const TelegramBot = require("node-telegram-bot-api");

const server = express();

server.listen(4000, () => {
  console.log("server Started...");
});

const token = "6722173872:AAETsn23sYExosPaUyiB-y4RG-vgGuTtXzw";
const bot = new TelegramBot(token, { polling: true });
const chatId = 897911354;

const binance = new Binance().options({
  APIKEY: "3bVcGQnY5ojwlLA8RMkBeXlOjrMnJZ3ty7mT8HcjPHSnn0KVNsgGEmAVolT5mHNE",
  APISECRET: "4NmUo9uPGIgmurx58pbiHhDY9cr13whM3EWrD2ga9Rg07uB3ZTw3RYF7gPHp46rV",
});

const profitTarget = 200;
const btcAmount = 0.005;
let quantity;

const automation = async () => {

  const tradeType = JSON.parse(fs.readFileSync("data.json", "utf-8")).side;

  try {
    const sma15 = await getSimpleMovingAverage("BTCUSDT", "15m", 15);
    const sma35 = await getSimpleMovingAverage("BTCUSDT", "15m", 35);
    // console.log(sma15, sma35)

    const openPosition = await binance.futuresPositionRisk({ symbol: "BTCUSDT" });
    // console.log(openPosition)

    if (sma15 > sma35) {
      if (tradeType === "long" && Number(openPosition[0].positionAmt)) {
        console.log("alredy long position is open");
        return;
      }
      if (tradeType === "short" && Number(openPosition[0].positionAmt)) {
        console.log(openPosition[0])
        quantity = Number(openPosition[0].positionAmt) * 2 * -1;
      } else {
        quantity = btcAmount;
      }

      console.log(quantity)

      const broughtOrder = await binance.futuresMarketBuy("BTCUSDT", quantity, { newOrderRespType: "RESULT" });
      console.log("broughtOrder", broughtOrder);

      const price = Number(broughtOrder.avgPrice) + profitTarget;
      console.log("price ====> ", price);

      const tpOrder = await binance.futuresMarketSell("BTCUSDT", btcAmount, { type: "TAKE_PROFIT_MARKET", stopprice: price, reduceOnly: true });
      console.log("tpOrder", tpOrder);

      bot.sendMessage(chatId, `Trade Placed: ${broughtOrder.avgPrice}  ( ${broughtOrder.origQty} )  \n TP : ${tpOrder.stopPrice} `);
      fs.writeFileSync("data.json", JSON.stringify({ side: "long" }, null, 2));
    } else {
      if (tradeType === "short" && Number(openPosition[0].positionAmt)) {
        console.log("alredy short position is open");
        return;
      }
      if (tradeType === "long" && Number(openPosition[0].positionAmt)) {
        quantity = Number(openPosition[0].positionAmt) * 2;
      } else {
        quantity = btcAmount;
      }

      const shortOrder = await binance.futuresMarketSell("BTCUSDT", quantity, { newOrderRespType: "RESULT" });
      console.log("shortOrder", shortOrder);

      const price = Number(shortOrder.avgPrice) - profitTarget;
      console.log("price ====> ", price);

      const tpOrder = await binance.futuresMarketBuy("BTCUSDT", btcAmount, { type: "TAKE_PROFIT_MARKET", stopprice: price, reduceOnly: true });
      console.log("tpOrder", tpOrder);

      bot.sendMessage(chatId, `Trade Placed: ${shortOrder.avgPrice} ( ${shortOrder.origQty} )  \n TP : ${tpOrder.stopPrice} `);
      fs.writeFileSync("data.json", JSON.stringify({ side: "short" }, null, 2));
    }
  } catch (error) {
    console.log("error: ", error);
  }
};

const intervalId = setInterval(automation, 5 * 60 * 1000);
automation();
