import React from 'react';
import ReactDOM from 'react-dom/client';
import Experience from './Experience';
import BackgroundMusic from './components/BackgroundMusic';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><BackgroundMusic /><Experience /></React.StrictMode>,
);
