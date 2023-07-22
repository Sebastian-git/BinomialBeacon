import React, { useEffect, useState } from 'react';
import './App.css';
import ReactECharts from 'echarts-for-react';

function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

const upSize = (stdDev, deltaT) => { return Math.exp((stdDev * 0.01) * Math.sqrt(deltaT)) };

const downSize = (stdDev, deltaT) => { return 1.0/(Math.exp((stdDev * 0.01) * Math.sqrt(deltaT))) };

const callBuyPayoff = (curPrice, strikePrice) => { return Math.max(curPrice - strikePrice, 0) }

const putBuyPayoff = (curPrice, strikePrice) => { return Math.max(strikePrice - curPrice, 0) }

let stdDev = 19 // SPY std dev for past 3 years
let stockPrice = 100
let strikePrice = 100
let rfr = 0.0375; // Risk free rate
let totalTime = 10; // n years

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
  let siblings = {}

  const createGraphData = (deltaT, curSteps, price, id = 0, parentId = null) => {
    let payoff = callBuyPayoff(price, strikePrice);
    let optionValue = payoff;
  
    let x = (steps - curSteps) * 300 * steps;
    let y = id * 100 * steps;
  
    let nodeName = `${round(price, 3)} (${round(optionValue, 3)}) \n${curSteps}-${id}`;
  
    if (map[nodeName]) {
      return { nodes: [], links: [] };
    }
  
    let node = {
      name: nodeName,
      id: nodeName,
      optionValue: optionValue, 
      x: x,
      y: y,
    };
  
    map[nodeName] = node;
  
    if (curSteps === 0) {
      return {
        nodes: [node],
        links: []
      }; 
    }
  
    let upPrice = price * upMove;
    let downPrice = price * downMove;
  
    let upResult = createGraphData(deltaT, curSteps - 1, upPrice, id + 1, nodeName);
    let downResult = createGraphData(deltaT, curSteps - 1, downPrice, id - 1, nodeName);
  
    let linkToUpChild = {
      source: node.name,
      target: upResult.nodes[0]?.name
    };
  
    let linkToDownChild = {
      source: node.name,
      target: downResult.nodes[0]?.name
    };

    siblings[upResult.nodes[0]?.name] = downResult.nodes[0]?.name
    siblings[downResult.nodes[0]?.name] = upResult.nodes[0]?.name
  
    return {
      nodes: [node, ...upResult.nodes, ...downResult.nodes],
      links: [linkToUpChild, linkToDownChild, ...upResult.links, ...downResult.links]
    };
  };

  let root = {
    name: `${round(stockPrice, 3)} (0) 0-0`,
    children: [],
    optionValue: 0
  };

  const [nodes, setNodes] = useState([root]);
  const [links, setLinks] = useState([]);

  useEffect(() => {
    let graphData = createGraphData(deltaT, steps, stockPrice, null, root);
    graphData.nodes.forEach(node => {
      node.name = node.name.replace(/\n.*$/, '');
    });
    setNodes(graphData.nodes);
    setLinks(graphData.links);
  }, [steps, upMove, downMove, riskNeutralProbability]);  

  const getGraphOption = () => {
    return {
      tooltip: {},
      animationDurationUpdate: 300,
      animationEasingUpdate: 'quinticInOut',
      series: [
        {
          type: 'graph',
          layout: 'none',
          symbolSize: 30,
          roam: true,
          label: {
            show: true,
            color: "black",
            fontSize: 20 - (steps/2),
            position: [-35, 35]
          },
          edgeSymbol: ['circle', 'arrow'],
          edgeSymbolSize: [4, 10],
          edgeLabel: {
            fontSize: 20 - (steps/4),
          },
          data: nodes,
          links: links,
          lineStyle: {
            width: 4,
            curveness: 0
          }
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
          <input type="range" min="1" max={totalTime} value={steps} 
            className="slider" onChange={(e) => updateTimeStep(Number(e.target.value))} />
          <span>{steps}</span>
          <p>Delta T: {deltaT}, rfr: {rfr}, riskNeutralProbability: {riskNeutralProbability} </p>
          <p>stdDev: {stdDev}, strikePrice: {strikePrice}, stockPrice: {stockPrice} </p>
          <p>u: {upMove}, d: {downMove} </p>
        </div>
      </div>
      <ReactECharts option={getGraphOption()} style={{height: '80vh', width: '100%'}}/>
    </div>
  );
}

export default App;