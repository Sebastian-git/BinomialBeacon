import React, { useEffect, useState } from 'react';
import './App.css';
import ReactECharts from 'echarts-for-react';
import PolygonOptionsData from './api.ts'

function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

const upSize = (stdDev, deltaT) => { return Math.exp((stdDev * 0.01) * Math.sqrt(deltaT)) };

const downSize = (stdDev, deltaT) => { return 1.0/(Math.exp((stdDev * 0.01) * Math.sqrt(deltaT))) };

const callBuyPayoff = (curPrice, strikePrice) => { return Math.max(curPrice - strikePrice, 0) };

const putBuyPayoff = (curPrice, strikePrice) => { return Math.max(strikePrice - curPrice, 0) };

const getRNP = (rfr, deltaT, downMove, upMove) => { return (Math.exp(rfr * deltaT) - downMove) / (upMove - downMove) };

let strikePrice = 100
let rfr = 0.0375; 
let totalTime = 20;

let id = 0;
let map = {};
let siblings = {}
let children = {}
let fixMe = []
let missing = []

const polygonOptionsData = new PolygonOptionsData();

function App() {

  const [steps, setSteps] = useState(1);
  const [stdDev, setStdDev] = useState(19);
  const [stockPrice, setStockPrice] = useState(100);
  const [optionType, setOptionType] = useState("call");
  const [deltaT, setDeltaT] =  useState(steps / steps);
  const [upMove, setUpMove] = useState(() => upSize(stdDev, deltaT));
  const [downMove, setDownMove] = useState(() => downSize(stdDev, deltaT));
  const [riskNeutralProbability, setRiskNeutralProbability] = useState(0);
  
  useEffect(() => {
    let RNP = getRNP(rfr, deltaT, downMove, upMove)
    setRiskNeutralProbability(round(RNP, 4));
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

    let RNP = getRNP(rfr, deltaT, downMove, upMove)
    setRiskNeutralProbability(round(RNP, 4));
  }

  const createGraphData = (deltaT, curSteps, price, id = 0, parentId = null, optionType) => {
    let payoff;
    if (optionType == "call") {
      payoff = callBuyPayoff(price, strikePrice);
    }
    else if (optionType == "put") {
      payoff = putBuyPayoff(price, strikePrice);
    }
    
    let x = (steps - curSteps) * 100 * steps;
    let optionValue = payoff;
    let y = id * 25 * steps;
  
    let nodeName = `${round(price, 2)} (${round(optionValue, 2)}) \n${curSteps}-${id}`;
  
    if (map[nodeName]) {
      missing.push(nodeName.replace(/\n.*$/, ''))
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
  
    if (curSteps === 0) return { nodes: [node], links: [] }
  
    let upPrice = price * upMove;
    let downPrice = price * downMove;
  
    let upResult = createGraphData(deltaT, curSteps - 1, upPrice, id + 1, nodeName, optionType);
    let downResult = createGraphData(deltaT, curSteps - 1, downPrice, id - 1, nodeName, optionType);
  
    let linkToUpChild = {
      source: node.name,
      target: upResult.nodes[0]?.name
    };
  
    let linkToDownChild = {
      source: node.name,
      target: downResult.nodes[0]?.name
    };

    if (upResult.nodes.length === 0 || downResult.nodes.length === 0) {
      fixMe.push(nodeName.replace(/\n.*$/, ''))
    }

    siblings[upResult.nodes[0]?.name.replace(/\n.*$/, '')] = downResult.nodes[0]?.name
    siblings[downResult.nodes[0]?.name.replace(/\n.*$/, '')] = upResult.nodes[0]?.name
    children[nodeName.replace(/\n.*$/, '')] = [upResult, downResult]
  
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

  const resetGraphVariables = () => {
    id = 0;
    map = {};
    siblings = {};
    children = {};
    fixMe = [];
    missing = [];
  };

  useEffect(() => {
    resetGraphVariables();
    let graphData = createGraphData(deltaT, steps, stockPrice, null, root, optionType);

    graphData.nodes.forEach(node => {
      node.name = node.name.replace(/\n.*$/, '');
      if (node.optionValue <= 0) {
        if (true) { //!children[node.name]
          node.itemStyle = { color: 'red'}
          // console.log("node should be red:", node)
        }
      } else {
        node.itemStyle = { color: 'green'}
      }
    });
    setNodes(graphData.nodes);
    setLinks(graphData.links);
  }, [steps, upMove, downMove, riskNeutralProbability, optionType]); 
  

  const getGraphOption = () => {
    return {
      tooltip: {},
      animationDurationUpdate: 300,
      animationEasingUpdate: 'quinticInOut',
      series: [
        {
          type: 'graph',
          layout: 'none',
          symbolSize: Math.max(7, 30 - (Math.pow(2, steps/3))),
          roam: true,
          label: {
            show: true,
            color: "black",
            fontSize: 20 - Math.min(steps/2, 8),
            position: [-35, 35 - (steps)]
          },
          edgeSymbol: ['circle', 'arrow'],
          edgeSymbolSize: [4, 10],
          edgeLabel: {
            fontSize: 20 - Math.min(steps/2, 8),
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

  useEffect(() => {
    updateTimeStep(steps);
  }, []); 


  const [stockTicker, setStockTicker] = useState('');
  const [optionTicker, setOptionTicker] = useState('');

  const handleStockTickerChange = (event) => {
    let newTicker = event.target.value.toUpperCase()
    setStockTicker(newTicker);
  };

  const handleOptionTickerChange = (event) => {
    let newOptionTicker = event.target.value.toUpperCase()
    setOptionTicker(newOptionTicker);
  };

  const handleButtonClick = async () => {
    await polygonOptionsData.getDailyClosingPrices(stockTicker);
    let newPrice = await polygonOptionsData.getStockPrice(stockTicker)
    let newStdDev = await polygonOptionsData.getStandardDeviation(stockTicker)
    setStdDev(round(newStdDev, 4))
    setStockPrice(newPrice)
  };

  const handleOptionTypeChange = (event) => {
    setOptionType(event.target.value);
  }

  return (
    <div className="App">
    <div id="title-wrapper">
      <h1 className="title">Binomial Beacon</h1>
      <h2 className="motto">Lighting the way in options pricing</h2>
    </div>
      <div className="Container">
        <div className="Row">
          <div className="Col mb-3">
            <div className="Form">
              <div id="option-data">

                <div className="column">
                  <p className="option-data-info">Risk Neutral Probability: {riskNeutralProbability}</p>
                  <p className="option-data-info">Risk Free Rate: {rfr}</p>
                  <p className="option-data-info">
                    &#916;T = {deltaT}
                  </p>
                </div>
                <div className="column">
                  <p className="option-data-info">Strike Price = {strikePrice} </p>
                  <p className="option-data-info">Stock Price = {stockPrice} </p>
                  <p className="option-data-info">
                    &#963; = {stdDev}
                  </p>
                </div>

              </div>

              <div id="stock-form-wrapper">
                
                <div id="stock-input-wrapper">
                  <div className="stock-data">
                    <p>Stock Ticker:</p>
                    <p>Option Ticker:</p>
                  </div>

                  <div className="stock-data">
                    <input className="ticker-input" type="text" value={stockTicker} onChange={handleStockTickerChange} />
                    <input className="ticker-input" type="text" value={optionTicker} onChange={handleOptionTickerChange} />
                  </div>
                </div>

                <button className="fetch-stock-data-button" onClick={handleButtonClick}>
                  Fetch Data
                </button>
                
              </div>

              <div id="timestep-wrapper">
                <div id="timestep-input">
                  <p>Timesteps = {steps} </p>
                  <input type="range" min="1" max={totalTime} value={steps}
                    onChange={(e) => updateTimeStep(Number(e.target.value))} />
                </div>
                <div id="option-selections-wrapper">
                  <div className='option-type-wrapper'>
                    <label htmlFor="put">Put</label> <br />
                    <input type="radio" id="put" name="optionType" value="put" onChange={handleOptionTypeChange} checked={optionType === "put"} />
                  </div>
                  <div className='option-type-wrapper'>
                    <label htmlFor="call">Call</label> <br />
                    <input type="radio" id="call" name="optionType" value="call" onChange={handleOptionTypeChange} checked={optionType === "call"} />
                  </div>
                </div>
              </div>

            </div>
          </div>
          <div className="Col">
            <ReactECharts className="ReactECharts" option={getGraphOption()} style={{height: '69vh', width: '90vw', margin: "auto"}}/>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;