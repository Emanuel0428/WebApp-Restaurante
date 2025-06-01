import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import "antd/dist/antd.css";

import { initMercadoPago } from '@mercadopago/sdk-react';

initMercadoPago('TU_PUBLIC_KEY_DE_MERCADOPAGO', {
  locale: 'es-CO',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
