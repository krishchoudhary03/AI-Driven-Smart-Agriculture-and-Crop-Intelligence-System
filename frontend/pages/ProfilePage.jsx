import React, { useEffect, useState } from 'react';
import { getProfile } from '../src/api';
import plowBullock from '../src/assets/plow-bullock.jpg';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getProfile().then((data) => setProfile(data));
  }, []);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>👤 Profile</h2>
      {profile ? (
        <div>
          <p>Name: {profile.name}</p>
          <p>Farm: {profile.farm}</p>
          <img src={plowBullock} alt="plow" style={{width:'80%',marginTop:'20px',borderRadius:'8px'}}/>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}