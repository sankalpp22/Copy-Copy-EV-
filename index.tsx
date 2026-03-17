
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // This will be created to handle tailwind directives

const rootElement = document.getElementById('root');
console.log("Mounting React application...");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
