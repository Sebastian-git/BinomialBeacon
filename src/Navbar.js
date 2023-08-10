import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { useNavigate } from 'react-router-dom';
import "./Navbar.css"

function Navbar({ resetData }) {
  let navigate = useNavigate();

  return (
    <div className="navbar">
      <p className="title" onClick={() => {
        resetData();
        navigate("/");
      }}>
        Binomial Beacon
      </p>
      <p className="motto">Lighting the way in options pricing</p>
      <a href="https://github.com/Sebastian-git/BinomialBeacon" target="_blank" rel="noopener noreferrer" className="github-icon">
        <FontAwesomeIcon icon={faGithub} size="2x" />
      </a>
    </div>
  );
}

export default Navbar;
