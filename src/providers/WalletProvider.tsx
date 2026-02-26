import React, { useMemo, ReactNode } from 'react';
import { ConnectionProvider as WalletConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletProvider as SolanaWalletProvider, useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { RPC_URL } from '../utils/constants';
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

export function WalletProviderSetup({ children }: Props) {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    [],
  );

  return (
    <WalletConnectionProvider endpoint={RPC_URL}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </WalletConnectionProvider>
  );
}

// Re-export useWallet with a compatible interface
export function useWallet() {
  const { publicKey, connected, connect, disconnect, sendTransaction, signTransaction } = useSolanaWallet();

  const signAndSendTransaction = async (transaction: any): Promise<string> => {
    if (!sendTransaction) throw new Error('Wallet not connected');
    // Web wallet adapter's sendTransaction signs and sends in one step
    // We need the connection from our ConnectionProvider
    const { Connection } = await import('@solana/web3.js');
    const connection = new Connection(RPC_URL, 'confirmed');
    return sendTransaction(transaction, connection);
  };

  return {
    publicKey,
    connected,
    connect,
    disconnect,
    signAndSendTransaction,
    signTransaction,
  };
}
