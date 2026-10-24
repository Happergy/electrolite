import type { ReactNode } from 'react';

import styles from './Box.module.css';

type Props = {
  label: ReactNode;
  number: ReactNode;
  subline?: ReactNode;
  className?: string;
  monocolor?: boolean;
};

function Box({ label, number, subline, className, monocolor }: Props) {
  return (
    <div className={`${styles.wrapper} ${className || ''}`}>
      <div className={`${styles.label} ${monocolor ? styles.monocolor : ''}`}>
        {label}
      </div>
      <div className={styles.number}>{number}</div>
      {subline && (
        <div
          className={`${styles.subline} ${monocolor ? styles.monocolor : ''}`}
        >
          {subline}
        </div>
      )}
    </div>
  );
}

export default Box;
