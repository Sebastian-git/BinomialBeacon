import init from "./wasm-lib/pkg"
import ReactDOM from 'react-dom/client';
import React from 'react';
import App from './App';
import './index.css';

init().then(() => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});