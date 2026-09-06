import List from '../ChartSection/List/List';
import { ChartCard } from '../ChartSection/ChartCard/ChartCard';
import { usePricesContext } from '../../context/PricesContext';

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
      <section>
        <List />
        <button type='button' onClick={refreshPrices}>
          Actualitza
        </button>
      </section>
      <section>
        <ChartCard />
      </section>
    </>
  );
}

export default Main;
