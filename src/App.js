import { up_size, down_size, call_buy_payoff, put_buy_payoff, get_rnp } from "../build/binomialbeacon";
import { faArrowsToEye } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import React, { useEffect, useState, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import PolygonOptionsData from './api.ts'
import './App.css';

function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

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
  const [searched, setSearched] = useState(false);
  const [stockPrice, setStockPrice] = useState(100);
  const [stockTicker, setStockTicker] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [optionType, setOptionType] = useState("call");
  const [deltaT, setDeltaT] =  useState(steps / steps);
  const [centerGraphTooltip, setCenterGraphTooltip] = useState(false);
  const [upMove, setUpMove] = useState(() => up_size(stdDev, deltaT));
  const [downMove, setDownMove] = useState(() => down_size(stdDev, deltaT));
  const [riskNeutralProbability, setRiskNeutralProbability] = useState(0);

  const [resetCount, setResetCount] = useState(0);
  const echartRef = useRef(null);
  useEffect(() => {
    const chartInstance = echartRef.current.getEchartsInstance();
    chartInstance.clear(); 
    chartInstance.setOption(getGraphOption());
  }, [resetCount]);

  
  useEffect(() => {
    let RNP = get_rnp(rfr, deltaT, downMove, upMove)
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
    let newUpMove = up_size(stdDev, newDeltaT);
    let newDownMove = down_size(stdDev, newDeltaT);
    setUpMove(newUpMove);
    setDownMove(newDownMove);

    let RNP = get_rnp(rfr, deltaT, downMove, upMove)
    setRiskNeutralProbability(round(RNP, 4));
  }

  const createGraphData = (deltaT, curSteps, price, id = 0, parentId = null, optionType) => {
    let payoff;
    if (optionType === "call") {
      payoff = call_buy_payoff(price, strikePrice);
    }
    else if (optionType === "put") {
      payoff = put_buy_payoff(price, strikePrice);
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
  }, [steps, upMove, downMove, riskNeutralProbability, optionType, stockPrice, stdDev]);
  

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
            color: "white",
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

  const handleStockTickerChange = (event) => {
    let newTicker = event.target.value.toUpperCase()
    setStockTicker(newTicker);
  };

  const handleBoop = async () => {
    let queries = {
      "underlying_ticker": "MSFT",
      "contract_type": "call",
      "limit": 1000,
      "sort": "expiration_date"
    }
    let options = await polygonOptionsData.getOptionsContracts(queries);
    let res = options;
    console.log("options:", options)
    // Calculate average
    let curDate = 0, curSum = 0, curTotal;
    let dataPoints = [], localPoints = [];
    let averages = []; // [date1_avg, date2_avg, ...]
    res.forEach((contract_object) => {
      if (contract_object.expiration_date != curDate) {
        averages.push(curSum/curTotal);
        dataPoints.push(localPoints);
        curTotal = 0;
        curSum = 0;
        curDate = contract_object.expiration_date;
      }
      localPoints.push(
        { "expiration_date": contract_object.expiration_date, 
          "strike_price": contract_object.strike_price } );
      curSum += contract_object.strike_price
      curTotal += 1
    });
    console.log("averages:", averages);
    console.log("datapoints:", dataPoints)
    return
    
    options.sort((a, b) => {
      if (a.expiration_date > b.expiration_date) return 1;
      if (a.expiration_date < b.expiration_date) return -1;
      return a.strike_price - b.strike_price;
    });

    let groups = {};
    options.forEach(option => {
      let date = option.expiration_date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(option);
    });

    let result = [];
    for (let date in groups) {
      let group = groups[date];
      if (group.length >= 9) {
        let middleIndex = Math.floor(group.length / 2);
        let selectedOptions = group.slice(middleIndex - 4, middleIndex + 5);
        selectedOptions[4].strike_price = selectedOptions.reduce((total, option) => total + option.strike_price, 0) / selectedOptions.length;
        result = result.concat(selectedOptions);
      }
    }
    console.log("res:", result)
  }

  const handleButtonClick = async () => {
    await polygonOptionsData.getDailyClosingPrices(stockTicker);
    let newPrice = await polygonOptionsData.getStockPrice(stockTicker)
    let newStdDev = await polygonOptionsData.getStandardDeviation(stockTicker)
    setStdDev(round(newStdDev, 4))
    setStockPrice(newPrice)
    setDataLoaded(true);
  };
  
  const resetData = () => {
    setSearched(false);
    setStockTicker("");
    setOptionType("call");
    setDataLoaded(false);
    setStockPrice(100);
    strikePrice = 100
    setSteps(1);
    setStdDev(19);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searched) {
      resetData();
    } else {
      handleButtonClick();
      setSearched(true);
    }
  };

  const handleOptionTypeChange = (event) => {
    setOptionType(event.target.value);
  }

  return (
    <div className="app-wrapper">
      <div className="navbar">
        <p className="title" onClick={resetData}>Binomial Beacon</p>
        <p className="motto">Lighting the way in options pricing</p>
        <a href="https://github.com/Sebastian-git/BinomialBeacon" target="_blank" rel="noopener noreferrer" className="github-icon">
          <FontAwesomeIcon icon={faGithub} size="2x" />
        </a>
      </div>
  
      <div className="chart-wrapper">
        {dataLoaded && (
          <div id="stats-wrapper">
          <div className="stats-item">
            <label className="stats-name">Stock Ticker</label>
            <p className="stats-value">{stockTicker}</p>
          </div>
            <div className="stats-item">
              <label className="stats-name">Stock Price</label>
              <p className="stats-value">{stockPrice}</p>
            </div>
      
            <div className="stats-item">
              <label className="stats-name">Strike Price</label>
              <p className="stats-value">{strikePrice}</p>
            </div>
      
            <div className="stats-item">
              <label className="stats-name">Standard Deviation</label>
              <p className="stats-value">{stdDev}</p>
            </div>
          </div>
        )}
        <ReactECharts ref={echartRef} className="react-echarts" option={getGraphOption()} style={{height: '65vh', width: '90vw', margin: "auto"}}/>
        
        <button id="refresh-graph-button" onClick={() => setResetCount(resetCount + 1)} onMouseEnter={() => setCenterGraphTooltip(true)} onMouseLeave={() => setCenterGraphTooltip(false)} >
          {centerGraphTooltip && <div id="refresh-graph-tooltip">Re-center graph</div>}
          <FontAwesomeIcon id="refresh-graph-icon" icon={faArrowsToEye} />
        </button>
      </div>

      <div>
        <form onSubmit={handleSubmit} className="form-wrapper">
          {!searched && (
            <>
          <div className="form-item">
            <label htmlFor="stock-ticker" className="form-name">Stock ticker</label>
            <input id="stock-ticker-input" type="text" value={stockTicker} onChange={handleStockTickerChange} />
          </div>
            <div className="form-item">
              <label className="form-name">Option Type</label>
              <div id="option-type-wrapper">
                <div className="option-type-item">
                  <label htmlFor="put">Put</label>
                  <input type="radio" id="put" name="optionType" value="put" onChange={handleOptionTypeChange} checked={optionType === "put"} />
                </div>
                <div className="option-type-item">
                  <label htmlFor="call">Call</label>
                  <input type="radio" id="call" name="optionType" value="call" onChange={handleOptionTypeChange} checked={optionType === "call"} />
                </div>
              </div>
            </div>
            </>
          )}
          {dataLoaded && (
            <div id="timestep-control-input">
              <p>Timesteps = {steps} </p>
              <input type="range" min="1" max={totalTime} value={steps}
                onChange={(e) => updateTimeStep(Number(e.target.value))} />
            </div>
          )}
          <div className="form-item">
            <button className="btn-search" type="submit">{searched ? 'Reset' : 'Search'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;