import React from 'react';
import ReactDOM from 'react-dom/client';
import Main from './components/Main/Main';
import { PricesProvider } from './context/PricesProvider';
import { ThemeProvider } from './context/ThemeProvider';

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <ThemeProvider>
      <PricesProvider>
        <main>
          <Main />
        </main>
      </PricesProvider>
    </ThemeProvider>
  </React.StrictMode>
);
