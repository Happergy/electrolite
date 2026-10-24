import HoursList from '../HoursList/HoursList';
import { ChartCard } from '../ChartSection/ChartCard/ChartCard';
import { usePricesContext } from '../../context/PricesContext';
import useTheme from '../../hooks/useTheme';

import styles from './Main.module.css';

function Main() {
  const { error } = usePricesContext();
  const { theme, isReady, error: themeError, toggleTheme } = useTheme();

  return (
    <>
      {error && <p>No s'han pogut carregar els preus.</p>}
      <section className={styles.pricesSection}>
        <HoursList />
      </section>
      <section>
        <ChartCard />
      </section>
      <div className={styles.pageToolbar}>
        {themeError && <p className={styles.themeError} role="alert">{themeError}</p>}
        <button
          className={styles.themeToggle}
          type="button"
          onClick={() => void toggleTheme()}
          disabled={!isReady}
          aria-label={`Activar modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
          aria-pressed={theme === 'dark'}
        >
          {theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
        </button>
      </div>
    </>
  );
}

export default Main;
