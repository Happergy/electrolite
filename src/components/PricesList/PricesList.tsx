import dayjs from 'dayjs';
import { usePricesContext } from '../../context/PricesContext';
import { LINE_COLORS } from '../../domain/colors';
import { getPriceMarkerShape } from '../../domain/priceMarker';
import { useColors } from '../../hooks/useColors';
import { formatPrice, printPrice } from '../../lib/price';

import styles from './PricesList.module.css';

export const PricesList = () => {
  const { prices, bestPrice } = usePricesContext();
  const { getColor } = useColors();

  return (
    <ol className={styles.list}>
      {prices?.map(({ price, date, simulated }) => {
        const priceColor = getColor(price);
        const isBestPrice = formatPrice(price) === formatPrice(bestPrice.price);
        const priceShape = styles[getPriceMarkerShape(priceColor, isBestPrice)];

        return (
          <li key={date} className={styles.item}>
            <span className={styles.container}>
              <span
                className={`${styles.colorBox} ${priceShape}`}
                style={{ backgroundColor: LINE_COLORS[priceColor] }}
                aria-hidden="true"
              />
              <time className={styles.time} dateTime={date}>
                {dayjs(date).format('HH')}h
              </time>
              <span className={styles.price}>
                {printPrice(price, true, true)}
                {simulated ? '*' : null}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
};
