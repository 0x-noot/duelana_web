import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { colors, fontFamily, spacing } from '../theme';
import { PixelButton } from '../components/SpriteButton';
import { ScrollPanel } from '../components/ScrollPanel';
import { useWallet } from '../providers/WalletProvider';
import { useConnection } from '../providers/ConnectionProvider';
import { useDuelSubscription, isTokenDuel } from '../hooks/useDuelSubscription';
import { useDuelanaProgram } from '../hooks/useDuelanaProgram';
import { deriveEscrowPDA, deriveTokenEscrowPDA } from '../utils/pda';
import { formatSol, formatToken, truncateAddress } from '../utils/format';
import { TREASURY, SKR_MINT, SKR_DECIMALS, TOKEN_PROGRAM_ID } from '../utils/constants';
import { fighters, tokenLogos, backgrounds } from '../assets';
import { AudioManager } from '../audio/AudioManager';

const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

function getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0];
}

export function ResultsPage() {
  const { duelPubkey: duelPubkeyParam } = useParams<{ duelPubkey: string }>();
  const navigate = useNavigate();
  const duelPubkey = new PublicKey(duelPubkeyParam!);
  const { duel } = useDuelSubscription(duelPubkey);
  const { publicKey, signAndSendTransaction } = useWallet();
  const { connection } = useConnection();
  const program = useDuelanaProgram();
  const [claiming, setClaiming] = useState(false);
  const resultVOPlayed = useRef(false);

  const isResolved = duel && ('resolved' in duel.status || 'claimed' in duel.status);
  const isWinner = duel && publicKey && isResolved && duel.winner.equals(publicKey);

  useEffect(() => {
    if (isResolved && publicKey && !resultVOPlayed.current) {
      resultVOPlayed.current = true;
      AudioManager.playResult(!!isWinner);
    }
  }, [isResolved, publicKey, isWinner]);

  const isClaimed = duel && duel.status && 'claimed' in duel.status;
  const canGoHome = !isWinner || isClaimed;

  const isToken = duel ? isTokenDuel(duel) : false;
  const tokenSymbol = isToken ? 'SKR' : 'SOL';
  const feeBps = duel?.feeBps ?? 300;
  const feePercent = feeBps / 100;

  const betAmountRaw = duel?.betAmount?.toNumber?.() ?? 0;
  const totalPot = betAmountRaw * 2;
  const fee = Math.floor((totalPot * feeBps) / 10_000);
  const payout = totalPot - fee;

  const formatAmount = (amount: number) =>
    isToken ? formatToken(amount, SKR_DECIMALS) : formatSol(amount);

  const isCreator = duel && publicKey ? duel.creator.equals(publicKey) : true;
  const myChar = isCreator ? fighters.barbarian.idle[0] : fighters.berserker.idle[0];
  const opponentChar = isCreator ? fighters.berserker.idle[0] : fighters.barbarian.idle[0];
  const opponentAddress = duel
    ? isCreator ? duel.challenger.toBase58() : duel.creator.toBase58()
    : '';
  const tokenLogo = isToken ? tokenLogos.skr : tokenLogos.sol;

  const handleClaim = useCallback(async () => {
    if (!publicKey || !duel) return;
    setClaiming(true);
    try {
      let tx;
      if (isToken) {
        const [tokenEscrowPDA] = deriveTokenEscrowPDA(duelPubkey);
        const winnerATA = getAssociatedTokenAddress(SKR_MINT, publicKey);
        const treasuryATA = getAssociatedTokenAddress(SKR_MINT, TREASURY);
        tx = await (program.methods as any)
          .claimTokenWinnings()
          .accounts({
            winner: publicKey, duel: duelPubkey, tokenEscrow: tokenEscrowPDA,
            winnerTokenAccount: winnerATA, treasury: TREASURY,
            treasuryTokenAccount: treasuryATA, tokenMint: SKR_MINT, tokenProgram: TOKEN_PROGRAM_ID,
          })
          .transaction();
      } else {
        const [escrowPDA] = deriveEscrowPDA(duelPubkey);
        tx = await (program.methods as any)
          .claimWinnings()
          .accounts({
            winner: publicKey, duel: duelPubkey, escrow: escrowPDA,
            treasury: TREASURY, systemProgram: SystemProgram.programId,
          })
          .transaction();
      }
      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const signature = await signAndSendTransaction(tx);
      await connection.confirmTransaction(signature, 'confirmed');
    } catch (err: any) {
      const msg = err?.error?.errorMessage || err?.message || 'Failed to claim winnings';
      alert(`Claim Failed: ${msg}\n\nPlease try again.`);
    } finally {
      setClaiming(false);
    }
  }, [publicKey, duel, duelPubkey, program, connection, signAndSendTransaction, payout, isToken, tokenSymbol]);

  if (!duel) {
    return (
      <div style={{ backgroundColor: colors.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <span style={{ fontFamily, fontSize: 16, color: colors.textLight }}>LOADING...</span>
      </div>
    );
  }

  if (!isResolved) {
    return (
      <div style={{
        backgroundColor: colors.bg, minHeight: '100vh', padding: spacing.md,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: spacing.lg,
        boxSizing: 'border-box',
      }}>
        <span style={{ fontFamily, fontSize: 16, color: colors.textLight }}>AWAITING VRF RESULT...</span>
        <span style={{ fontFamily, fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs }}>
          The duel is being resolved on-chain.
        </span>
        <PixelButton title="BACK TO HOME" onPress={() => navigate('/')} small />
      </div>
    );
  }

  return (
    <div style={{
      backgroundImage: `url(${backgrounds.duelArena})`,
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
      minHeight: '100vh',
    }}>
    <div style={{
      backgroundColor: 'rgba(26, 15, 8, 0.5)', minHeight: '100vh', padding: spacing.md,
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: spacing.lg,
      boxSizing: 'border-box',
    }}>
      <span style={{
        fontFamily, fontSize: 28,
        color: isWinner ? colors.gold : colors.danger,
        textShadow: `2px 2px 0 ${colors.black}`,
      }}>
        {isWinner ? 'YOU WON!' : 'YOU LOST!'}
      </span>

      <ScrollPanel variant="popup" style={{ width: '100%', maxWidth: 680, padding: 0 }}>
        <div style={{ paddingTop: 48, paddingBottom: 40, paddingLeft: 40, paddingRight: 40, display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.sm }}>
              <span style={{ fontFamily, fontSize: 11, color: colors.text, textAlign: 'center' }}>
                {isWinner ? 'The Spoils:' : 'Your Loss:'}
              </span>
              <img src={myChar} style={{ width: 100, height: 100, imageRendering: 'pixelated' as any, objectFit: 'contain' }} alt="" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <img src={tokenLogo} style={{ width: 24, height: 24, imageRendering: 'pixelated' as any }} alt="" />
                <span style={{
                  fontFamily, fontSize: 13,
                  color: isWinner ? colors.success : colors.danger,
                  textShadow: `1px 1px 0 ${colors.black}`,
                }}>
                  {isWinner ? formatAmount(payout) : formatAmount(betAmountRaw)}
                </span>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.sm }}>
              <span style={{ fontFamily, fontSize: 11, color: colors.text, textAlign: 'center' }}>
                {isWinner ? 'The Defeated:' : 'The Victor:'}
              </span>
              <img src={opponentChar} style={{ width: 100, height: 100, imageRendering: 'pixelated' as any, objectFit: 'contain' }} alt="" />
              <span style={{ fontFamily, fontSize: 9, color: colors.textMuted, textAlign: 'center' }}>
                {truncateAddress(opponentAddress, 4)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            <div style={{ height: 2, backgroundColor: colors.textMuted, marginBottom: spacing.xs }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily, fontSize: 9, color: colors.textMuted }}>FEE ({feePercent}%)</span>
              <span style={{ fontFamily, fontSize: 9, color: colors.text }}>-{formatAmount(fee)} {tokenSymbol}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily, fontSize: 9, color: colors.textMuted }}>TOTAL POT</span>
              <span style={{ fontFamily, fontSize: 9, color: colors.text }}>{formatAmount(totalPot)} {tokenSymbol}</span>
            </div>
          </div>
        </div>
      </ScrollPanel>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md, width: '100%', maxWidth: 320 }}>
        {isWinner && !isClaimed && (
          <PixelButton title={claiming ? 'CLAIMING...' : 'CLAIM!'} onPress={handleClaim} disabled={claiming} />
        )}
        {isWinner && isClaimed && (
          <span style={{ fontFamily, fontSize: 16, color: colors.success, textAlign: 'center' }}>WINNINGS CLAIMED!</span>
        )}
        {isWinner && !isClaimed && (
          <span style={{ fontFamily, fontSize: 12, color: colors.success, textAlign: 'center' }}>CLAIM YOUR WINNINGS FIRST!</span>
        )}
        <PixelButton title="BACK TO HOME" onPress={() => navigate('/')} disabled={!canGoHome} />
      </div>
    </div>
    </div>
  );
}
