import { useNavigate } from 'react-router-dom';
import React, { useEffect } from 'react';
import './OptionsDisplay.css';

function OptionsDisplay({optionsContracts, setSelectedOption, resetData, stockTicker, stockPrice }) {
    
    const navigate = useNavigate();
    useEffect(() => {
        if (Array.isArray(optionsContracts) && optionsContracts.length == 0) {
            resetData();
            navigate("/");
        }
    }, [])
    return (
        <div>
            <div className="options-display">
                <div id="options-display-header">
                    <h2> Select an Options Contract </h2>
                    <h2> ({stockTicker} ${stockPrice})  </h2>
                </div>
                <div id="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Option Symbol</th>
                                <th>Strike Price</th>
                                <th>Expiration Date</th>
                            </tr>
                        </thead>
                    </table>
                    <div className="body-scroll-wrapper">
                        <table>
                            <tbody>
                                {optionsContracts.flatMap((group, groupIndex) => 
                                    group.map((option, index) => (
                                        <tr key={`${groupIndex}-${index}`} onClick={() => {
                                            setSelectedOption(option);
                                            navigate("/");
                                        }}>                              
                                            <td>{option.ticker}</td>
                                            <td>{option.strikePrice}</td>
                                            <td>{option.expirationDate}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );   
}

export default OptionsDisplay;
