import React from 'react';

import styles from './Box.module.css';

function Box({ label, number, subline, className, monocolor }) {
  return (
    <div className={`${styles.wrapper} ${className || ''}`}>
      <div className={`${styles.label} ${monocolor ? styles.monocolor : ''}`}>{label}</div>
      <div className={styles.number}>{number}</div>
      {subline && (
        <div className={`${styles.subline} ${monocolor ? styles.monocolor : ''}`}>{subline}</div>
      )}
    </div>
  );
}

export default Box;
