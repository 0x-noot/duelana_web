import React, { useState } from 'react';
import { AudioManager } from '../audio/AudioManager';
import styles from './SpriteButton.module.css';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'long' | 'small';
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function SpriteButton({
  title,
  onPress,
  variant = 'long',
  disabled = false,
  style,
}: Props) {
  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    AudioManager.playUIClick();
    onPress();
  };

  const className = [
    styles.button,
    variant === 'long' ? styles.long : styles.small,
    pressed && !disabled ? styles.pressed : '',
    disabled ? styles.disabled : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      className={className}
      onClick={handleClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      disabled={disabled}
      style={style}
    >
      <span className={variant === 'small' ? styles.smallText : styles.text}>
        {title}
      </span>
    </button>
  );
}

// Backward compat wrapper
interface PixelButtonProps {
  title: string;
  onPress: () => void;
  small?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function PixelButton({ title, onPress, small, disabled, style }: PixelButtonProps) {
  return (
    <SpriteButton
      title={title}
      onPress={onPress}
      variant={small ? 'small' : 'long'}
      disabled={disabled}
      style={style}
    />
  );
}
