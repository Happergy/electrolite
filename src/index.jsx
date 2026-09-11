import React from 'react';
import ReactDOM from 'react-dom/client';
import Main from './components/Main/Main';
import { PricesProvider } from './context/PricesProvider';

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <PricesProvider>
      <main>
        <Main />
      </main>
    </PricesProvider>
  </React.StrictMode>
);
