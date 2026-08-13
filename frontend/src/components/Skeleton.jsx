import React from 'react';
import styles from './Skeleton.module.css';

export default function Skeleton({ type = 'text', count = 1 }) {
  const items = Array.from({ length: count });

  if (type === 'card') {
    return (
      <div className={styles.grid}>
        {items.map((_, i) => (
          <div key={i} className={`${styles.card}`}>
            <div className={`${styles.shimmer} ${styles.circle}`} />
            <div className={`${styles.shimmer} ${styles.lineLong}`} />
            <div className={`${styles.shimmer} ${styles.lineShort}`} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={styles.table}>
        {items.map((_, i) => (
          <div key={i} className={styles.row}>
            <div className={`${styles.shimmer} ${styles.cellSmall}`} />
            <div className={`${styles.shimmer} ${styles.cellLarge}`} />
            <div className={`${styles.shimmer} ${styles.cellMedium}`} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.textStack}>
      {items.map((_, i) => (
        <div key={i} className={`${styles.shimmer} ${styles.line} ${i === count - 1 ? styles.lastLine : ''}`} />
      ))}
    </div>
  );
}
