import React, { useState, useEffect } from 'react';
import { SOL_BET_PRESETS, SKR_BET_PRESETS } from '../utils/constants';
import { colors, fontFamily, spacing } from '../theme';
import { SpriteButton } from './SpriteButton';

export type TokenType = 'SOL' | 'SKR';

interface Props {
  onSelect: (amount: number) => void;
  disabled?: boolean;
  tokenType?: TokenType;
}

export function BetAmountPicker({ onSelect, disabled = false, tokenType = 'SOL' }: Props) {
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const presets = tokenType === 'SKR' ? SKR_BET_PRESETS : SOL_BET_PRESETS;

  useEffect(() => {
    setSelectedPreset(null);
    setCustomAmount('');
  }, [tokenType]);

  const handlePreset = (amount: number) => {
    setSelectedPreset(amount);
    setCustomAmount('');
    onSelect(amount);
  };

  const handleCustom = () => {
    const amount = parseFloat(customAmount);
    if (amount > 0) {
      setSelectedPreset(null);
      onSelect(amount);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md, alignItems: 'center' }}>
      <span style={{ fontFamily, fontSize: 15, color: colors.text, textAlign: 'center' }}>
        BET AMOUNT ({tokenType})
      </span>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm }}>
        {presets.map((amount) => (
          <SpriteButton
            key={amount}
            title={`${amount}`}
            onPress={() => handlePreset(amount)}
            disabled={disabled}
            variant="small"
          />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, justifyContent: 'center' }}>
        <input
          type="number"
          step="any"
          style={{
            fontFamily,
            fontSize: 14,
            color: colors.text,
            backgroundColor: 'rgba(201, 150, 95, 0.3)',
            border: `2px solid ${colors.textMuted}`,
            padding: `${spacing.sm}px ${spacing.md}px`,
            width: 120,
            textAlign: 'center',
            outline: 'none',
          }}
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          placeholder="Custom"
          disabled={disabled}
        />
        <SpriteButton
          title="SET"
          onPress={handleCustom}
          disabled={disabled || !customAmount}
          variant="small"
        />
      </div>
    </div>
  );
}
