// Farmer‑friendly landing page with language selection
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../src/LanguageContext';
import tractorImg from '../src/assets/tractor.jpg';

export default function LandingPage() {
  const { language, setLanguage } = useContext(LanguageContext);
  const navigate = useNavigate();

  const chooseLang = (lang) => {
    setLanguage(lang);
    setTimeout(() => navigate('/dashboard'), 300);
  };

  React.useEffect(() => {
    if (language) {
      navigate('/dashboard');
    }
  }, [language, navigate]);


  const buttonStyle = {
    width: '70%',
    padding: '18px 0',
    fontSize: '22px',
    margin: '12px auto',
    display: 'block',
    borderRadius: '10px',
    cursor: 'pointer',
    backgroundColor: '#388E3C',
    color: '#fff',
    border: 'none',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s',
  };

  const heroStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #a8e063 0%, #56ab2f 100%)',
    color: '#fff',
    textAlign: 'center',
    padding: '0 20px',
  };

  const featureBox = {
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '10px 20px',
    margin: '8px 0',
    width: '80%',
    maxWidth: '400px',
  };

  return (
    <div style={heroStyle}>
      <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>
        AI Smart Agriculture
      </h1>
      <p style={{ fontSize: '18px', maxWidth: '500px', marginBottom: '40px' }}>
        एक सरल और स्मार्ट खेत प्रबंधन समाधान
      </p>
      <div style={featureBox}>🌾 किसान के लिए आसान</div>
      <div style={featureBox}>🛰️ मौसम व् मिट्टी की जानकारी</div>
      <div style={featureBox}>📈 स्मार्ट सुझाव</div>
      {/* hero image: replace with actual asset */}
      {/* use imported image for Vite */}
      <img
        src={tractorImg}
        alt="tractor"
        style={{ width: '80%', maxWidth: '400px', marginTop: '20px', borderRadius: '8px' }}
      />
      <button
        style={buttonStyle}
        onClick={() => chooseLang('en')}
        onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        🇬🇧 English
      </button>
      <button
        style={buttonStyle}
        onClick={() => chooseLang('hi')}
        onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        🇮🇳 हिंदी
      </button>
    </div>
  );
}
