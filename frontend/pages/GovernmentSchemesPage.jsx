import React, { useEffect, useState } from 'react';
import { getSchemes } from '../src/api';
import farmerWomen from '../src/assets/farmer-women.jpg';

export default function GovernmentSchemesPage() {
  const [schemes, setSchemes] = useState([]);

  useEffect(() => {
    getSchemes().then((data) => setSchemes(data.schemes || []));
  }, []);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>📜 Government Schemes</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {schemes.map((s, idx) => (
          <li key={idx}>{s}</li>
        ))}
      </ul>
      <img src={farmerWomen} alt="farmers" style={{width:'80%',marginTop:'20px',borderRadius:'8px'}}/>
    </div>
  );
}