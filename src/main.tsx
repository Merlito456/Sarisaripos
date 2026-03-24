import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Check for DOM Storage availability (Critical for WebView)
const checkStorage = () => {
  try {
    localStorage.setItem('storage_test', 'ok');
    localStorage.removeItem('storage_test');
    return true;
  } catch (e) {
    return false;
  }
};

if (!checkStorage()) {
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: sans-serif; background: #fef2f2; color: #991b1b; height: 100vh; display: flex; flex-direction: column; justify-content: center;">
      <h1 style="font-size: 24px; margin-bottom: 10px;">⚠️ Storage Disabled</h1>
      <p>This app requires <b>DOM Storage</b> to function. Please enable <code>setDomStorageEnabled(true)</code> in your Android WebView settings.</p>
    </div>
  `;
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
