import React, { useEffect, useState } from 'react';
import './App.css';

const ENDPOINTS = {
  RPC: 'http://localhost:26657',
  API: 'http://localhost:1317',
};

const App: React.FC = () => {
  const [chainTime, setChainTime] = useState<number | null>(null);
  const [clientTime, setClientTime] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    const fetchTime = async () => {
      const response = await fetch(
        `${ENDPOINTS.API}/agoric/vstorage/data/published.chainTimer.Time`,
      );
      const data = await response.json();
      console.log(JSON.parse(data.value).blockHeight);
      
      setChainTime(JSON.parse(data.value).blockHeight);
    };

    const intervalId = setInterval(fetchTime, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const updateClientTime = () => {
      setClientTime(new Date().getSeconds().toString());
    };

    const clientTimeIntervalId = setInterval(updateClientTime, 1000);

    return () => clearInterval(clientTimeIntervalId);
  }, []);

  return (
    <div className="app-container" style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '4rem',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Chain Time</h2>
        <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>
          {chainTime !== null ? chainTime : 'Loading...'}
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Local Time</h2>
        <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>
          {clientTime}
        </div>
      </div>
    </div>
  );
};

export default App;