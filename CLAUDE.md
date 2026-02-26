# Duelana Web — Project Reference

## Project Overview

Duelana Web is the browser version of the Duelana on-chain dueling game on Solana. It is a direct port of the [mobile app](../Duelana_seeker/app/) — same on-chain program, same visual theme (medieval pixel art), same game flow — adapted for web browsers with standard Solana wallet extensions (Phantom, Solflare) instead of Mobile Wallet Adapter.

**Program ID:** `3gE3AwSm9yVYCTSXHFiqWShzoU5vGjwTXJRL7WLz6vNv`
**Deployed:** Devnet (live)
**On-chain program source:** `../Duelana_seeker/programs/duelana/`
**Mobile app source:** `../Duelana_seeker/app/`

### Game Flow
1. User opens the web app and connects wallet (Phantom/Solflare browser extension)
2. Home page: **Create New Duel** or **View Existing Duels** (matchmaking lobby)
3. Creating a duel: pick **SOL or SKR token**, choose bet size, confirm and sign transaction
4. Duel appears in the live lobby for other users to join
5. Second user joins, depositing matching bet into escrow
6. Duel auto-resolves via MagicBlock VRF (50/50 chance)
7. A pixel art animation of two characters fighting plays out (~26 seconds)
8. Winner claims escrowed funds minus protocol fee (3% SOL / 1% SKR)

---

## Tech Stack

| Technology | Purpose | Replaces (Mobile) |
|---|---|---|
| Vite 5 | Build tool / dev server | Metro / Expo |
| React 18 | UI library | React Native |
| React Router v6 | Page routing | React Navigation |
| TypeScript 5 | Type safety | TypeScript |
| @solana/wallet-adapter-react | Wallet connection | Mobile Wallet Adapter (MWA) |
| @coral-xyz/anchor ^0.30.1 | Anchor client | Same |
| @solana/web3.js ^1.95.0 | Solana SDK | Same |
| Howler.js | Audio playback | expo-av |
| vite-plugin-node-polyfills | Buffer/crypto polyfills | react-native-get-random-values + buffer |
| CSS (inline styles) | Styling | React Native StyleSheet |

---

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev

# Type check
npx tsc --noEmit

# Production build
npm run build

# Preview production build
npm run preview
```

---

## Environment Variables

Create a `.env` file in the project root (optional):

```
VITE_HELIUS_API_KEY=<your-helius-api-key>
```

If not set, falls back to `https://api.devnet.solana.com`. Access in code via `import.meta.env.VITE_HELIUS_API_KEY`.

---

## Project Structure

```
duelana_web/
├── CLAUDE.md                      # This file
├── package.json                   # Vite + React + Solana deps
├── vite.config.ts                 # Vite config with nodePolyfills
├── tsconfig.json                  # ES2020, bundler moduleResolution
├── index.html                     # Entry HTML with PressStart2P font-face
├── .gitignore
│
├── public/                        # Static assets (served as-is)
│   ├── sprites/                   # All pixel art sprite PNGs
│   │   ├── units/                 # Character sprite frames
│   │   │   ├── barbarian/frames/  # idle_0-3, walk_down_0-2, attack_down_0-2
│   │   │   └── berserker/frames/  # idle_0-3, walk_up_0-2, attack_up_0-2
│   │   ├── button-long-up.png     # Button sprites (normal + pressed)
│   │   ├── popup-menu.png         # Parchment panel sprites
│   │   ├── health bar.png         # HP bar decoration
│   │   ├── hitsplat.png           # RS-style damage overlay
│   │   ├── solana_logo.png        # Token logos
│   │   ├── SKR_logo.png
│   │   └── ...                    # Backgrounds, scrolls, UI elements
│   ├── audio/
│   │   ├── music/                 # home_page.wav, battle_music.mp3
│   │   └── sound_effects/         # battle_sounds/, voice_overs/, UI_sounds/
│   └── fonts/
│       └── PressStart2P.ttf       # 8-bit retro font
│
└── src/
    ├── main.tsx                   # ReactDOM entry point
    ├── App.tsx                    # BrowserRouter + Providers + Routes
    ├── vite-env.d.ts              # Vite type declarations
    │
    ├── idl/
    │   └── duelana.json           # Anchor IDL (hand-maintained, 9 instructions)
    │
    ├── utils/
    │   ├── constants.ts           # PROGRAM_ID, TREASURY, SKR_MINT, bet presets, RPC_URL
    │   ├── pda.ts                 # deriveDuelPDA(), deriveEscrowPDA(), deriveTokenEscrowPDA()
    │   └── format.ts             # formatSol(), formatToken(), truncateAddress(), solToLamports()
    │
    ├── hooks/
    │   ├── useDuelanaProgram.ts   # Anchor Program instance via wallet-adapter
    │   ├── useDuelSubscription.ts # Manual Borsh decoder, useAllDuels, useHistoryDuels, isTokenDuel
    │   └── useBalance.ts         # SOL balance via onAccountChange
    │
    ├── providers/
    │   ├── ConnectionProvider.tsx  # Solana Connection context
    │   └── WalletProvider.tsx     # wallet-adapter-react setup + useWallet() wrapper
    │
    ├── audio/
    │   ├── AudioManager.ts        # Howler.js singleton (music, SFX, mute)
    │   ├── audioAssets.ts         # URL paths to /audio/ files
    │   └── useAudio.ts           # useScreenMusic, useMuted, useToggleMute, useAudioManager
    │
    ├── assets/
    │   └── index.ts              # Centralized URL paths to /sprites/ files
    │
    ├── theme/
    │   └── index.ts              # colors, spacing, fontFamily constants
    │
    ├── components/
    │   ├── SpriteButton.tsx       # Pixel art button with press-state image swap (also exports PixelButton)
    │   ├── ScrollPanel.tsx        # Parchment container (popup/scroll/banner/card variants)
    │   ├── SpriteAnimator.tsx     # Frame-cycling sprite animation component
    │   ├── DuelCard.tsx           # Lobby duel row with join/cancel
    │   ├── HistoryCard.tsx        # History duel row with result/P&L
    │   ├── BetAmountPicker.tsx    # Preset buttons + custom input
    │   ├── RSCloseButton.tsx      # Red X close button
    │   └── WalletConnectButton.tsx # Wraps @solana/wallet-adapter-react-ui WalletMultiButton
    │
    └── pages/
        ├── HomePage.tsx           # Landing page with background, info modal, mute toggle
        ├── CreateDuelPage.tsx     # SOL/SKR toggle, bet picker, transaction building
        ├── LobbyPage.tsx          # Live duel list, join/cancel, creator auto-nav
        ├── WaitingForOpponentPage.tsx  # Polls for challenger, cancel handler
        ├── DuelAnimationPage.tsx  # 26-second fight animation with hitsplats, HP bars, VRF
        ├── ResultsPage.tsx        # Two-column RS-style results, claim handler
        └── HistoryPage.tsx        # Stats banner, duel history list
```

---

## Routing

Defined in `App.tsx` using React Router v6:

| Path | Page | Params |
|---|---|---|
| `/` | HomePage | — |
| `/create` | CreateDuelPage | — |
| `/lobby` | LobbyPage | — |
| `/waiting/:duelPubkey` | WaitingForOpponentPage | `duelPubkey` (base58) |
| `/animation/:duelPubkey` | DuelAnimationPage | `duelPubkey` (base58) |
| `/results/:duelPubkey` | ResultsPage | `duelPubkey` (base58) |
| `/history` | HistoryPage | — |

Navigation state is passed via `useLocation().state` (e.g., `betAmount`, `tokenType`, `isCreator`).

---

## Key Constants

| Constant | Value |
|---|---|
| Program ID | `3gE3AwSm9yVYCTSXHFiqWShzoU5vGjwTXJRL7WLz6vNv` |
| Treasury | `6uT7LVyYWZS37pC2cv4FtMeMT9ScnivjukxfxFgbgEPY` |
| SOL Fee | 3% (300 bps) |
| SKR Fee | 1% (100 bps) |
| SKR Mint | `9DdqwXM6BRWLdMesSf2fBWp9ZgeoJ2Qbr8rVKnyGAW2T` (devnet) |
| SKR Decimals | 6 |
| VRF Oracle Queue | `Cuj97ggrhhidhbu39TijNVqE74xvKJ69gDervRUXAxGh` (devnet) |
| VRF Program | `Vrf1RNUjXmQGjmQrQLvJHs9SNkvDJEsRVFPkfSQUwGz` |
| Duel Account Size | 190 bytes |
| SOL Bet Presets | 0.05, 0.1, 0.25, 0.5, 1.0 SOL |
| SKR Bet Presets | 100, 250, 500, 750, 1000 SKR |

---

## On-Chain Program

The on-chain program is shared with the mobile app and lives at `../Duelana_seeker/programs/duelana/`. See `../Duelana_seeker/CLAUDE.md` for full program documentation.

### 9 Instructions
- **SOL (5):** `create_duel`, `join_duel`, `resolve_duel`, `claim_winnings`, `cancel_duel`
- **Token (4):** `create_token_duel`, `join_token_duel`, `claim_token_winnings`, `cancel_token_duel`

### Duel Account Layout (190 bytes)
```
Offset  Field              Type     Size
0-8     discriminator       -       8
8-40    creator             Pubkey  32
40-72   challenger          Pubkey  32
72-80   bet_amount          u64 LE  8
80-112  token_mint          Pubkey  32
112-114 fee_bps             u16 LE  2
114-115 status              u8      1
115-147 winner              Pubkey  32
147-148 escrow_bump         u8      1
148-149 duel_bump           u8      1
149-157 created_at          i64 LE  8
157-158 vrf_result tag      u8      1
158-190 vrf_result data     [u8;32] 32
```

Manual Borsh decoder in `src/hooks/useDuelSubscription.ts` (bypasses Anchor's BorshAccountsCoder — unnecessary for web, but works identically and avoids potential issues).

### PDA Seeds
| PDA | Seeds |
|---|---|
| Duel Account | `[b"duel", creator.key(), &created_at.to_le_bytes()]` |
| SOL Escrow | `[b"escrow", duel.key()]` |
| Token Escrow | `[b"token_escrow", duel.key()]` |

### State Machine
```
Waiting → Active    (join_duel / join_token_duel)
Waiting → Cancelled (cancel_duel / cancel_token_duel)
Active  → Resolved  (resolve_duel — VRF callback)
Resolved → Claimed  (claim_winnings / claim_token_winnings)
```

### VRF Resolution
`result[0] < 128` → creator wins, else challenger wins.

---

## Architecture Patterns

### Wallet Integration
`WalletProviderSetup` in `src/providers/WalletProvider.tsx` wraps the standard `@solana/wallet-adapter-react` stack. The exported `useWallet()` hook provides a `signAndSendTransaction()` method for compatibility with transaction-building patterns from the mobile app.

```tsx
// Transaction building pattern:
const tx = await program.methods.createDuel(new BN(lamports), new BN(createdAt))
  .accounts({ creator: publicKey, duel: duelPDA, escrow: escrowPDA, systemProgram })
  .transaction();
tx.feePayer = publicKey;
tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
const signature = await signAndSendTransaction(tx);
```

### Token Type Detection
```typescript
import { isTokenDuel } from '../hooks/useDuelSubscription';
import { ZERO_PUBKEY } from '../utils/constants';

// isTokenDuel checks !duel.tokenMint.equals(ZERO_PUBKEY)
const isToken = isTokenDuel(duel);
const tokenSymbol = isToken ? 'SKR' : 'SOL';
```

### ATA Derivation
Each page that needs token accounts derives ATAs locally:
```typescript
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

function getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0];
}
```

### Asset References
All sprite and audio assets are in `public/` and referenced as URL string paths:
```typescript
// src/assets/index.ts
export const backgrounds = {
  castle: '/sprites/CASTLE-MAIN_MENU_BG.png',
  homeNew: '/sprites/background_new.png',
  // ...
};
```

Images use `<img src={path} />` or `backgroundImage: url(${path})` CSS. All pixel art uses `image-rendering: pixelated` for crisp rendering.

### Audio System
`AudioManager` singleton in `src/audio/AudioManager.ts` using Howler.js:
- `playMusic(track)` — looped background music at 0.4 volume
- `stopMusic()` — stops current music
- `playSfx(source)` — fire-and-forget sound effect
- `playBattleHit()`, `playHeavyImpact()`, `playCountdown(3|2|1)`, `playResult(won)`, `playUIClick()` — convenience methods
- Mute state persisted to `localStorage`

React hooks: `useScreenMusic(track)`, `useMuted()`, `useToggleMute()`, `useAudioManager()`

`useScreenMusic` uses `useLocation()` (React Router) to detect page changes and stop/start music accordingly.

### Duel Animation (~26 seconds)
`DuelAnimationPage.tsx` implements a phase state machine:

| Time | Phase | What Happens |
|---|---|---|
| 0-2s | idle | Fighters idle, "FIGHTERS READY..." |
| 2-5s | countdown | 3-2-1 countdown with voice overs |
| 5-9s | walk | Fighters walk toward center (CSS translateY transition) |
| 9-17s | clash | Attack animations, hitsplats every 800ms, HP drains |
| 17-19s | fateDecides | "FATE DECIDES..." text |
| 19-22.5s | defeat | Loser fades, winner keeps attacking |
| 22.5-25.5s | ko | "K.O.!" banner, gold flash, music stops |
| 25.5s+ | navigate | Redirect to results page |

Hitsplat system: `generateHitSequence()` pre-generates 16 damage pairs. Winner deals 99 total damage (2-12 per hit), loser deals 64 total (0-8 per hit). HP bars use discrete integer values out of 99.

Animations use CSS transitions + React state (not React Native Animated API):
- Walk: `transition: transform 4s linear` on sprite containers
- Hitsplat fade: `transition: opacity 700ms ease-out`
- Flash overlay: `transition: opacity 0.1s`
- Loser fade: `transition: opacity 2s ease`

---

## Visual Design

### Theme
```typescript
colors: {
  bg: '#2a2520',       // dark medieval brown
  surface: '#c9965f',   // parchment tan
  primary: '#ff981f',   // orange
  gold: '#ffff00',      // winner highlight
  text: '#2a1810',      // dark brown (on parchment)
  textLight: '#ff981f', // orange (on dark backgrounds)
  success: '#00ff00',   // green
  danger: '#ff0000',    // red
}
fontFamily: "'PressStart2P', monospace"
```

### Component Patterns
- **SpriteButton**: `<button>` with `backgroundImage` CSS, swaps between up/down sprites on mousedown/mouseup. Plays UI click sound.
- **ScrollPanel**: `<div>` with `backgroundImage` parchment sprite, `background-size: 100% 100%`. Variants: `popup`, `scroll`, `banner`, `card`.
- **SpriteAnimator**: `<img>` with `useState` + `setInterval` frame cycling. Safe index clamping on frame array switches.
- All inline styles (no CSS modules) — consistent with the project pattern.

### Pixel Art Rendering
All images use `image-rendering: pixelated` (set globally in `index.html` and on individual elements). Sprites are pre-upscaled with nearest-neighbor interpolation.

---

## Relationship to Mobile App

This project shares the following with `../Duelana_seeker/app/`:

| What | Mobile | Web | Shared? |
|---|---|---|---|
| On-chain program | Same | Same | Yes |
| IDL (`duelana.json`) | Same | Copied | Yes (keep in sync) |
| Constants/PDAs | Same values | Same values | Duplicated |
| Manual Borsh decoder | Same logic | Copied | Yes |
| Sprite assets | `require()` | URL paths | Same PNGs |
| Audio assets | `require()` | URL paths | Same files |
| Wallet connection | MWA | wallet-adapter-react | Different |
| Audio engine | expo-av | Howler.js | Different |
| Navigation | React Navigation | React Router v6 | Different |
| UI components | React Native | HTML + CSS | Different |
| Animation | RN Animated API | CSS transitions | Different |

When updating the on-chain program or IDL, both `../Duelana_seeker/app/src/idl/duelana.json` and `src/idl/duelana.json` must be updated.

---

## Devnet WebSocket Reliability

Devnet public WebSocket frequently misses events. Both `useAllDuels()` (5s polling) and `useDuelSubscription()` (4s polling) have fallback polling in addition to WebSocket subscriptions.

MagicBlock VRF resolves very fast — by the time polling detects the duel status changed, it's usually already Resolved (2), not Active (1). Status checks for "duel was joined" must check `>= 1`, not just `=== 1`.

---

## Known Issues / Future Work

- **Large bundle size** (~820KB gzipped ~245KB): Solana/Anchor dependencies are heavy. Consider code-splitting with dynamic `import()` or `manualChunks` in vite.config.ts.
- **Character selection**: Currently hardcoded (creator=barbarian, challenger=berserker). Knight and blacksmith sprites available in `public/sprites/units/`.
- **Treasury ATA for SKR**: Must exist before token duels can be claimed. Create with: `spl-token create-account 9DdqwXM6BRWLdMesSf2fBWp9ZgeoJ2Qbr8rVKnyGAW2T --owner 6uT7LVyYWZS37pC2cv4FtMeMT9ScnivjukxfxFgbgEPY`
- **Mainnet deployment**: Currently devnet only.
- **Mobile responsiveness**: Layout is responsive but has not been exhaustively tested on all screen sizes.

---

## Security Notes

- Never expose private keys or wallet seeds in client code
- All transaction signing happens through wallet extension (Phantom/Solflare)
- Fee calculations use the on-chain `fee_bps` field (per-duel), not a client-side constant
- Treasury address is hardcoded both on-chain and in client constants
- VRF randomness is verifiable via MagicBlock oracle
