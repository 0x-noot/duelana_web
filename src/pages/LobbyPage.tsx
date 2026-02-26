import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { colors, fontFamily, spacing } from '../theme';
import { DuelCard } from '../components/DuelCard';
import { PixelButton } from '../components/SpriteButton';
import { ScrollPanel } from '../components/ScrollPanel';
import { RSCloseButton } from '../components/RSCloseButton';
import { useWallet } from '../providers/WalletProvider';
import { useConnection } from '../providers/ConnectionProvider';
import { useAllDuels, DuelAccount, isTokenDuel } from '../hooks/useDuelSubscription';
import { useDuelanaProgram } from '../hooks/useDuelanaProgram';
import { deriveEscrowPDA, deriveTokenEscrowPDA } from '../utils/pda';
import { VRF_ORACLE_QUEUE, VRF_PROGRAM_ID, SLOT_HASHES_SYSVAR, PROGRAM_ID, SKR_MINT, TOKEN_PROGRAM_ID } from '../utils/constants';

const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

function getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0];
}

export function LobbyPage() {
  const { publicKey, signAndSendTransaction } = useWallet();
  const { connection } = useConnection();
  const program = useDuelanaProgram();
  const { duels, loading, refresh } = useAllDuels();
  const navigate = useNavigate();
  const [joining, setJoining] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState<PublicKey | null>(null);
  const cancelRunning = useRef(false);
  const myWaitingDuelsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!publicKey) return;
    const currentMyDuels = new Set<string>();
    for (const { publicKey: duelPk, account } of duels) {
      if (account.creator.equals(publicKey)) {
        currentMyDuels.add(duelPk.toBase58());
      }
    }
    for (const prevDuelKey of myWaitingDuelsRef.current) {
      if (!currentMyDuels.has(prevDuelKey) && cancelling !== prevDuelKey) {
        const duelPk = new PublicKey(prevDuelKey);
        connection.getAccountInfo(duelPk, 'confirmed').then((info) => {
          if (!info) return;
          const data = new Uint8Array(info.data);
          const statusByte = data[114];
          if (statusByte >= 1 && statusByte <= 3) {
            navigate(`/animation/${prevDuelKey}`);
          }
        }).catch(() => {});
      }
    }
    myWaitingDuelsRef.current = currentMyDuels;
  }, [duels, publicKey, cancelling, connection, navigate]);

  const findDuel = useCallback(
    (duelPubkey: PublicKey): DuelAccount | undefined => {
      return duels.find((d) => d.publicKey.equals(duelPubkey))?.account;
    },
    [duels],
  );

  useEffect(() => {
    if (!pendingCancel || !publicKey || cancelRunning.current) return;
    cancelRunning.current = true;
    const duelPubkey = pendingCancel;

    (async () => {
      setCancelling(duelPubkey.toBase58());
      try {
        const duelData = findDuel(duelPubkey);
        const isToken = duelData && isTokenDuel(duelData);
        let tx;

        if (isToken) {
          const [tokenEscrowPDA] = deriveTokenEscrowPDA(duelPubkey);
          const creatorATA = getAssociatedTokenAddress(SKR_MINT, publicKey);
          tx = await (program.methods as any)
            .cancelTokenDuel()
            .accounts({
              creator: publicKey, duel: duelPubkey, tokenEscrow: tokenEscrowPDA,
              creatorTokenAccount: creatorATA, tokenMint: SKR_MINT,
              tokenProgram: TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId,
            })
            .transaction();
        } else {
          const [escrowPDA] = deriveEscrowPDA(duelPubkey);
          tx = await (program.methods as any)
            .cancelDuel()
            .accounts({
              creator: publicKey, duel: duelPubkey, escrow: escrowPDA,
              systemProgram: SystemProgram.programId,
            })
            .transaction();
        }

        tx.feePayer = publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        const signature = await signAndSendTransaction(tx);
        await connection.confirmTransaction(signature, 'confirmed');
        alert(isToken ? 'Your SKR has been returned.' : 'Your SOL has been returned.');
        refresh();
      } catch (err: any) {
        alert(err?.message || 'Failed to cancel duel');
      } finally {
        setCancelling(null);
        setPendingCancel(null);
        cancelRunning.current = false;
      }
    })();
  }, [pendingCancel, publicKey, program, connection, signAndSendTransaction, refresh, findDuel]);

  const handleCancel = useCallback(
    (duelPubkey: PublicKey) => {
      if (!publicKey) return;
      const duelData = findDuel(duelPubkey);
      const tokenLabel = duelData && isTokenDuel(duelData) ? 'SKR' : 'SOL';
      if (confirm(`Cancel this duel and reclaim your ${tokenLabel}?`)) {
        setPendingCancel(duelPubkey);
      }
    },
    [publicKey, findDuel],
  );

  const handleJoin = useCallback(
    async (duelPubkey: PublicKey) => {
      if (!publicKey) return;
      setJoining(duelPubkey.toBase58());
      try {
        const duelData = findDuel(duelPubkey);
        const isToken = duelData && isTokenDuel(duelData);
        const [programIdentity] = PublicKey.findProgramAddressSync([Buffer.from('identity')], PROGRAM_ID);
        let tx;

        if (isToken) {
          const [tokenEscrowPDA] = deriveTokenEscrowPDA(duelPubkey);
          const challengerATA = getAssociatedTokenAddress(SKR_MINT, publicKey);
          tx = await (program.methods as any)
            .joinTokenDuel()
            .accounts({
              challenger: publicKey, duel: duelPubkey, tokenEscrow: tokenEscrowPDA,
              challengerTokenAccount: challengerATA, tokenMint: SKR_MINT,
              tokenProgram: TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId,
              oracleQueue: VRF_ORACLE_QUEUE, programIdentity,
              vrfProgram: VRF_PROGRAM_ID, slotHashes: SLOT_HASHES_SYSVAR,
            })
            .transaction();
        } else {
          const [escrowPDA] = deriveEscrowPDA(duelPubkey);
          tx = await (program.methods as any)
            .joinDuel()
            .accounts({
              challenger: publicKey, duel: duelPubkey, escrow: escrowPDA,
              systemProgram: SystemProgram.programId, oracleQueue: VRF_ORACLE_QUEUE,
              programIdentity, vrfProgram: VRF_PROGRAM_ID, slotHashes: SLOT_HASHES_SYSVAR,
            })
            .transaction();
        }

        tx.feePayer = publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        const signature = await signAndSendTransaction(tx);
        await connection.confirmTransaction(signature, 'confirmed');
        navigate(`/animation/${duelPubkey.toBase58()}`);
      } catch (err: any) {
        alert(err.message || 'Failed to join duel');
      } finally {
        setJoining(null);
      }
    },
    [publicKey, program, connection, signAndSendTransaction, navigate, findDuel],
  );

  return (
    <div style={{
      backgroundColor: colors.bg,
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
        paddingTop: spacing.md, paddingBottom: spacing.md, paddingLeft: spacing.lg, paddingRight: spacing.lg,
        marginBottom: spacing.md,
      }}>
        <span style={{ fontFamily, fontSize: 22, color: colors.text, textAlign: 'center' }}>
          DUEL LOBBY
        </span>
        <span style={{ fontFamily, fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs }}>
          {duels.length} DUEL{duels.length !== 1 ? 'S' : ''} AVAILABLE
        </span>
      </ScrollPanel>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {duels.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: spacing.sm, padding: spacing.xl }}>
            <span style={{ fontFamily, fontSize: 18, color: colors.textLight }}>NO DUELS YET</span>
            <span style={{ fontFamily, fontSize: 13, color: colors.textLight }}>BE THE FIRST TO CREATE ONE!</span>
          </div>
        ) : (
          duels.map((item) => (
            <DuelCard
              key={item.publicKey.toBase58()}
              publicKey={item.publicKey}
              duel={item.account}
              onJoin={handleJoin}
              onCancel={handleCancel}
              currentWallet={publicKey}
              cancelling={cancelling === item.publicKey.toBase58()}
            />
          ))
        )}
      </div>

      <div style={{ paddingTop: spacing.md }}>
        <PixelButton
          title="CREATE DUEL"
          onPress={() => navigate('/create-duel')}
          disabled={!publicKey}
        />
      </div>
    </div>
  );
}
