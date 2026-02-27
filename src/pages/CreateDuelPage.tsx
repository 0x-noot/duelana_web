import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { colors, fontFamily, spacing } from '../theme';
import { PixelButton } from '../components/SpriteButton';
import { BetAmountPicker, TokenType } from '../components/BetAmountPicker';
import { ScrollPanel } from '../components/ScrollPanel';
import { RSCloseButton } from '../components/RSCloseButton';
import { useWallet } from '../providers/WalletProvider';
import { useConnection } from '../providers/ConnectionProvider';
import { useDuelanaProgram } from '../hooks/useDuelanaProgram';
import { deriveDuelPDA, deriveEscrowPDA, deriveTokenEscrowPDA } from '../utils/pda';
import { solToLamports, tokenToSmallestUnit, truncateAddress } from '../utils/format';
import { SKR_MINT, SKR_DECIMALS, TOKEN_PROGRAM_ID } from '../utils/constants';
import { tokenLogos, backgrounds } from '../assets';

const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

function getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0];
}

export function CreateDuelPage() {
  const { publicKey, signAndSendTransaction } = useWallet();
  const { connection } = useConnection();
  const program = useDuelanaProgram();
  const navigate = useNavigate();

  const [tokenType, setTokenType] = useState<TokenType>('SOL');
  const [betAmount, setBetAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const feePercent = tokenType === 'SKR' ? 1 : 3;
  const feeMultiplier = 1 - feePercent / 100;
  const tokenLogo = tokenType === 'SKR' ? tokenLogos.skr : tokenLogos.sol;

  const handleCreate = useCallback(async () => {
    if (!publicKey || !betAmount) return;

    setLoading(true);
    try {
      const createdAt = Math.floor(Date.now() / 1000);
      const [duelPDA] = deriveDuelPDA(publicKey, createdAt);

      let tx;

      if (tokenType === 'SKR') {
        const smallestUnits = tokenToSmallestUnit(betAmount, SKR_DECIMALS);
        const [tokenEscrowPDA] = deriveTokenEscrowPDA(duelPDA);
        const creatorATA = getAssociatedTokenAddress(SKR_MINT, publicKey);

        tx = await (program.methods as any)
          .createTokenDuel(new BN(smallestUnits), new BN(createdAt))
          .accounts({
            creator: publicKey,
            duel: duelPDA,
            tokenEscrow: tokenEscrowPDA,
            creatorTokenAccount: creatorATA,
            tokenMint: SKR_MINT,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .transaction();
      } else {
        const lamports = solToLamports(betAmount);
        const [escrowPDA] = deriveEscrowPDA(duelPDA);

        tx = await (program.methods as any)
          .createDuel(new BN(lamports), new BN(createdAt))
          .accounts({
            creator: publicKey,
            duel: duelPDA,
            escrow: escrowPDA,
            systemProgram: SystemProgram.programId,
          })
          .transaction();
      }

      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signature = await signAndSendTransaction(tx);
      await connection.confirmTransaction(signature, 'confirmed');

      navigate(`/waiting/${duelPDA.toBase58()}`, {
        state: { betAmount, tokenType },
        replace: true,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to create duel');
    } finally {
      setLoading(false);
    }
  }, [publicKey, betAmount, tokenType, program, connection, signAndSendTransaction, navigate]);

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

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: spacing.md }}>
        {publicKey && (
          <span style={{
            fontFamily, fontSize: 11, color: colors.textLight,
            textAlign: 'center', textShadow: `1px 1px 0 ${colors.black}`,
          }}>
            {truncateAddress(publicKey.toBase58(), 6)}
          </span>
        )}

        <ScrollPanel variant="popup" style={{ padding: 0 }}>
          <div style={{
            paddingLeft: 28, paddingRight: 28, paddingTop: 36, paddingBottom: 28,
            display: 'flex', flexDirection: 'column', gap: spacing.md, alignItems: 'center',
          }}>
            <span style={{ fontFamily, fontSize: 14, color: colors.textMuted, textAlign: 'center' }}>
              YOUR STAKE:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}>
              <img src={tokenLogo} style={{ width: 32, height: 32, imageRendering: 'pixelated' as any }} alt="" />
              <span style={{
                fontFamily, fontSize: 20, color: colors.gold,
                textShadow: `1px 1px 0 ${colors.black}`,
              }}>
                {betAmount ? `${betAmount} ${tokenType}` : `-- ${tokenType}`}
              </span>
            </div>

            {betAmount && (
              <span style={{ fontFamily, fontSize: 11, color: colors.success, textAlign: 'center' }}>
                POT IF WON: {(betAmount * 2 * feeMultiplier).toFixed(tokenType === 'SKR' ? 2 : 4)} {tokenType}
              </span>
            )}

            <div style={{ height: 2, backgroundColor: colors.textMuted, width: '100%', margin: `${spacing.xs}px 0` }} />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.sm }}>
              <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'center' }}>
                <div style={{ opacity: tokenType === 'SOL' ? 0.4 : 1 }}>
                  <PixelButton
                    title="SOL"
                    onPress={() => { setTokenType('SOL'); setBetAmount(null); }}
                    disabled={loading}
                    small
                  />
                </div>
                <div style={{ opacity: tokenType === 'SKR' ? 0.4 : 1 }}>
                  <PixelButton
                    title="SKR"
                    onPress={() => { setTokenType('SKR'); setBetAmount(null); }}
                    disabled={loading}
                    small
                  />
                </div>
              </div>
              <span style={{ fontFamily, fontSize: 10, color: colors.success, textAlign: 'center' }}>
                {tokenType === 'SKR' ? 'SKR - 1% FEE' : 'SOL - 3% FEE'}
              </span>
            </div>

            <BetAmountPicker onSelect={setBetAmount} disabled={loading} tokenType={tokenType} />
          </div>
        </ScrollPanel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md, padding: `0 ${spacing.md}px` }}>
          <PixelButton
            title={loading ? 'CREATING...' : 'CONFIRM & SIGN'}
            onPress={handleCreate}
            disabled={!betAmount || loading}
          />
        </div>
      </div>
    </div>
    </div>
  );
}
