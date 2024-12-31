import React, { useEffect, useState } from 'react';
import './App.css';

const ENDPOINTS = {
  RPC: 'http://localhost:26657',
  API: 'http://localhost:1317',
};

const App: React.FC = () => {
  const [chainTime, setChainTime] = useState<string | null>(null);
  const [clientTime, setClientTime] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    const fetchTime = async () => {
      const response = await fetch(
        `${ENDPOINTS.API}/agoric/vstorage/data/published.chainTimer.Time`,
      );
      const data = await response.json();
      const parsedData = JSON.parse(JSON.parse(data.value).values);
      
      let timestampSeconds = (parsedData).toString();
      const date = new Date(timestampSeconds*1000);
      setChainTime(date.toUTCString());
    };

    const intervalId = setInterval(fetchTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const updateClientTime = () => {
      setClientTime(new Date().toUTCString());
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
      gap: '6rem',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: '#fff',
    }}>
      <TimeDisplay
        title="Time on Chain"
        time={chainTime !== null ? chainTime : 'Loading...'}
        color="#4ecca3"
      />
      <div style={{ width: '2px', height: '300px', background: '#2d4059' }} />
      <TimeDisplay
        title="Time on Your Machine"
        time={clientTime}
        color="#00adb5"
      />
    </div>
  );
};

interface TimeDisplayProps {
  title: string;
  time: string;
  color: string;
}

const TimeDisplay: React.FC<TimeDisplayProps> = ({ title, time, color }) => (
  <div style={{ 
    textAlign: 'center',
    padding: '2rem',
    borderRadius: '15px',
    background: 'rgba(255, 255, 255, 0.05)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    backdropFilter: 'blur(4px)',
  }}>
    <h2 style={{ 
      fontSize: '2.5rem', 
      marginBottom: '3rem',
      color: color,
      textTransform: 'uppercase',
      letterSpacing: '2px',
      fontWeight: '600',
    }}>
      {title}
    </h2>
    <div style={{ 
      fontSize: '2.5rem', 
      fontWeight: 'bold',
      color: '#ffffff',
      textShadow: '0 0 10px rgba(255,255,255,0.3)',
    }}>
      {time}
    </div>
  </div>
);

export default App;