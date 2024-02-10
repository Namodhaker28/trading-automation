const Binance = require('node-binance-api');
const axios = require('axios');
const express = require('express')
const fs = require('fs');



const server = express();

// server.listen(4000, () => {
//     console.log("server Started...")
// })



const binance = new Binance().options({
    APIKEY: '3bVcGQnY5ojwlLA8RMkBeXlOjrMnJZ3ty7mT8HcjPHSnn0KVNsgGEmAVolT5mHNE',
    APISECRET: '4NmUo9uPGIgmurx58pbiHhDY9cr13whM3EWrD2ga9Rg07uB3ZTw3RYF7gPHp46rV'
});



const automation = async () => {


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
            console.error('Error getting SMA:', error);
            return null;
        }
    }

    const sma15 = await getSimpleMovingAverage("BTCUSDT", '15m', 15);
    const sma35 = await getSimpleMovingAverage("BTCUSDT", '15m', 35);

    // console.log(sma15, sma35)

    const openPosition = await binance.futuresPositionRisk({ symbol: "BTCUSDT" });


    // console.log(openPosition)

    if (sma15 > sma35) {
        if (Number(openPosition[0].positionAmt)) {
            if (JSON.parse(fs.readFileSync('data.json', 'utf-8')).side === 'long') {
                console.log("alredy position is  open")
                // console.info(await binance.futuresOpenOrders("BTCUSDT"));
                // const tpOrder = await binance.futuresMarketSell('BTCUSDT', 0.005 , {type:"TAKE_PROFIT" , price:Number(broughtOrder.avgPrice)  - 200, stopprice:Number(broughtOrder.avgPrice)  - 200});
                // console.log("tpOrder", tpOrder)
            }
            else {
                const broughtOrder = await binance.futuresMarketBuy('BTCUSDT', Number(openPosition[0].positionAmt) * 2, { newOrderRespType: 'RESULT' });
                console.log("broughtOrder", broughtOrder)

                const price = Number(broughtOrder.avgPrice) + 200;
                console.log("price ====> ", price)

                const tpOrder = await binance.futuresMarketSell('BTCUSDT', 0.005, { type: "TAKE_PROFIT_MARKET", stopprice: price, reduceOnly: true });
                console.log("tpOrder", tpOrder)


                fs.writeFileSync('data.json', JSON.stringify({ side: 'long' }, null, 2));
            }
        }
        else {
            const broughtOrder = await binance.futuresMarketBuy('BTCUSDT', 0.005, { newOrderRespType: 'RESULT' });
            console.log("broughtOrder", broughtOrder)

            const price = Number(broughtOrder.avgPrice) + 200;
            console.log("price ====> ", price)

            const tpOrder = await binance.futuresMarketSell('BTCUSDT', 0.005, { type: "TAKE_PROFIT_MARKET", stopprice: price, reduceOnly: true });
            console.log("tpOrder", tpOrder)

            fs.writeFileSync('data.json', JSON.stringify({ side: 'long' }, null, 2));

        }
    }
    else {
        if (Number(openPosition[0].positionAmt)) {
            if (JSON.parse(fs.readFileSync('data.json', 'utf-8')).side === 'short') {
                console.log("alredy short position is  open")
                // const tpOrder = await binance.futuresSell('BTCUSDT', 0.005, ((Number(broughtOrderDetails.avgPrice) + 200).toString()));
            }
            else {
                const shortOrder = await binance.futuresMarketSell('BTCUSDT', Number(openPosition[0].positionAmt) * 2, { newOrderRespType: 'RESULT' });
                console.log("shortOrder", shortOrder)

                const price = Number(shortOrder.avgPrice) - 200;
                console.log("price ====> ", price)

                const tpOrder = await binance.futuresMarketBuy('BTCUSDT', 0.005, { type: "TAKE_PROFIT_MARKET", stopprice: price, reduceOnly: true });
                console.log("tpOrder", tpOrder)

                fs.writeFileSync('data.json', JSON.stringify({ side: 'short' }, null, 2));
            }
        }
        else {
            const shortOrder = await binance.futuresMarketSell('BTCUSDT', 0.005, { newOrderRespType: 'RESULT' });
            console.log("shortOrder", shortOrder)

            const price = Number(shortOrder.avgPrice) - 200;
            console.log("price ====> ", price)

            const tpOrder = await binance.futuresMarketBuy('BTCUSDT', 0.005, { type: "TAKE_PROFIT_MARKET", stopprice: price, reduceOnly: true });
            console.log("tpOrder", tpOrder)

            fs.writeFileSync('data.json', JSON.stringify({ side: 'short' }, null, 2));
        }
    }

    // console.info(await binance.futuresMarketBuy('BTCUSDT', 0.01));
    // console.info(await binance.futuresMarketSell('BTCUSDT', 0.01));

    // console.info( await binance.futuresTrades("BTCUSDT") );

    // console.info( await binance.futuresAllOrders( "BTCUSDT" ) );
    // console.info( await binance.futuresOrderStatus( "BTCUSDT", {orderId: "260782345054"} ) );

    // console.info( await binance.futuresOpenOrders( "BTCUSDT" ) );



    // console.info( await binance.futuresCancelAll( "BTCUSDT" ) );






}

const intervalId = setInterval(automation, 15*60*1000);



// automation()
