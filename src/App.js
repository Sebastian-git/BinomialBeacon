import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [stockPrice, setStockPrice] = useState(0);
  const [strikePrice, setStrikePrice] = useState(2.5); // Assume a strike price for now
  const [timeToExpiry, setTimeToExpiry] = useState(365); // Assume 365 days to expiration for now
  const [riskFreeRate, setRiskFreeRate] = useState(0.01); // Assume a 1% risk-free rate
  const [volatility, setVolatility] = useState(0.2); // Assume 20% volatility
  const [steps, setSteps] = useState(100); // Assume 100 steps in the binomial model
  const [optionPrice, setOptionPrice] = useState(0);

  const fetchStockData = async () => {
    try {
      const response = await axios.get('https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=AAPL&interval=5min&apikey=CC1EJTK0U40Z2M9C');
      const data = Object.entries(response.data['Time Series (5min)']).map(([date, item]) => parseFloat(item['4. close']));
      const currentStockPrice = data[data.length - 1];
      setStockPrice(currentStockPrice);
    } catch (error) {
      console.error('Error fetching stock data: ', error);
    }
  };

  const calculateOptionPrice = () => {
    // TODO: Implement the binomial options pricing model here
    // For now, let's just set the option price to be the stock price
    setOptionPrice(stockPrice);
  };

  useEffect(() => {
    fetchStockData();
    calculateOptionPrice();
  }, [stockPrice, strikePrice, timeToExpiry, riskFreeRate, volatility, steps]);

  return (
    <div>
      <h1>Binomial Options Pricing Model</h1>
      <p>Stock Price: {stockPrice}</p>
      <p>Strike Price: {strikePrice}</p>
      <p>Time to Expiry: {timeToExpiry} days</p>
      <p>Risk-Free Rate: {riskFreeRate * 100}%</p>
      <p>Volatility: {volatility * 100}%</p>
      <p>Steps: {steps}</p>
      <h2>Option Price: {optionPrice}</h2>
    </div>
  );
};

export default App;
