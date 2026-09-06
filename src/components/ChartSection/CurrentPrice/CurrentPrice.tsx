import { usePricesContext } from '../../../context/PricesContext';
import { useColors } from '../../../hooks/useColors';
import { printPrice } from '../../../lib/price';
import Box from '../Box/Box';

import styles from './CurrentPrice.module.css';

function CurrentPrice() {

  const { prices, bestPrice, worstPrice, avgPrice, currentPrice } = usePricesContext();
  const { color } = useColors();


  const numberClassName = styles[color];
  const numberElement = <span className={numberClassName}>{printPrice(currentPrice.price)}</span>;

  return (
    <div className={styles.wrapper}>
      <Box label="Actual" number={numberElement} />
      <Box label="Mitjana" number={printPrice(avgPrice)} />
    </div>
  );
}

export default CurrentPrice;
