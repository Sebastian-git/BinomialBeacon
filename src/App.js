import React, { useState } from 'react';
import {Tree} from 'react-tree-graph';
import 'react-tree-graph/dist/style.css'
import './App.css';

// Step 1: Set up tree with deisred amount of timesteps first

// Step 2: Calculate upSize and downSize (% movement up/down)

const upSize = (stdDev, timestep) => { return Math.exp((stdDev * 0.01) * Math.sqrt(timestep)) };

const downSize = (upSize) => { return 1/upSize };

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

let stdDev = 20.14 // SPY std dev on the year
let stockPrice = 50 // Current stock price
let strikePrice = 38
let rfr = 0.03; // Risk free rate

function App() {
  const [steps, setSteps] = useState(1);

  // Modified dummy data function
  const createData = (curSteps, price, delta = 10) => {
    price = parseInt(price.toFixed(3))

    // Size of up/down moves (returns %, stdDev whole number)
    let upMove = upSize(stdDev, curSteps);
    let downMove = downSize(upMove);

    // At children of tree, calculate payoff
    if (curSteps === 0) {
      let payoff = callBuyPayoff(price, strikePrice);
      let expectedValue = payoff * (upMove + downMove)
      let discountedPV = expectedValue / Math.pow(1 + rfr, steps-curSteps) // THIS IS THE CALL OPTIONS VALUE
      console.log("price:", price)
      console.log("payoff:", payoff)
      console.log("expected value:", expectedValue)
      console.log("discountedPV:", discountedPV)
      return { name: price.toFixed(2) };
    }

    // Risk neutral probabilities
    let RNPUP = (1 + rfr - downMove) / (upMove - downMove)
    let RNPDOWN = 1 - RNPUP

    let upPrice = price * upMove
    let downPrice = price * downMove

    // console.log("curSteps:", curSteps, "upmove:", upMove, "steps:", steps)

    // At expiration date, calculate payoff
    if (curSteps == steps) { 
      // console.log("upMove:", upMove, "downMove:", downMove);
      // console.log("RNPUP:", RNPUP, "RNPDOWN:", RNPDOWN)
      // console.log("upPrice:", upPrice, "downPrice:", downPrice)
    }

    return {
      name: price.toFixed(2),
      children: [
        createData(curSteps - 1, upPrice, delta),
        createData(curSteps - 1, downPrice, delta)
      ]
    };
  };

  let data = createData(steps, stockPrice, 10);

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
            className: 'tree'
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
