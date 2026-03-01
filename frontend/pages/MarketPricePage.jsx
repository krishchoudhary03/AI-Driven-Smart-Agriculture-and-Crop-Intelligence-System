import React, { useEffect, useState } from 'react';
import { getMarketPrices } from '../src/api';
import tractor2 from '../src/assets/tractor2.jpg';

export default function MarketPricePage() {
  const [prices, setPrices] = useState([]);

  useEffect(() => {
    getMarketPrices().then((data) => setPrices(data.prices || []));
  }, []);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>💰 Market Prices</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {prices.map((p, idx) => (
          <li key={idx}>{p.crop}: ₹{p.price}</li>
        ))}
      </ul>
      <img src={tractor2} alt="tractor field" style={{width:'80%',marginTop:'20px',borderRadius:'8px'}}/>
    </div>
  );
}