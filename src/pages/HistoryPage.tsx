import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, fontFamily, spacing } from '../theme';
import { PixelButton } from '../components/SpriteButton';
import { HistoryCard } from '../components/HistoryCard';
import { ScrollPanel } from '../components/ScrollPanel';
import { RSCloseButton } from '../components/RSCloseButton';
import { useWallet } from '../providers/WalletProvider';
import { useHistoryDuels } from '../hooks/useDuelSubscription';
import { formatSol, formatToken } from '../utils/format';
import { SKR_DECIMALS } from '../utils/constants';
import { backgrounds } from '../assets';

export function HistoryPage() {
  const { publicKey } = useWallet();
  const navigate = useNavigate();
  const { duels, stats, loading, refresh } = useHistoryDuels(publicKey);

  const solColor = stats.netSol >= 0 ? colors.success : colors.danger;
  const solPrefix = stats.netSol >= 0 ? '+' : '-';
  const solDisplay = `${solPrefix}${formatSol(Math.abs(stats.netSol))} SOL`;
  const tokenColor = stats.netToken >= 0 ? colors.success : colors.danger;
  const tokenPrefix = stats.netToken >= 0 ? '+' : '-';
  const tokenDisplay = `${tokenPrefix}${formatToken(Math.abs(stats.netToken), SKR_DECIMALS)} SKR`;

  return (
    <div style={{
      backgroundImage: `url(${backgrounds.homeNew})`,
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
      minHeight: '100vh',
    }}>
    <div style={{
      backgroundColor: 'rgba(26, 15, 8, 0.5)',
      minHeight: '100vh',
      padding: spacing.md,
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: spacing.sm }}>
        <RSCloseButton onPress={() => navigate(-1)} />
      </div>

      <ScrollPanel variant="banner" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: spacing.md, paddingBottom: spacing.md,
        paddingLeft: spacing.lg, paddingRight: spacing.lg,
        marginBottom: spacing.md,
      }}>
        <span style={{ fontFamily, fontSize: 20, color: colors.text, textAlign: 'center' }}>
          DUEL HISTORY
        </span>
        {publicKey && stats.totalDuels > 0 ? (
          <>
            <span style={{ fontFamily, fontSize: 12, color: colors.text, textAlign: 'center', marginTop: spacing.xs }}>
              {stats.wins}W - {stats.losses}L ({stats.winRate}%)
            </span>
            {stats.netSol !== 0 && (
              <span style={{ fontFamily, fontSize: 12, color: solColor, textAlign: 'center', marginTop: spacing.xs }}>
                NET: {solDisplay}
              </span>
            )}
            {stats.netToken !== 0 && (
              <span style={{ fontFamily, fontSize: 12, color: tokenColor, textAlign: 'center', marginTop: spacing.xs }}>
                NET: {tokenDisplay}
              </span>
            )}
            {stats.netSol === 0 && stats.netToken === 0 && (
              <span style={{ fontFamily, fontSize: 12, color: colors.text, textAlign: 'center', marginTop: spacing.xs }}>
                NET: EVEN
              </span>
            )}
          </>
        ) : (
          <span style={{ fontFamily, fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs }}>
            {publicKey ? '0 DUELS' : 'CONNECT WALLET'}
          </span>
        )}
      </ScrollPanel>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {duels.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm }}>
            <span style={{ fontFamily, fontSize: 16, color: colors.textLight }}>
              {publicKey ? 'NO DUEL HISTORY YET' : 'CONNECT WALLET TO VIEW'}
            </span>
            {publicKey && (
              <span style={{ fontFamily, fontSize: 13, color: colors.textLight }}>CREATE YOUR FIRST DUEL!</span>
            )}
          </div>
        ) : (
          duels.map((item) => (
            <HistoryCard
              key={item.publicKey.toBase58()}
              publicKey={item.publicKey}
              duel={item.account}
              userPublicKey={publicKey!}
              onPress={(pk) => navigate(`/results/${pk}`)}
            />
          ))
        )}
      </div>

      <div style={{ paddingTop: spacing.md, display: 'flex', justifyContent: 'center' }}>
        <PixelButton title="REFRESH" onPress={refresh} small />
      </div>
    </div>
    </div>
  );
}
