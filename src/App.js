import React, { useState } from 'react';
import {Tree} from 'react-tree-graph';
import 'react-tree-graph/dist/style.css'
import './App.css';

// Step 1: Set up tree with deisred amount of timesteps first

// Step 2: Calculate upPrice and downPrice for nodes

const upPrice = (curPrice, stdDev, timestep) => { return curPrice * Math.exp(stdDev, Math.sqrt(timestep)) }

const downPrice = (upPrice) => {return 1/upPrice}

// Step 3: Calculate option payoff at expiration (works for both curPrice=downPrice and curPrice=upPrice)

const callBuyPayoff = (curPrice, strikePrice) => { return Math.max(curPrice - strikePrice, 0) }


/*
Function to calculate the binomial tree pricing

u and d are the up and down factors, which represent the multiplicative increases or decreases in the stock price at each step.
r is the risk-free interest rate.
T is the time to expiration of the option, in years.
p is the risk-neutral probability, which is used to calculate the expected value of the option.
*/
const calculatePrice = (steps, price, u, d, r, T) => {
  // Calculate the risk-neutral probability
  let p = (Math.exp(r * T) - d) / (u - d);

  // Create an empty array to hold the prices at each node
  let prices = Array(steps + 1).fill().map(() => Array(steps + 1));

  // Calculate the prices at each node
  for (let i = 0; i <= steps; i++) {
    for (let j = 0; j <= i; j++) {
      prices[j][i] = price * Math.pow(u, i - j) * Math.pow(d, j);
    }
  }

  return prices;
};


// Modified dummy data function
const createData = (steps, price = 100, delta = 10) => {
  if (steps === 0) {
    return { name: price.toFixed(2) };
  }

  return {
    name: price.toFixed(2),
    children: [
      createData(steps - 1, price + delta, delta),
      createData(steps - 1, price - delta, delta)
    ]
  };
};

function App() {
  const [steps, setSteps] = useState(1);
  let data = createData(steps, 100, 10);

  return (
    <div className="App">
      <h1>Binomial Tree Model Visualization</h1>
      <div>
        <label>Timesteps: </label>
        <input type="range" min="1" max="5" value={steps} 
          className="slider" onChange={(e) => setSteps(Number(e.target.value))} />
        <span>{steps}</span>
      </div>
      <Tree
        data={data}
        height={400 + 150 * (steps/5)}
        width={500 + 580 * (steps/5)} // normalize so width is based on steps while ensuring steps is in range from 0-1
        animated
        svgProps={{
            className: 'tree',
        }}
        textProps={{ 
            style: {
                fill: 'green',
                fontSize: '1.1em',
            }
        }}/>
    </div>
  );
}

export default App;
