import { usePricesContext } from '../../context/PricesContext';
import useTheme from '../../hooks/useTheme';
import { ChartCard } from '../ChartSection/ChartCard/ChartCard';
import HoursList from '../HoursList/HoursList';

import styles from './Main.module.css';

function Main() {
  const { error } = usePricesContext();
  const {
    theme,
    showSystemThemeButton,
    isReady,
    error: themeError,
    toggleTheme,
    setThemeToSystem,
  } = useTheme();

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
        {themeError && (
          <p className={styles.themeError} role="alert">
            {themeError}
          </p>
        )}
        <button
          className={styles.themeToggle}
          type="button"
          onClick={() => void toggleTheme()}
          disabled={!isReady}
          aria-label={`${theme === 'dark' ? '☀️ Activa el mode clar' : '🌙 Activa el mode fosc'}`}
          aria-pressed={theme === 'dark'}
        >
          {theme === 'dark' ? '☀️ Clar' : '🌙 Fosc'}
        </button>
        {showSystemThemeButton && (
          <button
            className={styles.themeToggle}
            type="button"
            onClick={() => void setThemeToSystem()}
            disabled={!isReady}
            aria-label="⚙️ Fes servir el tema del sistema"
          >
            ⚙️ Sistema
          </button>
        )}
      </div>
    </>
  );
}

export default Main;
