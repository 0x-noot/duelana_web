import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConnectionProvider } from './providers/ConnectionProvider';
import { WalletProviderSetup } from './providers/WalletProvider';
import { AudioManager } from './audio/AudioManager';
import { HomePage } from './pages/HomePage';
import { CreateDuelPage } from './pages/CreateDuelPage';
import { LobbyPage } from './pages/LobbyPage';
import { WaitingForOpponentPage } from './pages/WaitingForOpponentPage';
import { DuelAnimationPage } from './pages/DuelAnimationPage';
import { ResultsPage } from './pages/ResultsPage';
import { HistoryPage } from './pages/HistoryPage';

import '@solana/wallet-adapter-react-ui/styles.css';

export default function App() {
  useEffect(() => {
    AudioManager.init();
    return () => { AudioManager.cleanup(); };
  }, []);

  return (
    <BrowserRouter>
      <ConnectionProvider>
        <WalletProviderSetup>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create" element={<CreateDuelPage />} />
            <Route path="/lobby" element={<LobbyPage />} />
            <Route path="/waiting/:duelPubkey" element={<WaitingForOpponentPage />} />
            <Route path="/animation/:duelPubkey" element={<DuelAnimationPage />} />
            <Route path="/results/:duelPubkey" element={<ResultsPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </WalletProviderSetup>
      </ConnectionProvider>
    </BrowserRouter>
  );
}
