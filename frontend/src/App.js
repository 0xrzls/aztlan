import React from 'react';
import { UserProvider } from './context/UserContext';
import { WalletProvider } from './context/WalletContext';
import HomePage from './pages/HomePage';
import './styles.css';

function App() {
  return (
    <WalletProvider>
      <UserProvider>
        <HomePage />
      </UserProvider>
    </WalletProvider>
  );
}

export default App;
