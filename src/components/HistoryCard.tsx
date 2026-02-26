import React from 'react';
import { PublicKey } from '@solana/web3.js';
import { DuelAccount, isTokenDuel } from '../hooks/useDuelSubscription';
import { truncateAddress, formatSol, formatToken } from '../utils/format';
import { SKR_DECIMALS } from '../utils/constants';
import { colors, fontFamily, spacing } from '../theme';
import { ScrollPanel } from './ScrollPanel';

interface Props {
  publicKey: PublicKey;
  duel: DuelAccount;
  userPublicKey: PublicKey;
  onPress: (duelPubkey: string) => void;
}

export function HistoryCard({ publicKey, duel, userPublicKey, onPress }: Props) {
  const statusKey = Object.keys(duel.status)[0];
  const betRaw = duel.betAmount?.toNumber?.() ?? 0;
  const isWinner = duel.winner.equals(userPublicKey);
  const isCreator = duel.creator.equals(userPublicKey);
  const isToken = isTokenDuel(duel);
  const tokenSymbol = isToken ? 'SKR' : 'SOL';
  const fmt = (amount: number) =>
    isToken ? formatToken(amount, SKR_DECIMALS) : formatSol(amount);

  const opponent = isCreator ? duel.challenger : duel.creator;
  const opponentStr = truncateAddress(opponent.toBase58());

  const date = new Date(duel.createdAt.toNumber() * 1000);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  let resultLabel: string;
  let resultColor: string;
  let amountStr: string;

  if (statusKey === 'cancelled') {
    resultLabel = 'CANCELLED';
    resultColor = colors.textMuted;
    amountStr = `${fmt(betRaw)} ${tokenSymbol}`;
  } else if (isWinner) {
    resultLabel = 'WON';
    resultColor = colors.success;
    const totalPot = betRaw * 2;
    const fee = Math.floor((totalPot * duel.feeBps) / 10_000);
    const profit = totalPot - fee - betRaw;
    amountStr = `+${fmt(profit)} ${tokenSymbol}`;
  } else {
    resultLabel = 'LOST';
    resultColor = colors.danger;
    amountStr = `-${fmt(betRaw)} ${tokenSymbol}`;
  }

  return (
    <div
      onClick={() => onPress(publicKey.toBase58())}
      style={{ cursor: 'pointer' }}
    >
      <ScrollPanel variant="card" style={{ marginBottom: spacing.sm, padding: spacing.md }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            <span style={{ fontFamily, fontSize: 10, color: colors.textMuted }}>
              {dateStr}
            </span>
            <span style={{ fontFamily, fontSize: 11, color: colors.text }}>
              {statusKey === 'cancelled' ? 'NO CHALLENGER' : `VS ${opponentStr}`}
            </span>
            <span style={{ fontFamily, fontSize: 12, color: colors.textMuted }}>
              {fmt(betRaw)} {tokenSymbol} BET
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: spacing.xs }}>
            <span style={{
              fontFamily,
              fontSize: 12,
              color: resultColor,
              border: `1px solid ${resultColor}`,
              padding: `2px ${spacing.xs}px`,
            }}>
              {resultLabel}
            </span>
            <span style={{ fontFamily, fontSize: 13, color: resultColor }}>
              {amountStr}
            </span>
          </div>
        </div>
      </ScrollPanel>
    </div>
  );
}
