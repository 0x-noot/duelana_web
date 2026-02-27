# Duelana

> A provably fair on-chain dueling game built for the web & the **Solana Seeker** phone.

Duelana is a medieval pixel art fighting game at heart — but underneath the swords and fanfare it's a 50/50 wager resolved by **MagicBlock VRF**. Two players lock SOL or SKR tokens in escrow, the VRF oracle picks a winner, and a ~26-second sprite animation plays out the dramatic result.

Deployed to **Solana Devnet** and playable on Android via the Solana Mobile Stack or in Web browsers.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Blockchain | Solana (Devnet) |
| Smart contracts | Anchor |
| Wallet | @solana/wallet-adapter (Phantom, Solflare) |
| Audio | Howler.js |
| Routing | React Router DOM v6 |

---

## Features

- **Create Duels** — Stake SOL or SKR and wait for a challenger
- **Lobby** — Browse and join open duels in real time
- **Battle Animations** — Sprite-based combat sequence with sound effects
- **Provably Fair** — MagicBlock VRF oracle resolves every duel on-chain
- **Claim Winnings** — Winners claim their pot directly from the escrow account
- **History & P&L** — Track your win/loss record and net earnings per token

---

## Getting Started

### Prerequisites

- A Solana wallet browser extension (Phantom or Solflare)
- Devnet SOL for testing ([faucet](https://faucet.solana.com))



## How It Works

1. **Create** — A player creates a duel by staking a wager. Funds are locked in an on-chain escrow PDA.
2. **Join** — An opponent joins from the lobby, matching the exact wager amount.
3. **Resolve** — The MagicBlock VRF oracle generates a verifiable random result on-chain. 50/50 odds.
4. **Claim** — The winner calls `claimWinnings` to pull the pot from escrow.

### Fee Structure

| Token | Protocol Fee |
|---|---|
| SOL | 3% of pot |
| SKR | 1% of pot |

Duels can be cancelled anytime before an opponent joins, refunding the full wager.

---

## Smart Contract

- **Network:** Solana Devnet
- **Program ID:** `3gE3AwSm9yVYCTSXHFiqWShzoU5vGjwTXJRL7WLz6vNv`
- **Treasury:** `6uT7LVyYWZS37pC2cv4FtMeMT9ScnivjukxfxFgbgEPY`
- **VRF Oracle:** MagicBlock — `Cuj97ggrhhidhbu39TijNVqE74xvKJ69gDervRUXAxGh`

### Key Instructions

| Instruction | Description |
|---|---|
| `createDuel` | Create a SOL-wagered duel |
| `createTokenDuel` | Create an SKR token-wagered duel |
| `joinDuel` | Challenger joins and stakes matching wager |
| `claimWinnings` | Winner claims pot after VRF resolution |

---

## Project Structure

```
src/
├── assets/          # Sprite and asset exports
├── audio/           # Audio manager, hooks, and asset refs
├── components/      # Reusable UI components
├── hooks/           # Anchor program, duel subscriptions, balance
├── idl/             # Anchor program IDL (duelana.json)
├── pages/           # Route-level page components
├── providers/       # Solana connection and wallet providers
├── theme/           # Colors, spacing, typography
└── utils/           # Constants, formatters, PDA helpers
```

### Pages & Routes

| Route | Page |
|---|---|
| `/` | Home — main menu |
| `/create` | Create Duel — pick token and wager |
| `/lobby` | Lobby — browse open duels |
| `/waiting/:duelPubkey` | Waiting for Opponent |
| `/animation/:duelPubkey` | Battle Animation |
| `/results/:duelPubkey` | Results & Claim |
| `/history` | Duel History & Statistics |

---


## License

See [LICENSE](./LICENSE).
