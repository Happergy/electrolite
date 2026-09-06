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
        <List />
      </section>
      <section>
        <ChartCard />
      </section>
    </>
  );
}

export default Main;
