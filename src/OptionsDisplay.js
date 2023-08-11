import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import './OptionsDisplay.css';

function OptionsDisplay({optionsContracts, setSelectedOption}) {
    let navigate = useNavigate();
    const location = useLocation();
    const [key, setKey] = useState(0);
    useEffect(() => {
        setKey(prevKey => prevKey + 1);
    }, [optionsContracts]);
    
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
