import { useMemo } from 'react';
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { useConnection } from '../providers/ConnectionProvider';
import { useWallet } from '../providers/WalletProvider';
import idl from '../idl/duelana.json';

export function useDuelanaProgram() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  const program = useMemo(() => {
    const walletAdapter = {
      publicKey: publicKey ?? new PublicKey(new Uint8Array(32)),
      signTransaction: signTransaction ?? (async (tx: any) => tx),
      signAllTransactions: async (txs: any[]) => {
        if (!signTransaction) return txs;
        return Promise.all(txs.map(tx => signTransaction(tx)));
      },
    };
    const provider = new AnchorProvider(
      connection,
      walletAdapter as any,
      { commitment: 'confirmed' },
    );
    return new Program(idl as any, provider);
  }, [connection, publicKey, signTransaction]);

  return program;
}
