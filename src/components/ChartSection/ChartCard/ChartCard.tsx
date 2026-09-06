import Chart from '../Chart/Chart';
import CurrentPrice from '../CurrentPrice/CurrentPrice';
import { PricesList } from '../../PricesList/PricesList';
import { usePricesContext } from '../../../context/PricesContext';
import styles from './ChartCard.module.css';

export const ChartCard = () => {
  const { refreshPrices } = usePricesContext();
  return (
    <div className="card">

      <CurrentPrice />
      <Chart />
      <PricesList />
    </div>
  );
};
