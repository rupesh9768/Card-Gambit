import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flag, RotateCcw, Swords } from 'lucide-react';
import BattleCard from '../components/BattleCard.jsx';
import { getDuelResult, getInventory, playDuelRound, startDuel } from '../lib/api.js';

const deckStorageKey = 'card-gambit-deck';
const playablePhases = new Set(['idle']);

export default function DuelPage() {
  const [duel, setDuel] = useState(null);
  const [roundResult, setRoundResult] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [battlePhase, setBattlePhase] = useState('idle');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const timersRef = useRef([]);

  useEffect(() => {
    createDuel();

    return clearBattleTimers;
  }, []);

  const playerCards = duel?.playerDeck ?? [];
  const aiCards = duel?.aiDeck ?? [];
  const selectedPreviewCard = playerCards.find((card) => card.id === selectedCardId);
  const canPlay = duel && !loading && !matchResult && playablePhases.has(battlePhase);
  const scoreLabel = duel ? `${duel.score.player} - ${duel.score.ai}` : '0 - 0';
  const roundLabel = useMemo(() => `Round ${Math.min(duel?.round ?? 1, 5)} / 5`, [duel]);

  async function createDuel() {
    clearBattleTimers();
    setLoading(true);
    setError('');
    setDuel(null);
    setMatchResult(null);
    setRoundResult(null);
    setSelectedCardId(null);
    setBattlePhase('idle');

    try {
      const inventory = await getInventory();
      const ownedCards = inventory.cards.filter((card) => card.collected);
      const playerDeck = getSavedDeck(ownedCards).slice(0, 5);

      if (playerDeck.length < 5) {
        setError('You need 5 owned cards in your deck to start a duel.');
        return;
      }

      const nextDuel = await startDuel(playerDeck);
      setDuel(nextDuel);
    } catch {
      setError('Could not start duel.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCardSelect(card) {
    if (!canPlay || card.used) {
      return;
    }

    clearBattleTimers();
    setSelectedCardId(card.id);
    setBattlePhase('playerSelected');
    setLoading(true);
    playSound('card-select');

    try {
      const result = await playDuelRound(duel.duelId, card.id);
      playSound('card-reveal');
      setRoundResult(result);
      setBattlePhase('aiReveal');
      setDuel({
        ...duel,
        playerDeck: duel.playerDeck.map((playerCard) =>
          playerCard.id === card.id ? { ...playerCard, used: true } : playerCard,
        ),
        aiDeck: duel.aiDeck.map((aiCard) =>
          aiCard.id === result.aiCard.id ? { ...result.aiCard, used: true } : aiCard,
        ),
        usedPlayerCards: [...(duel.usedPlayerCards ?? []), result.playerCard],
        usedAiCards: [...(duel.usedAiCards ?? []), result.aiCard],
        score: result.score,
        round: result.round,
      });

      queueBattleStep(() => {
        playSound('card-impact');
        setBattlePhase('impact');
      }, 520);
      queueBattleStep(() => setBattlePhase('result'), 1050);

      const finalResult = await getDuelResult(duel.duelId);

      if (finalResult.complete) {
        queueBattleStep(() => {
          setMatchResult(finalResult);
          setBattlePhase('result');
        }, 1900);
      } else {
        queueBattleStep(() => {
          setRoundResult(null);
          setSelectedCardId(null);
          setBattlePhase('idle');
        }, 2400);
      }
    } catch {
      setError('Could not play round.');
      setBattlePhase('idle');
      setSelectedCardId(null);
      setRoundResult(null);
    } finally {
      setLoading(false);
    }
  }

  function handleSurrender() {
    if (matchResult) {
      return;
    }

    clearBattleTimers();
    setLoading(false);
    setRoundResult(null);
    setSelectedCardId(null);
    setBattlePhase('result');
    setMatchResult({ complete: true, winner: 'ai', surrendered: true });
  }

  function clearBattleTimers() {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
  }

  function queueBattleStep(callback, delay) {
    const timer = setTimeout(callback, delay);
    timersRef.current.push(timer);
  }

  return (
    <main className="duel-screen relative bg-[#03030a] text-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.12),transparent_18rem),radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.18),transparent_18rem),radial-gradient(circle_at_80%_8%,rgba(168,85,247,0.18),transparent_20rem),linear-gradient(180deg,#020617_0%,#090416_45%,#020617_100%)]" />
      <motion.div
        className="absolute inset-0 bg-[linear-gradient(120deg,rgba(14,165,233,0.08),transparent,rgba(168,85,247,0.1))]"
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      />
      <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-300/10 bg-amber-300/[0.03] blur-sm" />

      <div className="relative z-10 flex h-screen flex-col overflow-hidden">
        <div className="pointer-events-none absolute left-3 right-3 top-3 z-20 flex items-start justify-between gap-3">
          <motion.button
            type="button"
            onClick={handleSurrender}
            disabled={Boolean(matchResult)}
            whileHover={!matchResult ? { scale: 1.04 } : undefined}
            whileTap={!matchResult ? { scale: 0.98 } : undefined}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-rose-300/25 bg-rose-950/35 px-4 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-rose-100 shadow-lg shadow-rose-950/30 backdrop-blur transition hover:border-rose-300/55 hover:bg-rose-500/15 disabled:cursor-default disabled:opacity-45"
          >
            <Flag size={15} />
            Surrender
          </motion.button>
          <div className="rounded-full border border-amber-300/20 bg-black/40 px-5 py-2 text-center shadow-ember backdrop-blur">
            <p className="font-display text-2xl font-black leading-none text-amber-100">{scoreLabel}</p>
            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">{roundLabel}</p>
          </div>
        </div>

        <section className="flex h-[24vh] items-center justify-center px-3 pt-10">
          <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
            {aiCards.map((card, index) => (
              <motion.div
                key={`${card.id}-${index}`}
                initial={{ opacity: 0, y: -18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
              >
                <BattleCard
                  card={card}
                  hidden={!card.used}
                  used={card.used}
                  variant="opponent"
                  className={card.used ? 'card-reveal' : ''}
                />
              </motion.div>
            ))}
          </div>
        </section>

        <section className="duel-arena relative grid h-[51vh] place-items-center overflow-hidden border-y border-white/10">
          <AnimatePresence>
            {battlePhase === 'impact' && (
              <motion.div
                className="absolute inset-0 z-20 bg-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.55, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28 }}
              />
            )}
          </AnimatePresence>
          <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-300/20 bg-amber-300/[0.04] shadow-ember" />
          <div className="duel-arena-grid relative z-10 px-3 sm:px-6">
            <ArenaSlot
              key={`player-${roundResult?.round ?? 'empty'}-${roundResult?.playerCard?.id ?? selectedCardId ?? 'none'}`}
              side="player"
              phase={battlePhase}
              result={roundResult}
              previewCard={selectedPreviewCard}
            />
            <RoundCenter phase={battlePhase} result={roundResult} matchResult={matchResult} loading={loading && Boolean(duel)} />
            <ArenaSlot
              key={`ai-${roundResult?.round ?? 'empty'}-${roundResult?.aiCard?.id ?? 'none'}`}
              side="ai"
              phase={battlePhase}
              result={roundResult}
            />
          </div>
        </section>

        <section className="flex h-[25vh] items-center justify-center overflow-visible px-2 pb-2">
          <div className="flex items-end justify-center gap-1.5 sm:gap-3 md:gap-4">
            {playerCards.map((card, index) => {
              const offset = index - 2;
              const isSelected = selectedCardId === card.id;
              const rotation = offset * 3;

              return (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ opacity: 0, y: 24, rotate: rotation }}
                  animate={{
                    opacity: card.used ? 0.38 : 1,
                    y: Math.abs(offset) * 3,
                    rotate: rotation,
                    scale: 1,
                  }}
                  whileHover={
                    canPlay && !card.used
                      ? {
                          y: -15,
                          scale: 1.08,
                          rotate: offset * 1.2,
                          filter: getHoverGlow(card.rarity),
                          zIndex: 50,
                        }
                      : undefined
                  }
                  transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                  style={{
                    zIndex: isSelected ? 20 : index + 1,
                    transformOrigin: 'center bottom',
                  }}
                >
                  <BattleCard
                    card={card}
                    used={card.used}
                    selected={isSelected}
                    onClick={canPlay ? handleCardSelect : undefined}
                    variant="hand"
                    className={isSelected && battlePhase !== 'idle' ? 'opacity-25' : ''}
                  />
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>

      {(loading && !duel) || error || matchResult ? (
        <StatusOverlay
          loading={loading && !duel}
          error={error}
          matchResult={matchResult}
          onRestart={createDuel}
        />
      ) : null}
    </main>
  );
}

function ArenaSlot({ side, phase, result, previewCard }) {
  const previewOnly = side === 'player' && !result && previewCard && phase === 'playerSelected';

  if (!result && !previewOnly) {
    return (
      <div className="duel-empty-slot mx-auto grid place-items-center rounded-[1.2rem] border border-white/10 bg-black/15 text-center shadow-inner shadow-black/30">
        <p className="text-[9px] font-black uppercase tracking-[0.24em] text-slate-500">
          {side === 'player' ? 'Your card' : 'AI card'}
        </p>
      </div>
    );
  }

  const card = previewOnly ? previewCard : side === 'player' ? result.playerCard : result.aiCard;
  const rating = previewOnly ? null : side === 'player' ? result.playerRating : result.aiRating;
  const opposingRating = previewOnly ? null : side === 'player' ? result.aiRating : result.playerRating;
  const hasHigherRating = rating !== null && rating > opposingRating;
  const won = !previewOnly && result.roundWinner === side;
  const showRating = !previewOnly && ['impact', 'result'].includes(phase);
  const isAi = side === 'ai';

  return (
    <motion.div
      className="mx-auto grid place-items-center gap-2"
      initial={{
        opacity: 0,
        y: side === 'player' ? 92 : -92,
        scale: 0.86,
        rotate: side === 'player' ? -6 : 6,
        rotateY: isAi ? 180 : 0,
      }}
      animate={
        phase === 'impact'
          ? {
              opacity: 1,
              y: 0,
              scale: [1, 1.22, 1],
              rotate: 0,
              rotateY: 0,
              x: side === 'player' ? [0, 16, -9, 7, 0] : [0, -16, 9, -7, 0],
            }
          : { opacity: 1, y: 0, scale: previewOnly ? 1.08 : 1, rotate: 0, rotateY: 0, x: 0 }
      }
      exit={{ opacity: 0, y: side === 'player' ? 80 : -80, scale: 0.85 }}
      transition={{ duration: isAi ? 0.68 : 0.56, delay: isAi ? 0.22 : 0, ease: 'easeInOut' }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <BattleCard card={card} selected={won || previewOnly} variant="arena" />
      <AnimatePresence>
        {showRating && (
          <motion.div
            className={`rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] ${
              hasHigherRating
                ? side === 'player'
                  ? 'border-emerald-300/60 bg-emerald-400/15 text-emerald-100 shadow-[0_0_24px_rgba(52,211,153,0.32)]'
                  : 'border-rose-300/60 bg-rose-400/15 text-rose-100 shadow-[0_0_24px_rgba(251,113,133,0.32)]'
                : 'border-white/10 bg-white/[0.06] text-slate-300'
            }`}
            initial={{ opacity: 0, scale: 0.8, y: -6 }}
            animate={{ opacity: 1, scale: [0.8, 1.2, 1], y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 8 }}
            transition={{ duration: 0.38 }}
          >
            Rating {rating}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RoundCenter({ phase, result, matchResult, loading }) {
  const winnerKey = result?.roundWinner ?? matchResult?.winner;
  const winner = getWinnerLabel(winnerKey);
  const showWinner = phase === 'result' && (result || matchResult);

  return (
    <div className="relative z-10 grid min-w-[7rem] place-items-center text-center sm:min-w-40">
      <motion.div
        className="grid min-h-36 w-full place-items-center rounded-3xl border border-white/10 bg-black/30 px-4 py-4 shadow-2xl shadow-black/30 backdrop-blur"
        animate={phase === 'impact' ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="grid h-14 w-14 place-items-center rounded-full border border-amber-300/25 bg-black/45 shadow-ember">
          <Swords className="text-amber-100" size={25} />
        </div>
        <p className="mt-3 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
          {getPhaseLabel(phase, loading)}
        </p>
        <AnimatePresence mode="wait">
          {showWinner ? (
            <motion.p
              key={winner}
              className={`mt-2 font-display text-2xl font-black ${getWinnerClass(winnerKey)}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: [0.8, 1.1, 1] }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.34 }}
            >
              {winner}
            </motion.p>
          ) : (
            <motion.p
              key="prompt"
              className="mt-2 font-display text-xl font-black text-amber-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {phase === 'idle' ? 'Choose Card' : 'Ready'}
            </motion.p>
          )}
        </AnimatePresence>
        {matchResult && (
          <p className="mt-2 rounded-full border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-amber-100 sm:text-xs">
            {getMatchLabel(matchResult)}
          </p>
        )}
      </motion.div>
    </div>
  );
}

function StatusOverlay({ loading, error, matchResult, onRestart }) {
  const title = loading ? 'Starting Duel' : error || getMatchLabel(matchResult);

  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-black/55 px-4 backdrop-blur-sm">
      <motion.div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/90 p-6 text-center shadow-2xl shadow-black/60"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
      >
        <p className="font-display text-3xl font-black text-amber-100">{title}</p>
        {loading && <p className="mt-2 text-sm text-slate-400">Shuffling the arena...</p>}
        {matchResult && (
          <button
            type="button"
            onClick={onRestart}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-amber-100 transition hover:border-amber-300/60 hover:shadow-ember"
          >
            <RotateCcw size={16} />
            Rematch
          </button>
        )}
      </motion.div>
    </div>
  );
}

function getWinnerLabel(winner) {
  if (winner === 'player') {
    return 'YOU WIN';
  }

  if (winner === 'ai') {
    return 'AI WINS';
  }

  if (winner === 'draw') {
    return 'DRAW';
  }

  return 'CHOOSE CARD';
}

function getWinnerClass(winner) {
  if (winner === 'player') {
    return 'text-emerald-300 drop-shadow-[0_0_16px_rgba(52,211,153,0.45)]';
  }

  if (winner === 'ai') {
    return 'text-rose-300 drop-shadow-[0_0_16px_rgba(251,113,133,0.45)]';
  }

  return 'text-amber-100';
}

function getMatchLabel(matchResult) {
  if (matchResult?.surrendered) {
    return 'Surrendered';
  }

  if (matchResult?.winner === 'player') {
    return 'Match Won';
  }

  if (matchResult?.winner === 'ai') {
    return 'Match Lost';
  }

  return 'Match Draw';
}

function getPhaseLabel(phase, loading) {
  if (loading) {
    return 'Resolving';
  }

  if (phase === 'playerSelected') {
    return 'Card Played';
  }

  if (phase === 'aiReveal') {
    return 'Reveal';
  }

  if (phase === 'impact') {
    return 'Impact';
  }

  if (phase === 'result') {
    return 'Result';
  }

  return 'Clash';
}

function getHoverGlow(rarity) {
  const glows = {
    Common: 'drop-shadow(0 0 12px rgba(148, 163, 184, 0.35))',
    Rare: 'drop-shadow(0 0 16px rgba(56, 189, 248, 0.5))',
    Epic: 'drop-shadow(0 0 18px rgba(168, 85, 247, 0.55))',
    Legendary: 'drop-shadow(0 0 20px rgba(245, 158, 11, 0.62))',
    Unknown: 'drop-shadow(0 0 20px rgba(217, 70, 239, 0.62))',
  };

  return glows[rarity] ?? glows.Unknown;
}

function playSound(_eventName) {
  // Placeholder for future card sounds.
}

function getSavedDeck(ownedCards) {
  try {
    const savedIds = JSON.parse(localStorage.getItem(deckStorageKey) ?? '[]');
    const savedCards = savedIds
      .map((id) => ownedCards.find((card) => card.id === id))
      .filter(Boolean);
    const fillerCards = ownedCards.filter((card) => !savedIds.includes(card.id));

    return [...savedCards, ...fillerCards];
  } catch {
    return ownedCards;
  }
}
