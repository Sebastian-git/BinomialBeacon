import React, { useEffect, useState } from 'react';
import './App.css';
import ReactECharts from 'echarts-for-react';

function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

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
    id = 0;
    map = {};
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

  let id = 0;
  let map = {};
  let duplicates = []

  // Modified dummy data function
  const createData = (deltaT, curSteps, price, parent, root) => {

    let payoff = putBuyPayoff(price, strikePrice);  //callBuyPayoff(price, strikePrice);
    
    // For child nodes, option value is just payoff
    let optionValue = payoff

    // At children of tree, calculate payoff
    if (curSteps === 0) {
      return { name: `${round(price, 3)} (${round(payoff, 3)}) ${curSteps}`, optionValue: optionValue }; 
    }

    // Price for nodes in futures where stock goes up and down
    let upPrice = price * upMove
    let downPrice = price * downMove

    // Create nodes for graph recursively
    let upChild = createData(deltaT, curSteps - 1, upPrice, curSteps, root);
    let downChild = createData(deltaT, curSteps - 1, downPrice, curSteps, root);
    
    // Expected value ( (probability of up * up price) + (probability of down * down price) )
    let expectedValue = (riskNeutralProbability * upChild.optionValue) + ((1-riskNeutralProbability) * downChild.optionValue)

    // Discount expected value by risk free rate
    let discountedValue = expectedValue * Math.exp((-1) * rfr * deltaT); // THIS IS THE CALL OPTIONS VALUE

    // Price if option was sold now = strike price - stock price at node
    let earlyExercise = payoff;
    
    // For non-child nodes, optionValue is discounted value or price if option was sold now
    optionValue = Math.max(earlyExercise, discountedValue)

    let node = {
      name: `${round(price, 3)} (${round(optionValue, 3)}) ${curSteps}`,
      children: [upChild, downChild],
      optionValue: optionValue
    };

    if (map[node.name] && map[node.name].parent === parent) {
      if (parent) {
        duplicates.push(node.name)
        console.log("added duplicate", node.name)
      }
    } else {
      node.parent = parent
      map[node.name] = node
    }
    return node;
  };

  // If duplicate prices, set them to be the same node (for one of them, set parent.right = other parent.right, then delete the other extra one). Probably just going to need new graph library for this
  let root = {
    name: `${round(stockPrice, 3)} (0) 0-0`,
    children: [],
    optionValue: 0
  };

  const [data, setData] = useState(root);

  const removeDuplicates = (root) => {

    let level = [root];
    let leftParent = null;
    let rightParent = null;
    let deleteChild = null;
    let keepChild = null;

    const fillInfo = (cur, child, index) => {
      // Always delete left child
      if (index == 0) {
        leftParent = cur;
        deleteChild = child;
      }
      else {
        rightParent = cur;
        keepChild = child;
      }
    }

    while (level.length > 0) {
      let newLevel = []
      while (level.length > 0) {
        let cur = level.pop();
        // console.log("searching", cur)
        if (!cur.children || cur.children.length === 0) continue;
        let left = cur.children[0], right = cur.children[1];
        if (left.name === duplicates[0] || right.name === duplicates[0]) {
          if (left.name === duplicates[0]) fillInfo(cur, left, 0);
          if (right.name === duplicates[0]) fillInfo(cur, right, 1);
          if (keepChild !== null) {
            console.log("ready:", leftParent)
            leftParent.children[0] = 0
          }
        }
        newLevel.push(left)
        newLevel.push(right)
      }
      level = newLevel
    }

  }

  useEffect(() => {
    // Update data whenever steps, upMove, downMove, or riskNeutralProbability changes
    root = createData(deltaT, steps, stockPrice, null, root);
    if (duplicates.length > 0) {
      console.log("HERE", duplicates)
      removeDuplicates(root)
    }
    // console.log("root:", root)
    setData(root);
  }, [steps, upMove, downMove, riskNeutralProbability]);


// Then use the data state variable in getOption
const getOption = () => {
  return {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove'
    },
    series: [
      {
        type: 'tree',
        data: [data], // Use the data state variable here
        top: '1%',
        left: '7%',
        bottom: '1%',
        right: '20%',
        symbolSize: 15,
        label: {
          position: [50, 30],
          verticalAlign: 'middle',
          align: 'right',
          fontSize: 15
        },
        leaves: {
          label: {
            position: 'right',
            verticalAlign: 'middle',
            align: 'left'
          }
        },
        expandAndCollapse: false,
        animationDuration: 300,
        animationDurationUpdate: 750
      }
    ]
  };
};


return (
  <div className="App">
    <h1>Binomial Tree Model Visualization</h1>
    <div>
      <div>
        <label>Timesteps: </label>
        <input type="range" min="1" max="5" value={steps} 
          className="slider" onChange={(e) => updateTimeStep(Number(e.target.value))} />
        <span>{steps}</span>
        <p>Delta T: {deltaT}, rfr: {rfr}, riskNeutralProbability: {riskNeutralProbability} </p>
        <p>stdDev: {stdDev}, strikePrice: {strikePrice}, stockPrice: {stockPrice} </p>
        <p>u: {upMove}, d: {downMove} </p>
      </div>
    </div>
    <ReactECharts option={getOption()} style={{height: '80vh', width: '100%'}}/>
  </div>
);
}

export default App;