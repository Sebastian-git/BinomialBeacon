import React, { useEffect, useState } from 'react';
import {Tree} from 'react-tree-graph';
import 'react-tree-graph/dist/style.css'
import './App.css';

function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

// Step 2: Calculate upSize and downSize (% movement up/down)

const upSize = (stdDev, deltaT) => { return Math.exp((stdDev * 0.01) * Math.sqrt(deltaT)) };

const downSize = (stdDev, deltaT) => { return 1.0/(Math.exp((stdDev * 0.01) * Math.sqrt(deltaT))) };

// Step 3: Calculate option payoff at expiration (works for both curPrice=downPrice and curPrice=upPrice)

const callBuyPayoff = (curPrice, strikePrice) => { return Math.max(curPrice - strikePrice, 0) }

const putBuyPayoff = (curPrice, strikePrice) => { return Math.max(strikePrice - curPrice, 0) }

let stdDev = 19 // SPY std dev for past 3 years
let stockPrice = 100
let strikePrice = 100
let rfr = 0.0375; // Risk free rate
let totalTime = 1; // 1.5 years

function App() {

  const [steps, setSteps] = useState(1);
  const [deltaT, setDeltaT] =  useState(steps / steps);
  const [upMove, setUpMove] = useState(() => upSize(stdDev, deltaT));
  const [downMove, setDownMove] = useState(() => downSize(stdDev, deltaT));
  const [riskNeutralProbability, setRiskNeutralProbability] = useState(0);

  useEffect(() => {
    let RNPUP = (Math.exp(rfr * deltaT) - downMove) / (upMove - downMove)
    setRiskNeutralProbability(round(RNPUP, 4));
  }, [downMove, upMove, deltaT])

  const updateTimeStep = (timeSteps) => {
    setSteps(timeSteps) // Number of steps in total time
    let newDeltaT = timeSteps / timeSteps;
    setDeltaT(newDeltaT) // Amount of time between each step (totalTime / timeSteps)
    // EX: If total time was 5 years and we had 5 steps, deltaT = 1 year
    // Just need to figure out if we want a fixed time till expiration or just deltaT always = 1 year vs 1 month, weigh options later

    // Size of up/down moves (functions return a %, stdDev whole number)
    let newUpMove = upSize(stdDev, newDeltaT);
    let newDownMove = downSize(stdDev, newDeltaT);
    setUpMove(newUpMove);
    setDownMove(newDownMove);

    let RNPUP = (Math.exp(rfr * deltaT) - downMove) / (upMove - downMove)
    setRiskNeutralProbability(round(RNPUP, 4));
  }

  // Modified dummy data function
  const createData = (deltaT, curSteps, price) => {

    let payoff = putBuyPayoff(price, strikePrice);  //callBuyPayoff(price, strikePrice);
    
    // For child nodes, option value is just payoff
    let optionValue = payoff

    // At children of tree, calculate payoff
    if (curSteps === 0) {
      return { name: `${round(price, 3)} (${round(payoff, 3)})`, optionValue: optionValue };
    }

    // Price for nodes in futures where stock goes up and down
    let upPrice = price * upMove
    let downPrice = price * downMove

    // Create nodes for graph recursively
    let upChild = createData(deltaT, curSteps - 1, upPrice);
    let downChild = createData(deltaT, curSteps - 1, downPrice)
    
    // Expected value ( (probability of up * up price) + (probability of down * down price) )
    let expectedValue = (riskNeutralProbability * upChild.optionValue) + ((1-riskNeutralProbability) * downChild.optionValue)

    // Discount expected value by risk free rate
    let discountedValue = expectedValue * Math.exp((-1) * rfr * deltaT); // THIS IS THE CALL OPTIONS VALUE

    // Price if option was sold now = strike price - stock price at node
    let earlyExercise = payoff;
    
    // For non-child nodes, optionValue is discounted value or price if option was sold now
    optionValue = Math.max(earlyExercise, discountedValue)

    return {
      name: `${round(price, 3)} (${round(optionValue, 3)})`,
      children: [upChild, downChild],
      optionValue: optionValue
    };
  };

  let data = createData(deltaT, steps, stockPrice);

  // If duplicate prices, set them to be the same node (for one of them, set parent.right = other parent.right, then delete the other extra one). Probably just going to need new graph library for this

  return (
    <div className="App">
      <h1>Binomial Tree Model Visualization</h1>
      <div>
        <label>Timesteps: </label>
        <input type="range" min="1" max="5" value={steps} 
          className="slider" onChange={(e) => updateTimeStep(Number(e.target.value))} />
        <span>{steps}</span>
        <p>Delta T: {deltaT}, rfr: {rfr}, riskNeutralProbability: {riskNeutralProbability} </p>
        <p>stdDev: {stdDev}, strikePrice: {strikePrice}, stockPrice: {stockPrice} </p>
        <p>u: {upMove}, d: {downMove} </p>
      </div>
      <Tree
        key={steps}
        data={data}
        height={200 + 500 * (steps/5)}
        width={500 + 580 * (steps/5)}
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
