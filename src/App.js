import { up_size, down_size, call_buy_payoff, put_buy_payoff, get_rnp } from "./wasm-lib/pkg";
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { faArrowsToEye } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState, useRef } from 'react';
import PolygonOptionsData from './optionsDataInterface';
import OptionsDisplay from './OptionsDisplay';
import ReactECharts from 'echarts-for-react';
import Navbar from './Navbar';
import './App.css';

const TOTAL_STEPS = 20;
const POLYGON_OPTIONS_DATA = new PolygonOptionsData();

function App() {
  return (
    <Router basename={process.env.PUBLIC_URL}>
      <MainApp />
    </Router>
  );
}
// strike 325, exp 08/18/23, newstrike 320.40, tte 
// strike 325, exp 02/16/24, newstirke 320.40
function useLocalStorageState(key, defaultValue) {
  let storedValue;
  try {
      storedValue = JSON.parse(localStorage.getItem(key));
  } catch (error) {
      storedValue = localStorage.getItem(key);
  }
  const [value, setValue] = useState(storedValue || defaultValue);
  useEffect(() => {
      if ((Array.isArray(value) && value.length > 0) || (!Array.isArray(value) && value !== defaultValue))
          localStorage.setItem(key, JSON.stringify(value));
  }, [key, value, defaultValue]);
  return [value, setValue];
}


function MainApp() {
  const [optionsContracts, setOptionsContracts] = useLocalStorageState('optionsContracts', []);
  const [selectedOption, setSelectedOption] = useLocalStorageState('selectedOption', null);
  const [timeToExpiration, setTimeToExpiration] = useLocalStorageState("totalTime", 1);
  const [strikePrice, setStrikePrice] = useLocalStorageState('strikePrice', 100);
  const [stockTicker, setStockTicker] = useLocalStorageState("stockTicker", "");
  const [dataLoaded, setDataLoaded] = useLocalStorageState("dataLoaded", false);
  const [stockPrice, setStockPrice] = useLocalStorageState("stockPrice", 100);
  const [stdDev, setStdDev] = useLocalStorageState('stdDev', 19);
  const [steps, setSteps] = useLocalStorageState('steps', 1);
  const [RFR, setRFR] = useLocalStorageState("RFR", 0.05);
  const [optionType, setOptionType] = useState("call");
  const [searched, setSearched] = useState(false);
  
  const resetData = () => {
    setSelectedOption(null);
    setOptionType("call");
    setDataLoaded(false);
    setStrikePrice(100);
    setSearched(false);
    setStockTicker("");
    setStockPrice(100);
    setStdDev(19);
    setSteps(1);
    localStorage.removeItem("optionsContracts");
    localStorage.removeItem("timeToExpiration");
    localStorage.removeItem("selectedOption");
    localStorage.removeItem("stockTicker");
    localStorage.removeItem("strikePrice");
    localStorage.removeItem("dataLoaded");
    localStorage.removeItem("stockPrice");
    localStorage.removeItem("stdDev");
    localStorage.removeItem("steps");
    localStorage.removeItem("RFR");
  };

  useEffect(() => {
    if (selectedOption !== null) 
        localStorage.setItem('selectedOption', JSON.stringify(selectedOption));
    if (Array.isArray(optionsContracts) && optionsContracts.length > 0)
        localStorage.setItem('optionsContracts', JSON.stringify(optionsContracts));
    if (stockTicker !== "")
        localStorage.setItem("stockTicker", stockTicker);
    if (dataLoaded !== false) 
        localStorage.setItem("dataLoaded", true);
    if (selectedOption !== null && stockTicker !== "") {
      localStorage.setItem("timeToExpiration", timeToExpiration);
      localStorage.setItem("strikePrice", strikePrice);
      localStorage.setItem("stockPrice", stockPrice);
      localStorage.setItem("steps", steps);
      localStorage.setItem("RFR", RFR)
    }
  }, [optionsContracts, selectedOption, stockTicker, dataLoaded, steps]);

  return (
    <>
      <Navbar resetData={resetData} /> 
      <Routes>
        <Route path="/" element={<Dashboard 
          optionsContracts={optionsContracts} 
          setOptionsContracts={setOptionsContracts} 
          selectedOption={selectedOption} 
          setSelectedOption={setSelectedOption} 
          stockTicker={stockTicker} 
          setStockTicker={setStockTicker} 
          searched={searched} 
          setSearched={setSearched} 
          stockPrice={stockPrice} 
          setStockPrice={setStockPrice} 
          strikePrice={strikePrice} 
          setStrikePrice={setStrikePrice}
          resetData={resetData}
          optionType={optionType}
          setOptionType={setOptionType}
          dataLoaded={dataLoaded}
          setDataLoaded={setDataLoaded}
          stdDev={stdDev}
          setStdDev={setStdDev}
          steps={steps}
          setSteps={setSteps}
          RFR={RFR}
          setRFR={setRFR}
          timeToExpiration={timeToExpiration}
          setTimeToExpiration={setTimeToExpiration}
        />} />
        <Route path="/optionsDisplay" element={<OptionsDisplay optionsContracts={optionsContracts} setSelectedOption={setSelectedOption} resetData={resetData} />} />
      </Routes>
    </>
  );
}

function Dashboard({
  optionsContracts, 
  setOptionsContracts, 
  selectedOption, 
  setSelectedOption, 
  stockTicker, 
  setStockTicker, 
  searched, 
  setSearched, 
  stockPrice, 
  setStockPrice, 
  strikePrice, 
  setStrikePrice,
  resetData,
  optionType,
  setOptionType,
  dataLoaded,
  setDataLoaded,
  stdDev,
  setStdDev,
  steps,
  setSteps,
  RFR,
  setRFR,
  timeToExpiration,
  setTimeToExpiration
}) {

  const [riskNeutralProbability, setRiskNeutralProbability] = useState(0);
  const [centerGraphTooltip, setCenterGraphTooltip] = useState(false);
  const [invalidStockTooltip, setInvalidStockTooltip] = useState(false);
  const [deltaT, setDeltaT] =  useState(steps / steps);
  const [downMove, setDownMove] = useState(() => down_size(stdDev, deltaT));
  const [upMove, setUpMove] = useState(() => up_size(stdDev, deltaT));
  const [resetCount, setResetCount] = useState(0);
  const echartRef = useRef(null);
  const navigate = useNavigate();
  let map = {};
  var id = 0;
  let root = {
    name: `${stockPrice, 3} (0) 0-0`,
    children: [],
    optionValue: 0
  };
  const [nodes, setNodes] = useState([root]);
  const [links, setLinks] = useState([]);

  useEffect(() => {
    updateTimeStep(steps);
  }, []); 

  useEffect(() => {
    if (selectedOption) {
      setStrikePrice(selectedOption.strikePrice);
      if (searched) {
        getRFR();
        getStockData();
        getTimeToExpiration();
      }
    }
  }, [selectedOption]);
  
  useEffect(() => {
    const chartInstance = echartRef.current.getEchartsInstance();
    chartInstance.clear(); 
    chartInstance.setOption(getGraphOption());
  }, [resetCount]);

  useEffect(() => {
    id = 0;
    map = {};
    let graphData = createGraphData(steps, stockPrice, 0, optionType);
    graphData.nodes.forEach(node => {
      node.name = node.name.replace(/\n.*$/, '');
      if (node.optionValue <= 0) {
        node.itemStyle = { color: 'red'}
      } else {
        node.itemStyle = { color: 'green'}
      }
      if (steps < 7)  node.name = `Stock Price: $${node.name}\nOption Price: $${node.optionPrice.toFixed(2)}`
      else if (steps < 15) node.name = `$${node.optionPrice.toFixed(2)}`
    });
    setNodes(graphData.nodes);
    setLinks(graphData.links);
  }, [steps, upMove, downMove, riskNeutralProbability, optionType, stockPrice, stdDev]);

  const updateTimeStep = (timeSteps) => {
    id = 0;
    map = {};
    let newDeltaT = (timeToExpiration / timeSteps) || 1;
    let newUpMove = up_size(stdDev, newDeltaT);
    let newDownMove = (1/newUpMove) //down_size(stdDev, newDeltaT);
    let newRNP = get_rnp(RFR, newDeltaT, newUpMove, newDownMove)
    setSteps(timeSteps) 
    setDeltaT(newDeltaT) 
    setUpMove(newUpMove);
    setDownMove(newDownMove);
    setRiskNeutralProbability(newRNP);
  }

  const createGraphData = (curSteps, price, id = 0, optionType) => {
    let payoff;
    if (optionType === "call") payoff = call_buy_payoff(price, strikePrice);
    else if (optionType === "put") payoff = put_buy_payoff(price, strikePrice);
    let optionValue = payoff;
    let nodeName = `${price.toFixed(2)} \n${curSteps}-${id}`; //(${optionValue.toFixed(2)})
    if (map[nodeName]) {
      return { nodes: [], links: [], name: nodeName, optionPrice: price };
    }
    let node = {
      name: nodeName,
      value: "this is the value",
      id: nodeName,
      optionValue: optionValue, 
      optionPrice: price,
      x: (steps - curSteps) * 100 * steps,
      y: -id * 25 * steps,
      tooltip: {
        formatter:  (value) => `Time Step: ${steps - curSteps} <hr /> Original Stock Price: $${price.toFixed(2)} <hr /> New Option Price: $${node.optionPrice.toFixed(2)} <hr /> stock = parent price x (1 +/- up move / 100) <hr /> ${price.toFixed(2)} = parent price x (1 +/- ${(upMove/100).toFixed(2)})`
      }
    };
    map[nodeName] = node;
    if (curSteps === 0) {
      return { nodes: [node], links: [], optionPrice: price };
    }
    let upPrice = price * (1+upMove/100);
    let downPrice = price * (1-downMove/100);
    let upResult = createGraphData(curSteps - 1, upPrice, id + 1, optionType);
    let downResult = createGraphData(curSteps - 1, downPrice, id - 1, optionType);
    node.optionPrice = upResult.optionPrice*riskNeutralProbability + downResult.optionPrice*(1-riskNeutralProbability)
    node.tooltip = {
      formatter:  (value) => `Time Step: ${steps - curSteps} <hr /> Original Stock Price: $${price.toFixed(2)} <hr /> New Option Price: $${node.optionPrice.toFixed(2)} <hr /> option = (up * RNP) + (down * RNP) <hr /> ${node.optionPrice.toFixed(2)} = (${upResult.optionPrice.toFixed(2)} x ${riskNeutralProbability.toFixed(2)}) + (${downResult.optionPrice.toFixed(2)} * ${1-riskNeutralProbability.toFixed(2)}) <hr /> <a target="_blank" href="https://www.macroption.com/cox-ross-rubinstein-formulas/">Learn more about this model</a>`
    }
    
    let linkToUpChild = { source: node.name, target: upResult.nodes[0]?.name, tooltip: { show: false } };
    let linkToDownChild = { source: node.name, target: downResult.nodes[0]?.name, tooltip: { show: false } };
    if (upResult.nodes.length == 0) linkToUpChild.target = upResult.name
    return {
      nodes: [node, ...upResult.nodes, ...downResult.nodes],
      links: [linkToUpChild, linkToDownChild, ...upResult.links, ...downResult.links],
      optionPrice: price
    };
  };

  const getGraphOption = () => {
    return {
      tooltip: {
        textStyle: { fontSize: 20 },
        enterable: true,
        confine: true,
        trigger: "item",

      },
      animationDurationUpdate: 300,
      animationEasingUpdate: 'quinticInOut',
      series: [
        {
          type: 'graph',
          layout: 'none',
          symbolSize: Math.max(7, 35 - (Math.pow(2, steps/4.5))),
          roam: true,
          label: {
            show: steps < 15,
            color: "white",
            fontSize: steps < 7 ? 16 - Math.min(steps/2, 8) : 22 - Math.min(steps/2, 8),
            position: steps < 7 ? [-60, 35 - (steps)] : [-10, 40 - (steps)],
          },
          edgeSymbol: ['circle', 'arrow'],
          edgeSymbolSize: [4, 15],
          data: nodes,
          links: links,
          lineStyle: { width: 4, curveness: 0 }
        }
      ]
    };
  };

  const handleStockTickerChange = (event) => {
    let newTicker = event.target.value.toUpperCase();
    if (newTicker.length > 5) {
      setInvalidStockTooltip(true);
      return;
    }
    else if (newTicker.length < 6 && invalidStockTooltip === true)  {
      setInvalidStockTooltip(false);
    }
    setStockTicker(newTicker);
  };

  const groupContractsByExpiration = (options) => {
    let grouped = {};
    options.forEach(contract => {
        if (!grouped[contract.expiration_date]) {
            grouped[contract.expiration_date] = [];
        }
        grouped[contract.expiration_date].push({
            ticker: contract.ticker,
            expirationDate: contract.expiration_date,
            strikePrice: contract.strike_price
        });
    });
    return Object.values(grouped);
  }

  function calculateAverages(groupedContracts) {
    return groupedContracts.map(contracts => {
        const sum = contracts.reduce((acc, contract) => acc + contract.strikePrice, 0);
        return sum / contracts.length;
    });
  }
  
  const calculateStdDev = (groupedContracts, averageStrikePrices) => {
    return groupedContracts.map((contracts, index) => {
      const avg = averageStrikePrices[index];
      const varianceSum = contracts.reduce((acc, contract) => acc + (contract.strikePrice - avg) ** 2, 0);
      return Math.sqrt(varianceSum / contracts.length);
    });
  }

  const getNine = (group, stdDev) => {
    let middle = Math.floor(group.length / 2);
    let jumpDistance = stdDev/4;
    let res = [group[middle]];
    let l = middle-1, r = middle+1;
    for (let i = 1; i <= 4 && l >= 0; i++) {
        while (l >= 0 && group[l].strikePrice > group[middle].strikePrice - i * jumpDistance) 
            l--;
        if (l >= 0) 
          res.push(group[l]);
    }
    for (let i = 1; i <= 4 && r < group.length; i++) {
        while (r < group.length && group[r].strikePrice < group[middle].strikePrice + i * jumpDistance)
          r++;
        if (r < group.length) 
          res.push(group[r]);
    }
    return res.sort((a, b) => a.strikePrice - b.strikePrice);
  }

  const getTimeToExpiration = () => {
    const expirationDate = new Date(selectedOption.expirationDate);
    const currentDate = new Date();
    const timeDiffInDays = Math.round((expirationDate - currentDate) / (1000 * 60 * 60 * 24))
    const timeToExpirationInYears = timeDiffInDays / 365;
    setTimeToExpiration(timeToExpirationInYears);
  }

  const getRFR = async () => {
    let newRFR = await POLYGON_OPTIONS_DATA.getRiskFreeRate();
    setRFR(newRFR);
  }

  const getStockData = async () => {
    await POLYGON_OPTIONS_DATA.getDailyClosingPrices(stockTicker);
    let newPrice = await POLYGON_OPTIONS_DATA.getStockPrice(stockTicker)
    let newStdDev = await POLYGON_OPTIONS_DATA.getStandardDeviation(stockTicker)
    setStdDev(newStdDev.toFixed(2), 4)
    setStockPrice(newPrice)
    setDataLoaded(true);
  };
  
  const getOptionsContracts = async () => {
    let options = await POLYGON_OPTIONS_DATA.getOptionsContracts({
      "underlying_ticker": stockTicker,
      "contract_type": optionType,
      "limit": 1000,
      "sort": "expiration_date"
    });
    if (options.length === 0) {
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
      setInvalidStockTooltip(true);
      setTimeout(() => {
        setInvalidStockTooltip(false);
      }, 3000);
      return;
    }

    const groupedContracts = groupContractsByExpiration(options);
    const averageStrikePrices = calculateAverages(groupedContracts);
    const stdDevs = calculateStdDev(groupedContracts, averageStrikePrices);

    const trimmedGroup = groupedContracts.map((group, i) => getNine(group, stdDevs[i]));
    setOptionsContracts(trimmedGroup);
    navigate("/optionsDisplay", { state: { optionsContracts: trimmedGroup } });
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainApp />}></Route>
                <Route path="/optionsDisplay" element={<OptionsDisplay />} />
            </Routes>
        </Router>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (stockTicker.length > 5 || stockTicker.length <= 0 || invalidStockTooltip) {
      setInvalidStockTooltip(true);
      return;
    }
    if (searched || dataLoaded) {
      resetData();
      setResetCount();
    } else {
      setSearched(true);
      getOptionsContracts();
    }
  };

  const handleOptionTypeChange = (event) => {
    setOptionType(event.target.value);
  }

  return (
    <div className="app-wrapper">
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
        
        <button id="recenter-graph-button" onClick={() => setResetCount(resetCount + 1)} onMouseEnter={() => setCenterGraphTooltip(true)} onMouseLeave={() => setCenterGraphTooltip(false)} >
          {centerGraphTooltip && <div id="refresh-graph-tooltip">Re-center graph</div>}
          <FontAwesomeIcon id="refresh-graph-icon" icon={faArrowsToEye} />
        </button>
      </div>

      <div>
        <form onSubmit={handleSubmit} className="form-wrapper">
          {!dataLoaded && (
            <>
              <div className="form-item">
                <label htmlFor="stock-ticker" className="form-name">Stock ticker</label>
                <input id="stock-ticker-input" type="text" value={stockTicker} onChange={handleStockTickerChange} />
                {invalidStockTooltip && <div id="invalid-ticker-tooltip">Invalid Ticker</div>}
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
              <input type="range" min="1" max={TOTAL_STEPS} value={steps}
                onChange={(e) => updateTimeStep(Number(e.target.value))} />
            </div>
          )}
          <div className="form-item">
            <button className="btn-search" type="submit">{dataLoaded ? 'Reset' : 'Search'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App