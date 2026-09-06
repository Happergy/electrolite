import Chart from '../Chart/Chart';
import CurrentPrice from '../CurrentPrice/CurrentPrice';
import { PricesList } from '../../PricesList/PricesList';

export const ChartCard = () => {
  return (
    <div className="card">
      <CurrentPrice />
      <Chart />
      <PricesList />
    </div>
  );
};
