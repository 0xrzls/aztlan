// src/index.js - FIXED VERSION
import './polyfills/process'; // Tambahkan ini sebagai import pertama
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
// ❌ REMOVED: import { BrowserRouter } from 'react-router-dom';
// ❌ REMOVED: import { WalletProvider } from './context/WalletContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* ❌ REMOVED: WalletProvider - sekarang pake Zustand */}
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
