import React, { useContext } from 'react';
import { LanguageContext } from '../src/LanguageContext';

export default function LanguageSelectionPage() {
  const { setLanguage } = useContext(LanguageContext);
  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <h2>Select Language</h2>
      <button onClick={() => setLanguage('en')}>English</button>
      <button onClick={() => setLanguage('hi')}>हिंदी</button>
    </div>
  );
}