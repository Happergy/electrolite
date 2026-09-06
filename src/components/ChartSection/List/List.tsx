import HoursSection from '../../HoursSection/HoursSection';
import { printPrice } from '../../../lib/price';
import { usePricesContext } from '../../../context/PricesContext';

import styles from './List.module.css';

const WINDOW_DURATIONS = [1, 2, 3, 4, 5, 6];

function List() {
  const { bestPrices } = usePricesContext();

  return (
    <section>
      <ul className={`card ${styles.windows}`}>
        {WINDOW_DURATIONS.map((duration) => {
          const window = bestPrices[duration];

          return (
            <li className={styles.window} key={duration}>
              <div className={styles.info}>
                <strong>{duration} h</strong>
                <small>{printPrice(window.totalPrice, true)} / h</small>
              </div>
              <HoursSection
                isBestPrice
                startTime={window.startTime}
                endTime={window.endTime}
                duration={duration}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default List;
