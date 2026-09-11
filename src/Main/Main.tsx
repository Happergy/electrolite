import List from '../components/ChartSection/List/List';
import { ChartCard } from '../components/ChartSection/ChartCard/ChartCard';
import { usePricesContext } from '../context/PricesContext';

import styles from './Main.module.css';

function Main() {
  const { error } = usePricesContext();

  return (
    <>
      {error && <p>No s'han pogut carregar els preus.</p>}
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
