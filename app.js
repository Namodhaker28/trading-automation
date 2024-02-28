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

let profitTarget = 250;
let btcAmount = 0.005;
let quantity;

bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  console.log("first message received", msg, match);

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});

bot.on("message", (msg) => {
  console.log(msg);
  profitTarget = Number(msg.text);
  bot.sendMessage(chatId, `TP Updated to ${profitTarget} `);
});

const automation = async () => {

  const tradeType = JSON.parse(fs.readFileSync("data.json", "utf-8")).side;

  if (!profitTarget) return;

  try {
    const sma15 = await getSimpleMovingAverage("BTCUSDT", "15m", 7);
    const sma35 = await getSimpleMovingAverage("BTCUSDT", "15m", 21);
    // console.log(sma15, sma35)

    const openPosition = await binance.futuresPositionRisk({ symbol: "BTCUSDT" });
    console.log(openPosition);
    const cmpBtc = Number(openPosition[0]?.markPrice);

    // if(Number(openPosition[0].positionAmt) > 0){
    //   tradeType = "long"
    // }else{
    //   tradeType = "short"
    // }

    if (sma15 > sma35) {
      if (tradeType === "long" && Number(openPosition[0]?.positionAmt)) {
        console.log("alredy long position is open");
        return;
      }
      if (tradeType === "short" && Number(openPosition[0]?.positionAmt)) {
        console.log(openPosition[0]);
        quantity = Number(openPosition[0].positionAmt) * 2 * -1;
      } else {
        quantity = btcAmount;
      }


      console.info(await binance.futuresCancelAll("BTCUSDT"));

      const limitPrice = Math.floor(cmpBtc - 5);
      console.log(limitPrice);
      const broughtOrder = await binance.futuresBuy("BTCUSDT", quantity, limitPrice, {
        newOrderRespType: "RESULT",
      });
      console.log("broughtOrder", broughtOrder);

      const price = Number(broughtOrder.price) + profitTarget;
      console.log("price ====> ", price);

      const tpOrder = await binance.futuresSell("BTCUSDT", btcAmount,price, {
        type: "TAKE_PROFIT",
        stopprice: price,
        reduceOnly: true,
      });
      console.log("tpOrder", tpOrder);

      bot.sendMessage(
        chatId,
        `Trade Placed: ${broughtOrder.price}  ( ${broughtOrder.origQty} )  \n TP : ${tpOrder.stopPrice} `
      );
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

        console.info(await binance.futuresCancelAll("BTCUSDT"));


      const limitPrice = Math.floor(cmpBtc + 5);
      console.log(limitPrice);
      const shortOrder = await binance.futuresSell("BTCUSDT", quantity, limitPrice, {
        newOrderRespType: "RESULT",
      });
      console.log("shortOrder", shortOrder);

      const price = Number(shortOrder.price) - profitTarget;
      console.log("price ====> ", price);

      const tpOrder = await binance.futuresBuy("BTCUSDT", btcAmount,    price, {
        type: "TAKE_PROFIT",
        stopprice: price,
        reduceOnly: true,
      });
      console.log("tpOrder", tpOrder);

      bot.sendMessage(
        chatId,
        `Trade Placed: ${shortOrder.price} ( ${shortOrder.origQty} )  \n TP : ${tpOrder.stopPrice} `
      );
      fs.writeFileSync("data.json", JSON.stringify({ side: "short" }, null, 2));
    }
  } catch (error) {
    console.log("error: ", error);
  }
};

const intervalId = setInterval(automation, 5 * 60 * 1000);
automation();
