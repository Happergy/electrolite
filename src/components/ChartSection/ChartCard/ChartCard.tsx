import { PricesList } from '../../PricesList/PricesList';
import Chart from '../Chart/Chart';
import CurrentPrice from '../CurrentPrice/CurrentPrice';

export const ChartCard = () => {
  return (
    <div className="card">
      <CurrentPrice />
      <Chart />
      <PricesList />
    </div>
  );
};
