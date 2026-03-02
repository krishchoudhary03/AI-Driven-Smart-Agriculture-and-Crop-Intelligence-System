import React, { useState } from 'react';
import { postFertilizer } from '../src/api';

export default function FertilizerAdvisoryPage() {
  const [npk, setNpk] = useState('');
  const [advice, setAdvice] = useState(null);

  const handle = async (e) => {
    e.preventDefault();
    const res = await postFertilizer({ npk });
    setAdvice(res.advice);
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>🌱 Fertilizer Advisory</h2>
      <form onSubmit={handle} style={{ marginTop: '20px' }}>
        <input
          type="text"
          placeholder="NPK values"
          value={npk}
          onChange={(e) => setNpk(e.target.value)}
          required
        />
        <button type="submit" style={{ marginLeft: '10px' }}>Get Advice</button>
      </form>
      {advice && <p style={{ marginTop: '20px', fontWeight: 'bold' }}>{advice}</p>}
    </div>
  );
}