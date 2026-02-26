import React from 'react';
import styles from './ScrollPanel.module.css';

interface Props {
  children: React.ReactNode;
  variant?: 'popup' | 'scroll' | 'banner' | 'card';
  style?: React.CSSProperties;
  className?: string;
}

const borderedVariants: Record<string, boolean> = {
  popup: true,
  card: true,
  banner: false,
  scroll: false,
};

export function ScrollPanel({ children, variant = 'popup', style, className }: Props) {
  const showBorder = borderedVariants[variant];

  const cls = [
    styles.container,
    styles[variant],
    showBorder ? styles.rsBorder : '',
    className || '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cls} style={style}>
      {children}
    </div>
  );
}
