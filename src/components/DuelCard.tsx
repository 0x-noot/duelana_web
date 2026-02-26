import React from 'react';
import { PublicKey } from '@solana/web3.js';
import { DuelAccount, isTokenDuel } from '../hooks/useDuelSubscription';
import { truncateAddress, formatSol, formatToken } from '../utils/format';
import { SKR_DECIMALS } from '../utils/constants';
import { colors, fontFamily, spacing } from '../theme';
import { SpriteButton } from './SpriteButton';
import { ScrollPanel } from './ScrollPanel';

interface Props {
  publicKey: PublicKey;
  duel: DuelAccount;
  onJoin: (duelPubkey: PublicKey) => void;
  onCancel: (duelPubkey: PublicKey) => void;
  currentWallet: PublicKey | null;
  cancelling?: boolean;
}

export function DuelCard({ publicKey, duel, onJoin, onCancel, currentWallet, cancelling }: Props) {
  const betAmountRaw = duel.betAmount?.toNumber?.() ?? 0;
  const isCreator = currentWallet && duel.creator.equals(currentWallet);
  const isToken = isTokenDuel(duel);
  const tokenSymbol = isToken ? 'SKR' : 'SOL';
  const betDisplay = isToken
    ? formatToken(betAmountRaw, SKR_DECIMALS)
    : formatSol(betAmountRaw);

  return (
    <ScrollPanel variant="card" style={{ marginBottom: spacing.sm, padding: spacing.md }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          <span style={{ fontFamily, fontSize: 11, color: colors.textMuted }}>
            {isCreator ? 'YOUR DUEL' : truncateAddress(duel.creator.toBase58())}
          </span>
          <span style={{ fontFamily, fontSize: 16, color: colors.text }}>
            {betDisplay} {tokenSymbol}
          </span>
        </div>

        <div style={{ margin: `0 ${spacing.sm}px` }}>
          <span style={{
            fontFamily,
            fontSize: 10,
            color: colors.primary,
            border: `1px solid ${colors.primary}`,
            padding: `2px ${spacing.xs}px`,
          }}>
            {tokenSymbol}
          </span>
        </div>

        {isCreator ? (
          <SpriteButton
            title={cancelling ? '...' : 'CANCEL'}
            onPress={() => onCancel(publicKey)}
            disabled={cancelling}
            variant="small"
          />
        ) : (
          <SpriteButton
            title="JOIN"
            onPress={() => onJoin(publicKey)}
            disabled={!currentWallet}
            variant="small"
          />
        )}
      </div>
    </ScrollPanel>
  );
}
