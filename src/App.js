import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend
} from 'recharts';

const App = () => {
  const [stockData, setStockData] = useState([]);
  const [optionData, setOptionData] = useState([]);

  const fetchStockData = async () => {
    try {
      const response = await axios.get('https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=AAPL&interval=5min&apikey=CC1EJTK0U40Z2M9C');
      const options_data = await axios.get('https://api.marketdata.app/v1/options/quotes/AAPL250117C00150000/');
      console.log("options data:", options_data)
      const data = Object.entries(response.data['Time Series (5min)']).map(([date, item]) => ({
        date,
        stockPrice: parseFloat(item['4. close'])
      })).slice(0, 50).reverse();
      setStockData(data);
    } catch (error) {
      console.error('Error fetching stock data: ', error);
    }
  };

  const fetchOptionData = async () => {
    try {
      const response = await axios.get('https://sandbox.tradier.com/v1/markets/options/chains', {
        params: {
          symbol: 'AAPL',
          expiration: '2023-07-10'
        },
        headers: { Authorization: `Bearer YOUR_TRADIER_API_TOKEN` },
      });
      const data = response.data.options.option.map((item) => ({
        date: item.date,
        optionPrice: parseFloat(item.last)
      })).slice(0, 50).reverse();
      setOptionData(data);
    } catch (error) {
      console.error('Error fetching option data: ', error);
    }
  };

  useEffect(() => {
    fetchStockData();
    // fetchOptionData();
  }, []);

  return (
    <div style={{ width: '100%', height: 500 }}>
      <ResponsiveContainer>
        <LineChart data={stockData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} height={70} angle={-45} interval={0} />
          <YAxis />
          <Tooltip />
          <Legend verticalAlign="top" height={36}/>
          <Line type="monotone" dataKey="stockPrice" stroke="#8884d8" activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="optionPrice" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default App;
