import { usePricesContext } from '../../../context/PricesContext';
import { useColors } from '../../../hooks/useColors';
import { printPrice } from '../../../lib/price';
import Box from '../Box/Box';

import styles from './CurrentPrice.module.css';

function CurrentPrice() {

  const { avgPrice, currentPrice, refreshPrices } = usePricesContext();
  const { color } = useColors();


  const numberClassName = styles[color];
  const numberElement = <span className={numberClassName}>{printPrice(currentPrice.price)}</span>;

  return (
    <div className={styles.wrapper}>
      <div className={styles.prices}>
        <Box label="Actual" number={numberElement} />
        <Box label="Mitjana" number={printPrice(avgPrice)} />
      </div>
      <button type='button' onClick={refreshPrices} aria-label='Actualitzar preus' className={styles.refresh}>
        <svg
          aria-hidden='true'
          fill='none'
          height='20'
          viewBox='0 0 24 24'
          width='20'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            d='M20 11a8 8 0 0 0-14.9-4M4 5v4h4M4 13a8 8 0 0 0 14.9 4M20 19v-4h-4'
            stroke='currentColor'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
          />
        </svg>
      </button>
    </div>
  );
}

export default CurrentPrice;
