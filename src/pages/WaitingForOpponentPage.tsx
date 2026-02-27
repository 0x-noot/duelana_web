import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { colors, fontFamily, spacing } from '../theme';
import { PixelButton } from '../components/SpriteButton';
import { ScrollPanel } from '../components/ScrollPanel';
import { useWallet } from '../providers/WalletProvider';
import { useConnection } from '../providers/ConnectionProvider';
import { useDuelanaProgram } from '../hooks/useDuelanaProgram';
import { useDuelSubscription } from '../hooks/useDuelSubscription';
import { deriveEscrowPDA, deriveTokenEscrowPDA } from '../utils/pda';
import { truncateAddress } from '../utils/format';
import { SKR_MINT, TOKEN_PROGRAM_ID } from '../utils/constants';
import { backgrounds } from '../assets';

const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

function getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0];
}

export function WaitingForOpponentPage() {
  const { duelPubkey: duelPubkeyParam } = useParams<{ duelPubkey: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { betAmount?: number; tokenType?: string } | null;
  const betAmount = state?.betAmount ?? 0;
  const tokenType = (state?.tokenType ?? 'SOL') as 'SOL' | 'SKR';
  const isToken = tokenType === 'SKR';
  const feeMultiplier = isToken ? 0.99 : 0.97;
  const { publicKey, signAndSendTransaction } = useWallet();
  const { connection } = useConnection();
  const program = useDuelanaProgram();

  const duelPk = useRef(new PublicKey(duelPubkeyParam!)).current;
  const { duel } = useDuelSubscription(duelPk);

  const [cancelling, setCancelling] = useState(false);
  const navigatedRef = useRef(false);

  const [dots, setDots] = useState('');
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!duel || navigatedRef.current) return;
    const statusKey = Object.keys(duel.status)[0];
    if (statusKey !== 'waiting' && statusKey !== 'cancelled') {
      navigatedRef.current = true;
      navigate(`/animation/${duelPubkeyParam}`, { replace: true });
    }
  }, [duel, duelPubkeyParam, navigate]);

  const handleCancel = useCallback(async () => {
    if (!publicKey) return;
    if (!confirm(`Cancel this duel and reclaim your ${tokenType}?`)) return;

    setCancelling(true);
    try {
      let tx;
      if (isToken) {
        const [tokenEscrowPDA] = deriveTokenEscrowPDA(duelPk);
        const creatorATA = getAssociatedTokenAddress(SKR_MINT, publicKey);
        tx = await (program.methods as any)
          .cancelTokenDuel()
          .accounts({
            creator: publicKey, duel: duelPk, tokenEscrow: tokenEscrowPDA,
            creatorTokenAccount: creatorATA, tokenMint: SKR_MINT,
            tokenProgram: TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId,
          })
          .transaction();
      } else {
        const [escrowPDA] = deriveEscrowPDA(duelPk);
        // @ts-ignore — Anchor type instantiation too deep
        tx = await program.methods
          .cancelDuel()
          .accounts({
            creator: publicKey, duel: duelPk, escrow: escrowPDA,
            systemProgram: SystemProgram.programId,
          })
          .transaction();
      }

      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const signature = await signAndSendTransaction(tx);
      await connection.confirmTransaction(signature, 'confirmed');
      alert(`Your ${tokenType} has been returned.`);
      navigate('/', { replace: true });
    } catch (err: any) {
      alert(err?.message || 'Failed to cancel duel');
    } finally {
      setCancelling(false);
    }
  }, [publicKey, duelPk, program, connection, signAndSendTransaction, navigate, isToken, tokenType]);

  return (
    <div style={{
      width: '100%', height: '100vh',
      backgroundImage: `url(${backgrounds.duelArena})`,
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
    }}>
      <div style={{
        width: '100%', height: '100%', padding: spacing.md,
        backgroundColor: 'rgba(26, 15, 8, 0.4)',
        display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
      }}>
        <ScrollPanel variant="banner" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          paddingTop: spacing.md, paddingBottom: spacing.md,
          paddingLeft: spacing.lg, paddingRight: spacing.lg,
        }}>
          <span style={{ fontFamily, fontSize: 18, color: colors.text, textAlign: 'center' }}>
            AWAITING CHALLENGER
          </span>
        </ScrollPanel>

        <div style={{
          flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: spacing.lg,
        }}>
          <ScrollPanel variant="popup" style={{ padding: 0 }}>
            <div style={{
              paddingLeft: 32, paddingRight: 32, paddingTop: 36, paddingBottom: 28,
              display: 'flex', flexDirection: 'column', gap: spacing.md, alignItems: 'center',
            }}>
              <span style={{
                fontFamily, fontSize: 16, color: colors.gold, textAlign: 'center',
                textShadow: `1px 1px 0 ${colors.black}`, marginBottom: spacing.sm,
                whiteSpace: 'pre-line',
              }}>
                {'WAITING FOR\nOPPONENT' + dots}
              </span>

              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontFamily, fontSize: 11, color: colors.textMuted }}>WAGER</span>
                <span style={{ fontFamily, fontSize: 11, color: colors.text }}>{betAmount} {tokenType}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontFamily, fontSize: 11, color: colors.textMuted }}>DUEL</span>
                <span style={{ fontFamily, fontSize: 11, color: colors.text }}>
                  {truncateAddress(duelPubkeyParam || '', 6)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontFamily, fontSize: 11, color: colors.textMuted }}>POTENTIAL WIN</span>
                <span style={{ fontFamily, fontSize: 11, color: colors.success }}>
                  {(betAmount * 2 * feeMultiplier).toFixed(isToken ? 2 : 4)} {tokenType}
                </span>
              </div>
            </div>
          </ScrollPanel>
        </div>

        <div style={{ paddingTop: spacing.md, display: 'flex', justifyContent: 'center' }}>
          <PixelButton
            title={cancelling ? 'CANCELLING...' : 'CANCEL DUEL'}
            onPress={handleCancel}
            disabled={cancelling}
            small
          />
        </div>
      </div>
    </div>
  );
}
