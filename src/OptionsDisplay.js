import { useNavigate } from 'react-router-dom';
import React from 'react';
import './OptionsDisplay.css';

function OptionsDisplay({optionsContracts, setSelectedOption}) {
    let navigate = useNavigate();
    
    return (
        <div>
            <div className="options-display">
                <h2>Select an Options Contract</h2>
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