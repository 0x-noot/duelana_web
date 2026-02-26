import React, { useState } from 'react';

interface Props {
  onPress: () => void;
  style?: React.CSSProperties;
}

export function RSCloseButton({ onPress, style }: Props) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={onPress}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        width: 32,
        height: 32,
        backgroundColor: '#ff0000',
        border: 'none',
        borderWidth: 2,
        borderStyle: 'solid',
        borderTopColor: '#ff6666',
        borderLeftColor: '#ff6666',
        borderBottomColor: '#990000',
        borderRightColor: '#990000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
        opacity: pressed ? 0.7 : 1,
        ...style,
      }}
    >
      <span style={{
        fontFamily: "'PressStart2P', monospace",
        fontSize: 14,
        color: '#ffffff',
        textShadow: '1px 1px 0 #000000',
        userSelect: 'none',
      }}>X</span>
    </button>
  );
}
