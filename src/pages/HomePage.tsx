import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, fontFamily, spacing } from '../theme';
import { PixelButton } from '../components/SpriteButton';
import { ScrollPanel } from '../components/ScrollPanel';
import { RSCloseButton } from '../components/RSCloseButton';
import { WalletConnectButton } from '../components/WalletConnectButton';
import { useWallet } from '../providers/WalletProvider';
import { backgrounds, buttons } from '../assets';
import { useScreenMusic, useMuted, useToggleMute } from '../audio/useAudio';

export function HomePage() {
  const { connected } = useWallet();
  const navigate = useNavigate();
  const [showInfo, setShowInfo] = useState(false);
  useScreenMusic('home');
  const muted = useMuted();
  const toggleMute = useToggleMute();

  return (
    <>
      <div style={{
        width: '100%',
        height: '100vh',
        backgroundImage: `url(${backgrounds.homeNew})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          padding: spacing.md,
          backgroundColor: 'rgba(26, 15, 8, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: spacing.md }}>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              <button
                onClick={() => setShowInfo(true)}
                style={{
                  width: 48, height: 44,
                  backgroundImage: `url(${buttons.smallUp})`,
                  backgroundSize: '100% 100%',
                  imageRendering: 'pixelated' as any,
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'transparent',
                }}
              >
                <span style={{ fontFamily, fontSize: 16, color: colors.text }}>?</span>
              </button>
              <button
                onClick={toggleMute}
                style={{
                  width: 48, height: 44,
                  backgroundImage: `url(${buttons.smallUp})`,
                  backgroundSize: '100% 100%',
                  imageRendering: 'pixelated' as any,
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'transparent',
                  opacity: muted ? 0.4 : 1,
                }}
              >
                <span style={{ fontFamily, fontSize: 16, color: colors.text }}>{'♫'}</span>
              </button>
            </div>
            <WalletConnectButton />
          </div>

          {/* Center buttons */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: spacing.lg,
            paddingBottom: 40,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md, width: '100%', maxWidth: 300 }}>
              <PixelButton
                title="CREATE DUEL"
                onPress={() => navigate('/create-duel')}
                disabled={!connected}
              />
              <PixelButton
                title="VIEW DUELS"
                onPress={() => navigate('/lobby')}
              />
              <PixelButton
                title="HISTORY"
                onPress={() => navigate('/history')}
                small
              />
            </div>

            {!connected && (
              <span style={{
                fontFamily, fontSize: 13, color: colors.textLight,
                marginTop: spacing.md,
                textShadow: `1px 1px 0 ${colors.black}`,
              }}>
                CONNECT WALLET TO PLAY
              </span>
            )}
          </div>
        </div>
      </div>

      {/* How It Works Modal */}
      {showInfo && (
        <div
          onClick={() => setShowInfo(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(26, 15, 8, 0.7)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            padding: spacing.lg, zIndex: 1000,
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, maxHeight: '85%' }}>
            <ScrollPanel variant="popup" style={{ padding: 0 }}>
              <div style={{ paddingLeft: 32, paddingRight: 32, paddingTop: 28, paddingBottom: 20, position: 'relative' }}>
                <RSCloseButton
                  onPress={() => setShowInfo(false)}
                  style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}
                />
                <div style={{ fontFamily, fontSize: 16, color: colors.black, textAlign: 'center', marginBottom: spacing.sm }}>
                  HOW IT WORKS
                </div>

                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {[
                    ['1. FAIR 50/50 ODDS', 'Every duel is a coinflip with exactly 50/50 odds. No house edge beyond the protocol fee.'],
                    ['2. PROTOCOL FEE', 'SOL duels: 3% fee. SKR token duels: only 1% fee. The fee is taken from the total pot and sent to the Duelana treasury. The rest goes to the winner.'],
                    ['3. SOL & SKR WAGERING', 'Wager with native SOL or SKR tokens. Choose your token when creating a duel. SKR duels have a lower 1% fee.'],
                    ['4. PROVABLY FAIR', 'Results are determined on-chain using MagicBlock VRF (Verifiable Random Function). Every outcome is transparent and verifiable.'],
                    ['5. CREATE A DUEL', 'Click "Create Duel", choose SOL or SKR, pick your wager amount, sign the transaction, and wait for an opponent.'],
                    ['6. CANCEL ANYTIME', 'Taking too long to find an opponent? Cancel your duel anytime to get your full wager back.'],
                    ['7. JOIN A DUEL', 'Click "View Duels" to browse open duels and join one that matches your desired wager amount.'],
                    ['8. HISTORY', 'The History tab tracks all your past duels, your win/loss record, and net P&L.'],
                    ['9. CLAIM WINNINGS', 'After the duel animation plays out, the winner must click "Claim" on the results screen to receive the pot.'],
                  ].map(([header, body]) => (
                    <div key={header}>
                      <div style={{ fontFamily, fontSize: 12, color: colors.black, marginTop: spacing.sm, marginBottom: 2 }}>
                        {header}
                      </div>
                      <div style={{ fontFamily, fontSize: 10, color: colors.black, lineHeight: '16px', marginBottom: spacing.xs }}>
                        {body}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollPanel>
          </div>
        </div>
      )}
    </>
  );
}
