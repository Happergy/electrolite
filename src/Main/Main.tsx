import List from '../components/ChartSection/List/List';
import { ChartCard } from '../components/ChartSection/ChartCard/ChartCard';
import { usePricesContext } from '../context/PricesContext';

import styles from './Main.module.css';

function Main() {
  const { loading, error, refreshPrices } = usePricesContext();

  if (loading) {
    return <p>Carregant...</p>;
  }

  if (error) {
    return <p>No s'han pogut carregar els preus.</p>;
  }

  return (
    <>
      <section className={styles.pricesSection}>
        <div className={styles.pricesToolbar}>
          <h1 className={styles.heading}>Millors preus</h1>
          <button className={styles.refreshButton} type='button' onClick={refreshPrices}>
            Actualitza
          </button>
        </div>
        <List />
      </section>
      <section>
        <ChartCard />
      </section>
    </>
  );
}

export default Main;
