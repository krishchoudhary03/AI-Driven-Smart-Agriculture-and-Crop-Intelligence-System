import React, { useState } from 'react';
import { postIrrigation } from '../src/api';

export default function IrrigationAdvisoryPage() {
  const [moisture, setMoisture] = useState('');
  const [advice, setAdvice] = useState(null);

  const handle = async (e) => {
    e.preventDefault();
    const res = await postIrrigation({ moisture });
    setAdvice(res.advice);
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>💧 Irrigation Advisory</h2>
      <form onSubmit={handle} style={{ marginTop: '20px' }}>
        <input
          type="number"
          placeholder="Soil moisture"
          value={moisture}
          onChange={(e) => setMoisture(e.target.value)}
          required
        />
        <button type="submit" style={{ marginLeft: '10px' }}>Get Advice</button>
      </form>
      {advice && <p style={{ marginTop: '20px', fontWeight: 'bold' }}>{advice}</p>}
    </div>
  );
}