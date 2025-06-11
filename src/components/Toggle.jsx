import React from 'react';
import './Toggle.css';

export default function Toggle({ label1, label2, active, onToggle }) {
  return (
    <button className={`toggle-button ${active ? 'active' : ''}`} onClick={onToggle}>
      {active ? label1 : label2}
    </button>
  );
}