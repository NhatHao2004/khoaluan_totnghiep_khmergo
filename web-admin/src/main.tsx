import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Chặn thông báo lỗi permission-denied của Firebase gây nhiễu Console
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const isPermissionError = args.some(arg => {
    const str = String(arg).toLowerCase();
    return str.includes('permission-denied') || 
           str.includes('insufficient permissions') ||
           str.includes('missing or insufficient permissions');
  });

  if (isPermissionError) return;
  originalConsoleError.apply(console, args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
