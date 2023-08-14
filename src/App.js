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

const RFR = 0.0375; 
const TOTAL_TIME = 30;

const polygonOptionsData = new PolygonOptionsData();

function App() {
  return (
    <Router basename={process.env.PUBLIC_URL}>
      <MainApp />
    </Router>
  );
}

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
  const [strikePrice, setStrikePrice] = useLocalStorageState('strikePrice', 100);
  const [stockTicker, setStockTicker] = useLocalStorageState("stockTicker", "");
  const [dataLoaded, setDataLoaded] = useLocalStorageState("dataLoaded", false);
  const [stockPrice, setStockPrice] = useLocalStorageState("stockPrice", 100);
  const [stdDev, setStdDev] = useLocalStorageState('stdDev', 19);
  const [steps, setSteps] = useLocalStorageState('steps', 1);
  
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
    localStorage.removeItem("selectedOption");
    localStorage.removeItem("stockTicker");
    localStorage.removeItem("strikePrice");
    localStorage.removeItem("dataLoaded");
    localStorage.removeItem("stockPrice");
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
      localStorage.setItem("strikePrice", strikePrice);
      localStorage.setItem("stockPrice", stockPrice);
    }
  }, [optionsContracts, selectedOption, stockTicker, dataLoaded]);

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
  setSteps
}) {

  const [riskNeutralProbability, setRiskNeutralProbability] = useState(0);
  const [centerGraphTooltip, setCenterGraphTooltip] = useState(false);
  const [invalidStockTooltip, setInvalidStockTooltip] = useState(false);
  const [deltaT, setDeltaT] =  useState(steps / steps);
  const [downMove, setDownMove] = useState(() => down_size(stdDev, deltaT));
  const [upMove, setUpMove] = useState(() => up_size(stdDev, deltaT));
  const [resetCount, setResetCount] = useState(0);
  const [links, setLinks] = useState([]);
  const echartRef = useRef(null);
  let navigate = useNavigate();
  var map = {};
  var id = 0;
  let root = {
    name: `${stockPrice, 3} (0) 0-0`,
    children: [],
    optionValue: 0
  };
  const [nodes, setNodes] = useState([root]);

  useEffect(() => {
    updateTimeStep(steps);
  }, []); 

  useEffect(() => {
    if (selectedOption) {
      setStrikePrice(selectedOption.strikePrice);
      if (searched) {
        getStockData();
      }
    }
  }, [selectedOption]);
  
  useEffect(() => {
    const chartInstance = echartRef.current.getEchartsInstance();
    chartInstance.clear(); 
    chartInstance.setOption(getGraphOption());
  }, [resetCount]);
  
  useEffect(() => {
    let RNP = get_rnp(RFR, deltaT, downMove, upMove)
    setRiskNeutralProbability(RNP, 4);
  }, [downMove, upMove, deltaT])

  useEffect(() => {
    resetGraphVariables();
    let graphData = createGraphData(deltaT, steps, stockPrice, null, optionType);

    graphData.nodes.forEach(node => {
      node.name = node.name.replace(/\n.*$/, '');
      if (node.optionValue <= 0) {
        node.itemStyle = { color: 'red'}
      } else {
        node.itemStyle = { color: 'green'}
      }
    });
    setNodes(graphData.nodes);
    setLinks(graphData.links);
  }, [steps, upMove, downMove, riskNeutralProbability, optionType, stockPrice, stdDev]);

  const resetGraphVariables = () => {
    id = 0;
    map = {};
  };

  const updateTimeStep = (timeSteps) => {
    id = 0;
    map = {};
    setSteps(timeSteps) 
    let newDeltaT = timeSteps / TOTAL_TIME;
    setDeltaT(newDeltaT) 

    // Size of up/down moves (functions return a %, stdDev whole number)
    let newUpMove = up_size(stdDev, newDeltaT);
    let newDownMove = down_size(stdDev, newDeltaT);
    setUpMove(newUpMove);
    setDownMove(newDownMove);

    let RNP = get_rnp(RFR, deltaT, downMove, upMove)
    setRiskNeutralProbability(RNP, 4);
  }

  const createGraphData = (deltaT, curSteps, price, id = 0, optionType) => {
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
  
    let nodeName = `${price.toFixed(2)} (${optionValue.toFixed(2)}) \n${curSteps}-${id}`;
  
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
  
    if (curSteps === 0) return { nodes: [node], links: [] }
  
    let upPrice = price * upMove;
    let downPrice = price * downMove;
  
    let upResult = createGraphData(deltaT, curSteps - 1, upPrice, id + 1, optionType);
    let downResult = createGraphData(deltaT, curSteps - 1, downPrice, id - 1, optionType);
  
    let linkToUpChild = {
      source: node.name,
      target: upResult.nodes[0]?.name
    };
  
    let linkToDownChild = {
      source: node.name,
      target: downResult.nodes[0]?.name
    };
  
    return {
      nodes: [node, ...upResult.nodes, ...downResult.nodes],
      links: [linkToUpChild, linkToDownChild, ...upResult.links, ...downResult.links]
    };
  };

  const getGraphOption = () => {
    return {
      tooltip: {},
      animationDurationUpdate: 300,
      animationEasingUpdate: 'quinticInOut',
      series: [
        {
          type: 'graph',
          layout: 'none',
          symbolSize: Math.max(7, 35 - (Math.pow(2, steps/3))),
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
  
  const getOptionsContracts = async () => {
    let options = await polygonOptionsData.getOptionsContracts({
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

  const getStockData = async () => {
    await polygonOptionsData.getDailyClosingPrices(stockTicker);
    let newPrice = await polygonOptionsData.getStockPrice(stockTicker)
    let newStdDev = await polygonOptionsData.getStandardDeviation(stockTicker)
    setStdDev(newStdDev.toFixed(2), 4)
    setStockPrice(newPrice)
    setDataLoaded(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (stockTicker.length > 5 || stockTicker.length <= 0 || invalidStockTooltip) {
      setInvalidStockTooltip(true);
      return;
    }
    console.log("handleSubmit",stockTicker, stockTicker.length)
    if (searched || dataLoaded) {
      resetData();
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
              <input type="range" min="1" max={TOTAL_TIME} value={steps}
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