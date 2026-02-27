import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PublicKey } from '@solana/web3.js';
import { colors, fontFamily, spacing } from '../theme';
import { useDuelSubscription } from '../hooks/useDuelSubscription';
import { useConnection } from '../providers/ConnectionProvider';
import { useWallet } from '../providers/WalletProvider';
import { backgrounds, fighters, ui, buttons } from '../assets';
import { PixelButton } from '../components/SpriteButton';
import { SpriteAnimator } from '../components/SpriteAnimator';
import { ScrollPanel } from '../components/ScrollPanel';
import { useScreenMusic, useAudioManager, useMuted, useToggleMute } from '../audio/useAudio';
import { AudioManager } from '../audio/AudioManager';

const SPRITE_SIZE = 160;
const VRF_TIMEOUT_MS = 45_000;
const POLL_INTERVAL_MS = 4_000;

// Hitsplat / chunked HP constants
const MAX_HP = 99;
const WINNER_END_HP = 35;
const HIT_INTERVAL_MS = 800;
const HITSPLAT_VISIBLE_MS = 700;
const HITSPLAT_SIZE = 64;
const TOTAL_HITS = 16;

interface HitEvent {
  p1Damage: number;
  p2Damage: number;
}

type AnimPhase =
  | 'idle'
  | 'countdown'
  | 'walk'
  | 'clash'
  | 'fateDecides'
  | 'defeat'
  | 'ko'
  | 'navigate';

function generateHitSequence(who: 'creator' | 'challenger'): HitEvent[] {
  const hits: HitEvent[] = [];
  const winnerTotalDmg = MAX_HP;
  const loserTotalDmg = MAX_HP - WINNER_END_HP;

  const winnerRaw: number[] = [];
  const loserRaw: number[] = [];

  for (let i = 0; i < TOTAL_HITS; i++) {
    winnerRaw.push(2 + Math.floor(Math.random() * 11));
    loserRaw.push(Math.floor(Math.random() * 9));
  }

  const winnerSum = winnerRaw.reduce((a, b) => a + b, 0);
  const loserSum = loserRaw.reduce((a, b) => a + b, 0) || 1;

  let winnerAccum = 0;
  let loserAccum = 0;

  for (let i = 0; i < TOTAL_HITS; i++) {
    let wDmg: number;
    let lDmg: number;

    if (i === TOTAL_HITS - 1) {
      wDmg = Math.max(0, winnerTotalDmg - winnerAccum);
      lDmg = Math.max(0, loserTotalDmg - loserAccum);
    } else {
      wDmg = Math.max(0, Math.round((winnerRaw[i] / winnerSum) * winnerTotalDmg));
      lDmg = Math.max(0, Math.round((loserRaw[i] / loserSum) * loserTotalDmg));
      wDmg = Math.min(wDmg, winnerTotalDmg - winnerAccum);
      lDmg = Math.min(lDmg, loserTotalDmg - loserAccum);
    }

    winnerAccum += wDmg;
    loserAccum += lDmg;

    if (who === 'creator') {
      hits.push({ p1Damage: lDmg, p2Damage: wDmg });
    } else {
      hits.push({ p1Damage: wDmg, p2Damage: lDmg });
    }
  }

  return hits;
}

export function DuelAnimationPage() {
  const { duelPubkey: duelPubkeyStr } = useParams<{ duelPubkey: string }>();
  const navigate = useNavigate();
  const duelPubkey = useMemo(() => {
    try { return new PublicKey(duelPubkeyStr!); } catch { return undefined; }
  }, [duelPubkeyStr]);

  const { duel } = useDuelSubscription(duelPubkey);
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const [phase, setPhase] = useState<AnimPhase>('idle');
  const [winner, setWinner] = useState<'creator' | 'challenger' | null>(null);
  const [vrfTimedOut, setVrfTimedOut] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState<string | null>(null);
  const [p1Anim, setP1Anim] = useState<'idle' | 'walk' | 'attack'>('idle');
  const [p2Anim, setP2Anim] = useState<'idle' | 'walk' | 'attack'>('idle');

  useScreenMusic('battle');
  const audio = useAudioManager();
  const muted = useMuted();
  const toggleMute = useToggleMute();

  // Chunked HP state
  const [p1Hp, setP1Hp] = useState(MAX_HP);
  const [p2Hp, setP2Hp] = useState(MAX_HP);

  // Hitsplat display state
  const [p1Hitsplat, setP1Hitsplat] = useState<number | null>(null);
  const [p2Hitsplat, setP2Hitsplat] = useState<number | null>(null);
  const [p1HitsplatVisible, setP1HitsplatVisible] = useState(false);
  const [p2HitsplatVisible, setP2HitsplatVisible] = useState(false);

  // CSS-driven animation state
  const [p1TranslateY, setP1TranslateY] = useState(0);
  const [p2TranslateY, setP2TranslateY] = useState(0);
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [loserOpacity, setLoserOpacity] = useState(1);
  const [walkTransition, setWalkTransition] = useState(false);

  const winnerRevealed = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hitSequence = useRef<HitEvent[] | null>(null);
  const hitIndex = useRef(0);
  const hitTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const combatStarted = useRef(false);

  const p1Frames = useMemo(() => {
    switch (p1Anim) {
      case 'idle': return fighters.barbarian.idle;
      case 'walk': return fighters.barbarian.walkDown;
      case 'attack': return fighters.barbarian.attackDown;
    }
  }, [p1Anim]);

  const p2Frames = useMemo(() => {
    switch (p2Anim) {
      case 'idle': return fighters.berserker.idle;
      case 'walk': return fighters.berserker.walkUp;
      case 'attack': return fighters.berserker.attackUp;
    }
  }, [p2Anim]);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
    return t;
  }, []);

  // ---- Deliver a single hit ----
  const deliverHit = useCallback(() => {
    if (!hitSequence.current) return;
    if (hitIndex.current >= hitSequence.current.length) {
      if (hitTimer.current) {
        clearInterval(hitTimer.current);
        hitTimer.current = null;
      }
      return;
    }

    const hit = hitSequence.current[hitIndex.current];
    hitIndex.current += 1;

    audio.playBattleHit();

    setP1Hp(prev => Math.max(0, prev - hit.p1Damage));
    setP2Hp(prev => Math.max(0, prev - hit.p2Damage));

    // P1 hitsplat
    setP1Hitsplat(hit.p1Damage);
    setP1HitsplatVisible(true);
    setTimeout(() => {
      setP1HitsplatVisible(false);
      setP1Hitsplat(null);
    }, HITSPLAT_VISIBLE_MS);

    // P2 hitsplat
    setP2Hitsplat(hit.p2Damage);
    setP2HitsplatVisible(true);
    setTimeout(() => {
      setP2HitsplatVisible(false);
      setP2Hitsplat(null);
    }, HITSPLAT_VISIBLE_MS);
  }, [audio]);

  // ---- VRF Resolution ----
  useEffect(() => {
    if (!duel) return;
    const statusKey = Object.keys(duel.status)[0];
    if (statusKey === 'resolved' || statusKey === 'claimed') {
      const isCreatorWinner = duel.winner.equals(duel.creator);
      setWinner(isCreatorWinner ? 'creator' : 'challenger');
    }
  }, [duel]);

  // Polling fallback
  useEffect(() => {
    if (winner || !duelPubkey) return;

    const pollInterval = setInterval(async () => {
      try {
        const info = await connection.getAccountInfo(duelPubkey, 'confirmed');
        if (!info) return;
        const data = new Uint8Array(info.data);
        const statusByte = data[114];
        if (statusByte === 2 || statusByte === 3) {
          const winnerPk = new PublicKey(data.slice(115, 147));
          const creatorPk = new PublicKey(data.slice(8, 40));
          setWinner(winnerPk.equals(creatorPk) ? 'creator' : 'challenger');
        }
      } catch {
        // polling failed
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollInterval);
  }, [winner, duelPubkey, connection]);

  // VRF timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!winner) setVrfTimedOut(true);
    }, VRF_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [winner]);

  // ---- Main Animation Sequence ----
  useEffect(() => {
    setPhase('idle');
    setP1Anim('idle');
    setP2Anim('idle');

    // Countdown (2-5s)
    schedule(() => {
      setPhase('countdown');
      setCountdownNumber('3');
      audio.playCountdown(3);
    }, 2000);
    schedule(() => { setCountdownNumber('2'); audio.playCountdown(2); }, 3000);
    schedule(() => { setCountdownNumber('1'); audio.playCountdown(1); }, 4000);

    // Walk (5-9s)
    schedule(() => {
      setPhase('walk');
      setCountdownNumber('FIGHT!');
      setP1Anim('walk');
      setP2Anim('walk');
      // Enable CSS transition before setting target values
      setWalkTransition(true);
      // Use requestAnimationFrame to ensure transition property is applied first
      requestAnimationFrame(() => {
        const walkDist = window.innerHeight * 0.2;
        setP1TranslateY(walkDist);
        setP2TranslateY(-walkDist);
      });
    }, 5000);

    schedule(() => setCountdownNumber(null), 5800);

    // Clash (9-17s)
    schedule(() => {
      setPhase('clash');
      setP1Anim('attack');
      setP2Anim('attack');
      setWalkTransition(false);
    }, 9000);

    // Impact flashes
    [10500, 13000, 15500].forEach((t) => {
      schedule(() => {
        audio.playHeavyImpact();
        setFlashOpacity(0.6);
        setTimeout(() => setFlashOpacity(0), 200);
      }, t);
    });

    // Fate Decides (17-19s)
    schedule(() => {
      setPhase('fateDecides');
    }, 17000);

    return () => {
      timers.current.forEach(clearTimeout);
      if (hitTimer.current) clearInterval(hitTimer.current);
    };
  }, []);

  // ---- Combat Tick System ----
  useEffect(() => {
    if (!winner || combatStarted.current) return;
    const activePhases: AnimPhase[] = ['clash', 'fateDecides', 'defeat'];
    if (!activePhases.includes(phase)) return;

    combatStarted.current = true;
    hitSequence.current = generateHitSequence(winner);
    hitIndex.current = 0;

    deliverHit();
    hitTimer.current = setInterval(deliverHit, HIT_INTERVAL_MS);
  }, [winner, phase, deliverHit]);

  // Stop combat ticks during KO/navigate
  useEffect(() => {
    if (phase === 'ko' || phase === 'navigate') {
      if (hitTimer.current) {
        clearInterval(hitTimer.current);
        hitTimer.current = null;
      }
    }
  }, [phase]);

  // ---- HP-Reactive Defeat Sequence ----
  useEffect(() => {
    if (!winner) return;

    const loserHp = winner === 'creator' ? p2Hp : p1Hp;
    if (loserHp > 0) return;
    if (winnerRevealed.current) return;

    winnerRevealed.current = true;

    if (hitTimer.current) {
      clearInterval(hitTimer.current);
      hitTimer.current = null;
    }

    // Defeat phase
    schedule(() => {
      setPhase('defeat');
      setP1Anim('idle');
      setP2Anim('idle');
      setLoserOpacity(0.15);
    }, 500);

    // K.O. phase
    schedule(() => {
      setPhase('ko');
      AudioManager.stopMusic();

      // Flash sequence
      setFlashOpacity(1);
      setTimeout(() => setFlashOpacity(0), 100);
      setTimeout(() => setFlashOpacity(1), 200);
      setTimeout(() => setFlashOpacity(0), 400);
    }, 3000);

    // Navigate to results
    schedule(() => {
      setPhase('navigate');
      navigate(`/results/${duelPubkeyStr}`, { replace: true });
    }, 6000);
  }, [winner, p1Hp, p2Hp, navigate, duelPubkeyStr, schedule]);

  const getStatusText = () => {
    switch (phase) {
      case 'idle': return 'FIGHTERS READY...';
      case 'countdown':
      case 'walk': return '';
      case 'clash': return 'STEEL MEETS STEEL!';
      case 'fateDecides': return 'FATE DECIDES...';
      case 'defeat':
        return winner === 'creator' ? 'BARBARIAN WINS!' : 'BERSERKER WINS!';
      case 'ko':
      default: return '';
    }
  };

  const p1IsLoser = winner === 'challenger';
  const p2IsLoser = winner === 'creator';

  return (
    <div style={{
      backgroundImage: `url(${backgrounds.duelArena})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
      position: 'relative',
      imageRendering: 'pixelated' as any,
    }}>
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'rgba(26, 15, 8, 0.4)',
        paddingTop: spacing.xl + 20,
        paddingBottom: spacing.md,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        position: 'relative',
      }}>
        {/* Mute toggle */}
        <button
          onClick={toggleMute}
          style={{
            position: 'absolute',
            top: spacing.xl + 16,
            right: spacing.md,
            width: 48,
            height: 44,
            zIndex: 100,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            opacity: muted ? 0.4 : 1,
          }}
        >
          <div style={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(${buttons.smallUp})`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            imageRendering: 'pixelated' as any,
          }}>
            <span style={{ fontFamily, fontSize: 14, color: colors.text }}>♫</span>
          </div>
        </button>

        {/* Status text */}
        <span style={{
          fontFamily,
          fontSize: 18,
          color: colors.gold,
          textAlign: 'center',
          minHeight: 24,
          textShadow: `2px 2px 0 ${colors.black}`,
          display: 'block',
        }}>
          {getStatusText()}
        </span>

        {/* Arena */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: `${spacing.md}px 0`,
        }}>
          {/* P1 (Barbarian / Creator) — top */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.xs }}>
            <span style={{
              fontFamily,
              fontSize: 13,
              color: colors.textLight,
              textShadow: `1px 1px 0 ${colors.black}`,
            }}>
              P1 - CREATOR
            </span>
            {/* Health bar */}
            <div style={{
              width: '50vw',
              maxWidth: 384,
              height: 24,
              backgroundImage: `url(${ui.healthBar})`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              display: 'flex',
              alignItems: 'center',
              padding: '0 6px',
              imageRendering: 'pixelated' as any,
              boxSizing: 'border-box',
            }}>
              <div style={{
                height: 10,
                borderRadius: 2,
                backgroundColor: '#6b8e23',
                width: `${(p1Hp / MAX_HP) * 100}%`,
                transition: 'width 0.1s',
              }} />
            </div>
            {/* Sprite container */}
            <div style={{
              width: SPRITE_SIZE,
              height: SPRITE_SIZE,
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              transform: `translateY(${p1TranslateY}px)`,
              transition: walkTransition ? 'transform 4s linear' : 'none',
              opacity: p1IsLoser && (phase === 'defeat' || phase === 'ko') ? loserOpacity : 1,
              ...(p1IsLoser && (phase === 'defeat' || phase === 'ko')
                ? { transition: 'opacity 2s ease, transform 4s linear' }
                : {}),
            }}>
              <SpriteAnimator
                frames={p1Frames}
                frameDuration={p1Anim === 'walk' ? 180 : 220}
                playing={phase !== 'navigate'}
                style={{ width: SPRITE_SIZE, height: SPRITE_SIZE }}
              />
              {p1Hitsplat !== null && (
                <div style={{
                  position: 'absolute',
                  top: (SPRITE_SIZE - HITSPLAT_SIZE) / 2,
                  left: (SPRITE_SIZE - HITSPLAT_SIZE) / 2,
                  width: HITSPLAT_SIZE,
                  height: HITSPLAT_SIZE,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 10,
                  opacity: p1HitsplatVisible ? 1 : 0,
                  transition: `opacity ${HITSPLAT_VISIBLE_MS}ms ease-out`,
                }}>
                  <img
                    src={ui.hitsplat}
                    alt=""
                    style={{
                      width: HITSPLAT_SIZE,
                      height: HITSPLAT_SIZE,
                      position: 'absolute',
                      imageRendering: 'pixelated' as any,
                    }}
                  />
                  <span style={{
                    fontFamily,
                    fontSize: 14,
                    color: '#ffffff',
                    textShadow: '1px 1px 0 #000000',
                    zIndex: 11,
                    textAlign: 'center',
                    position: 'relative',
                  }}>
                    {p1Hitsplat}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Center zone — countdown */}
          <div style={{
            height: 80,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {countdownNumber && (
              <span style={{
                fontFamily,
                fontSize: 50,
                color: colors.gold,
                textShadow: `3px 3px 0 ${colors.black}`,
              }}>
                {countdownNumber}
              </span>
            )}
          </div>

          {/* P2 (Berserker / Challenger) — bottom */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.xs }}>
            {/* Sprite container */}
            <div style={{
              width: SPRITE_SIZE,
              height: SPRITE_SIZE,
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              transform: `translateY(${p2TranslateY}px)`,
              transition: walkTransition ? 'transform 4s linear' : 'none',
              opacity: p2IsLoser && (phase === 'defeat' || phase === 'ko') ? loserOpacity : 1,
              ...(p2IsLoser && (phase === 'defeat' || phase === 'ko')
                ? { transition: 'opacity 2s ease, transform 4s linear' }
                : {}),
            }}>
              <SpriteAnimator
                frames={p2Frames}
                frameDuration={p2Anim === 'walk' ? 180 : 220}
                playing={phase !== 'navigate'}
                style={{ width: SPRITE_SIZE, height: SPRITE_SIZE }}
              />
              {p2Hitsplat !== null && (
                <div style={{
                  position: 'absolute',
                  top: (SPRITE_SIZE - HITSPLAT_SIZE) / 2,
                  left: (SPRITE_SIZE - HITSPLAT_SIZE) / 2,
                  width: HITSPLAT_SIZE,
                  height: HITSPLAT_SIZE,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 10,
                  opacity: p2HitsplatVisible ? 1 : 0,
                  transition: `opacity ${HITSPLAT_VISIBLE_MS}ms ease-out`,
                }}>
                  <img
                    src={ui.hitsplat}
                    alt=""
                    style={{
                      width: HITSPLAT_SIZE,
                      height: HITSPLAT_SIZE,
                      position: 'absolute',
                      imageRendering: 'pixelated' as any,
                    }}
                  />
                  <span style={{
                    fontFamily,
                    fontSize: 14,
                    color: '#ffffff',
                    textShadow: '1px 1px 0 #000000',
                    zIndex: 11,
                    textAlign: 'center',
                    position: 'relative',
                  }}>
                    {p2Hitsplat}
                  </span>
                </div>
              )}
            </div>
            {/* Health bar */}
            <div style={{
              width: '50vw',
              maxWidth: 384,
              height: 24,
              backgroundImage: `url(${ui.healthBar})`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              display: 'flex',
              alignItems: 'center',
              padding: '0 6px',
              imageRendering: 'pixelated' as any,
              boxSizing: 'border-box',
            }}>
              <div style={{
                height: 10,
                borderRadius: 2,
                backgroundColor: '#6b8e23',
                width: `${(p2Hp / MAX_HP) * 100}%`,
                transition: 'width 0.1s',
              }} />
            </div>
            <span style={{
              fontFamily,
              fontSize: 13,
              color: colors.textLight,
              textShadow: `1px 1px 0 ${colors.black}`,
            }}>
              P2 - CHALLENGER
            </span>
          </div>
        </div>

        {/* K.O. overlay */}
        {phase === 'ko' && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexDirection: 'column',
            paddingTop: '12vh',
            zIndex: 10,
            pointerEvents: 'none',
          }}>
            <ScrollPanel variant="banner" style={{
              paddingLeft: spacing.xl,
              paddingRight: spacing.xl,
              paddingTop: spacing.md,
              paddingBottom: spacing.md,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{
                fontFamily,
                fontSize: 38,
                color: colors.danger,
                textShadow: `3px 3px 0 ${colors.gold}`,
                textAlign: 'center',
              }}>
                K.O.!
              </span>
            </ScrollPanel>
          </div>
        )}

        {/* Flash overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.gold,
          opacity: flashOpacity,
          pointerEvents: 'none',
          transition: 'opacity 0.1s',
          zIndex: 20,
        }} />

        {/* VRF waiting indicator */}
        {(phase === 'fateDecides' || phase === 'clash') && !winner && !vrfTimedOut && (
          <span style={{
            fontFamily,
            fontSize: 12,
            color: colors.textLight,
            textAlign: 'center',
            marginTop: spacing.sm,
            textShadow: `1px 1px 0 ${colors.black}`,
            display: 'block',
          }}>
            AWAITING VRF...
          </span>
        )}

        {/* VRF timeout fallback */}
        {vrfTimedOut && !winner && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: spacing.md,
            marginTop: spacing.md,
          }}>
            <span style={{
              fontFamily,
              fontSize: 12,
              color: colors.danger,
              textAlign: 'center',
              textShadow: `1px 1px 0 ${colors.black}`,
            }}>
              VRF IS TAKING LONGER THAN EXPECTED
            </span>
            <PixelButton
              title="CHECK RESULTS"
              onPress={() => navigate(`/results/${duelPubkeyStr}`, { replace: true })}
              small
            />
            <PixelButton
              title="BACK TO LOBBY"
              onPress={() => navigate('/lobby', { replace: true })}
              small
            />
          </div>
        )}
      </div>
    </div>
  );
}
