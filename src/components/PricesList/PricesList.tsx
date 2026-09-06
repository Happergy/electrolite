import { LINE_COLORS } from '../../domain/colors';
import { COLORS, useColors } from '../../hooks/useColors';
import { printPrice } from '../../lib/price';
import dayjs from 'dayjs';
import { usePricesContext } from '../../context/PricesContext';

import styles from './PricesList.module.css';

export const PricesList = () => {
  const { prices } = usePricesContext();
  const { getColor } = useColors();

  return (
    <ol className={styles.list}>
      {prices?.map(({ price, date, simulated }) => {
        const priceColor = getColor(price);
        const priceShape =
          priceColor === COLORS.GREEN
            ? styles.bestPrice
            : priceColor === COLORS.RED
              ? styles.worstPrice
              : '';

        return (
          <li
            key={date}
            className={styles.item}
          >
            <span className={styles.container}>
              <span
                className={`${styles.colorBox} ${priceShape}`}
                style={{ backgroundColor: LINE_COLORS[priceColor] }}
                aria-hidden="true"
              />
              <time className={styles.time} dateTime={date}>{dayjs(date).format('HH')}h</time>
              <span className={styles.price}>
                {printPrice(price, true)}
                {simulated ? '*' : null}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
};
