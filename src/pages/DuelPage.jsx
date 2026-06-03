import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Eye, Flag, Heart, Home, RotateCcw, Shield, Sparkles, Swords, Zap } from 'lucide-react';
import { applyDuelReward, getDuelResult, getInventory, playDuelRound, startDuel } from '../lib/api.js';

const preferredDeckNames = ['Flame Tyrant', 'Frost Wyrm', 'Solar Aegis', 'Abyss Walker', 'Bone Reaper'];
const playablePhases = new Set(['idle', 'selected']);
const stanceOptions = [
  { id: 'attack', label: 'Attack', icon: Swords, note: '+ATK' },
  { id: 'guard', label: 'Guard', icon: Shield, note: '+DEF' },
  { id: 'focus', label: 'Focus', icon: Zap, note: '+Ability' },
];
const difficultyOptions = ['easy', 'medium', 'hard'];
const sparks = Array.from({ length: 32 }, (_, index) => ({
  left: `${(index * 31) % 100}%`,
  bottom: `${(index * 17) % 92}%`,
  delay: `${(index % 10) * 0.42}s`,
  duration: `${5 + (index % 6) * 0.58}s`,
}));
const ghosts = [
  { left: '5%', top: '18%', delay: '0s', rotate: '-14deg' },
  { left: '21%', top: '68%', delay: '1s', rotate: '8deg' },
  { left: '78%', top: '14%', delay: '1.7s', rotate: '12deg' },
  { left: '90%', top: '63%', delay: '0.6s', rotate: '-9deg' },
];

export default function DuelPage() {
  const [duel, setDuel] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [selectedStance, setSelectedStance] = useState('attack');
  const [aiDifficulty, setAiDifficulty] = useState(() => localStorage.getItem('card-gambit-ai-difficulty') ?? 'medium');
  const [roundResult, setRoundResult] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [reward, setReward] = useState(null);
  const [rewardLoading, setRewardLoading] = useState(false);
  const [battlePhase, setBattlePhase] = useState('idle');
  const [roundHistory, setRoundHistory] = useState([]);
  const [timer, setTimer] = useState(30);
  const [shake, setShake] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const timersRef = useRef([]);
  const audioRef = useRef(null);
  const rewardClaimedRef = useRef(false);

  useEffect(() => {
    createDuel();

    return clearBattleTimers;
  }, []);

  useEffect(() => {
    if (!duel || matchResult || !playablePhases.has(battlePhase)) {
      return undefined;
    }

    const interval = setInterval(() => {
      setTimer((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [battlePhase, duel, matchResult]);

  useEffect(() => {
    if (duel && !matchResult && battlePhase === 'idle') {
      setTimer(30);
    }
  }, [battlePhase, duel?.round, matchResult]);

  useEffect(() => {
    if (!matchResult || rewardClaimedRef.current) {
      return;
    }

    rewardClaimedRef.current = true;
    setRewardLoading(true);
    applyDuelReward({ result: matchResult.winner === 'player' ? 'win' : 'lose' })
      .then(setReward)
      .catch(() => setReward(null))
      .finally(() => setRewardLoading(false));
  }, [matchResult]);

  const playerCards = duel?.playerDeck ?? [];
  const aiCards = duel?.aiDeck ?? [];
  const selectedCard = playerCards.find((card) => card.id === selectedCardId);
  const score = duel?.score ?? { player: 0, ai: 0 };
  const currentRound = Math.min(duel?.round ?? 1, 5);
  const canSelect = duel && !matchResult && !loading && playablePhases.has(battlePhase);
  const canClash = Boolean(selectedCard) && canSelect;

  async function createDuel() {
    clearBattleTimers();
    setLoading(true);
    setError('');
    setDuel(null);
    setSelectedCardId(null);
    setRoundResult(null);
    setMatchResult(null);
    setReward(null);
    setRewardLoading(false);
    rewardClaimedRef.current = false;
    setBattlePhase('idle');
    setRoundHistory([]);
    setTimer(30);
    setShake(false);

    try {
      const inventory = await getInventory();
      const ownedCards = inventory.cards.filter((card) => card.collected);
      const playerDeck = buildPreferredDeck(ownedCards);

      if (playerDeck.length < 5) {
        setError('You need 5 owned cards in your deck to start a duel.');
        return;
      }

      const nextDuel = await startDuel(playerDeck, aiDifficulty);
      setDuel(nextDuel);
    } catch {
      setError('Could not start duel.');
    } finally {
      setLoading(false);
    }
  }

  function handleCardSelect(card) {
    if (!canSelect || card.used) {
      return;
    }

    setSelectedCardId(card.id);
    setBattlePhase('selected');
    playTone('select');
  }

  async function handleClash() {
    if (!canClash || loading) {
      return;
    }

    clearBattleTimers();
    setLoading(true);
    setBattlePhase('reveal');
    setRoundResult(null);
    setBurstKey((key) => key + 1);
    playTone('clash');

    try {
      const result = await playDuelRound(duel.duelId, selectedCard.id, selectedStance);
      const roundNumber = duel.round;

      setRoundResult({ ...result, displayRound: roundNumber });
      setDuel({
        ...duel,
        playerDeck: duel.playerDeck.map((playerCard) =>
          playerCard.id === selectedCard.id ? { ...playerCard, used: true } : playerCard,
        ),
        aiDeck: duel.aiDeck.map((aiCard) =>
          aiCard.id === result.aiCard.id ? { ...result.aiCard, used: true } : aiCard,
        ),
        usedPlayerCards: [...(duel.usedPlayerCards ?? []), result.playerCard],
        usedAiCards: [...(duel.usedAiCards ?? []), result.aiCard],
        score: result.score,
        round: result.round,
      });
      setRoundHistory((history) => [...history, { ...result, round: roundNumber }]);

      queueStep(() => {
        setShake(true);
        setBattlePhase('impact');
      }, 850);
      queueStep(() => setShake(false), 1220);
      queueStep(() => {
        setBattlePhase('result');
        if (result.roundWinner === 'player') {
          playTone('win');
        }
      }, 1650);

      const finalResult = await getDuelResult(duel.duelId);

      if (finalResult.complete) {
        queueStep(() => {
          setMatchResult(finalResult);
          setBattlePhase('result');
        }, 3050);
      } else {
        queueStep(() => {
          setRoundResult(null);
          setSelectedCardId(null);
          setSelectedStance('attack');
          setBattlePhase('idle');
          setTimer(30);
        }, 3700);
      }
    } catch {
      setError('Could not play round.');
      setBattlePhase('selected');
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
    setShake(false);
    setMatchResult({ complete: true, winner: 'ai', surrendered: true });
    setBattlePhase('result');
    playTone('lose');
  }

  function handleDifficultyChange(difficulty) {
    setAiDifficulty(difficulty);
    localStorage.setItem('card-gambit-ai-difficulty', difficulty);
  }

  function clearBattleTimers() {
    timersRef.current.forEach((timeout) => clearTimeout(timeout));
    timersRef.current = [];
  }

  function queueStep(callback, delay) {
    const timeout = setTimeout(callback, delay);
    timersRef.current.push(timeout);
  }

  function getAudio() {
    if (!audioRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioRef.current = AudioContext ? new AudioContext() : null;
    }

    return audioRef.current;
  }

  function playTone(type) {
    const context = getAudio();

    if (!context) {
      return;
    }

    context.resume?.();

    if (type === 'win') {
      [440, 560, 720].forEach((frequency, index) => playOsc(context, frequency, 0.09, index * 0.09, 'triangle'));
      return;
    }

    if (type === 'lose') {
      [220, 175, 130].forEach((frequency, index) => playOsc(context, frequency, 0.1, index * 0.08, 'sawtooth', 0.035));
      return;
    }

    if (type === 'clash') {
      playOsc(context, 96, 0.08, 0, 'sawtooth', 0.08);
      playOsc(context, 640, 0.05, 0.025, 'square', 0.035);
      return;
    }

    playOsc(context, type === 'hover' ? 880 : 520, 0.045, 0, 'sine', 0.02);
  }

  return (
    <main className={`battle-screen relative text-slate-50 ${shake ? 'battle-shake' : ''}`}>
      <BattleBackground />

      <div className="relative z-10 flex h-screen flex-col overflow-hidden px-4 py-3">
        <header className="flex h-[10vh] min-h-[4.5rem] shrink-0 items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              type="button"
              onClick={handleSurrender}
              disabled={Boolean(matchResult)}
              whileHover={!matchResult ? { x: [-2, 2, -2, 2, 0], scale: 1.04 } : undefined}
              whileTap={!matchResult ? { scale: 0.97 } : undefined}
              className="inline-flex items-center gap-2 rounded-full border border-rose-400/45 bg-rose-950/45 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-rose-100 shadow-[0_0_26px_rgba(244,63,94,0.24)] backdrop-blur transition hover:border-rose-300 hover:bg-rose-500/18 disabled:cursor-default disabled:opacity-45"
            >
              <Flag size={16} />
              Surrender
            </motion.button>
            <DifficultySelector difficulty={aiDifficulty} onChange={handleDifficultyChange} disabled={Boolean(duel && !matchResult)} />
          </div>

          <ScoreHud score={score} round={currentRound} history={roundHistory} />
        </header>

        <section className="flex h-[17vh] min-h-[7.4rem] shrink-0 items-center justify-center">
          <div className="flex items-center justify-center gap-3 md:gap-5">
            {aiCards.map((card, index) => (
              <OpponentBack key={`${card.id}-${index}`} index={index} revealed={card.used} card={card} onHover={() => playTone('hover')} />
            ))}
          </div>
        </section>

        <section className="relative grid h-[45vh] min-h-0 place-items-center overflow-hidden rounded-[2rem] border border-white/10 bg-black/10">
          <div className="battle-hex-grid absolute inset-0" />
          <div className="battle-energy-beam absolute left-1/2 top-1/2 h-1 w-[30rem] max-w-[52vw] -translate-x-1/2 -translate-y-1/2" />
          <AnimatePresence>
            {battlePhase === 'impact' && (
              <motion.div
                key={`flash-${burstKey}`}
                className="absolute inset-0 z-30 bg-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.62, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.32 }}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {battlePhase === 'impact' && (
              <motion.div
                key={`burst-${burstKey}`}
                className="battle-burst absolute left-1/2 top-1/2 z-30 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full"
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: [0.2, 1.5, 2.2], opacity: [0, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
              />
            )}
          </AnimatePresence>

          <div className="relative z-10 grid w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-5 px-5">
            <CardZone
              label="Your Card"
              side="player"
              card={roundResult?.playerCard ?? selectedCard}
              rating={roundResult?.playerRating}
              combat={roundResult?.combat?.player}
              phase={battlePhase}
              winner={roundResult?.roundWinner}
              showDamage={battlePhase === 'result' && roundResult}
            />

            <ClashCenter
              canClash={canClash}
              selected={Boolean(selectedCard)}
              phase={battlePhase}
              timer={timer}
              result={roundResult}
              matchResult={matchResult}
              onClash={handleClash}
            />

            <CardZone
              label="AI Card"
              side="ai"
              card={roundResult?.aiCard}
              rating={roundResult?.aiRating}
              combat={roundResult?.combat?.ai}
              phase={battlePhase}
              winner={roundResult?.roundWinner}
              showDamage={battlePhase === 'result' && roundResult}
            />
          </div>
        </section>

        <section className="flex h-[28vh] min-h-0 shrink-0 flex-col items-center justify-center gap-2 overflow-visible px-2">
          <StanceSelector selected={selectedStance} disabled={!canSelect} onChange={setSelectedStance} />
          <div className="flex items-end justify-center gap-3 md:gap-5">
            {playerCards.map((card, index) => (
              <HandCard
                key={card.id}
                card={card}
                index={index}
                selected={selectedCardId === card.id}
                disabled={!canSelect || card.used}
                onClick={() => handleCardSelect(card)}
                onHover={() => playTone('hover')}
              />
            ))}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {((loading && !duel) || error || matchResult) && (
          <EndOverlay
            loading={loading && !duel}
            error={error}
            matchResult={matchResult}
            reward={reward}
            rewardLoading={rewardLoading}
            history={roundHistory}
            onRestart={createDuel}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function BattleBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(245,197,24,0.18),transparent_20rem),radial-gradient(circle_at_25%_28%,rgba(124,58,237,0.3),transparent_24rem),radial-gradient(circle_at_76%_24%,rgba(6,182,212,0.2),transparent_22rem),linear-gradient(135deg,#0a0b1a_0%,#130826_48%,#061525_100%)]" />
      <div className="battle-aurora absolute inset-0" />
      <div className="absolute left-1/2 top-[47%] h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f5c518]/15 bg-[#f5c518]/[0.04] blur-sm" />
      {ghosts.map((ghost, index) => (
        <span
          key={index}
          className="lobby-card-ghost"
          style={{ left: ghost.left, top: ghost.top, animationDelay: ghost.delay, rotate: ghost.rotate }}
        />
      ))}
      {sparks.map((spark, index) => (
        <span
          key={index}
          className="lobby-spark"
          style={{ left: spark.left, bottom: spark.bottom, animationDelay: spark.delay, animationDuration: spark.duration }}
        />
      ))}
      <div className="battle-mist absolute inset-x-0 bottom-0 h-36" />
    </div>
  );
}

function ScoreHud({ score, round, history }) {
  return (
    <motion.div
      className="rounded-full border border-[#f5c518]/25 bg-black/35 px-4 py-2 shadow-ember backdrop-blur-xl"
      animate={{ scale: [1, 1.03, 1] }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center gap-4">
        <ScoreBubble label="YOU" value={score.player} tone="text-cyan-100" />
        <div className="text-center">
          <p className="font-display text-lg font-black text-[#f5c518]">ROUND {round} / 5</p>
          <div className="mt-1 flex justify-center gap-1.5">
            {Array.from({ length: 5 }, (_, index) => {
              const played = index < history.length;
              const active = index === Math.min(round - 1, 4);
              return (
                <span
                  key={index}
                  className={`h-2 w-2 rounded-full ${
                    played ? 'bg-cyan-300 shadow-frost' : active ? 'bg-[#f5c518] shadow-ember animate-pulse' : 'bg-white/18'
                  }`}
                />
              );
            })}
          </div>
        </div>
        <ScoreBubble label="AI" value={score.ai} tone="text-rose-100" />
      </div>
    </motion.div>
  );
}

function ScoreBubble({ label, value, tone }) {
  return (
    <div className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-center">
      <span className={`font-display text-xl font-black leading-none ${tone}`}>{value}</span>
      <span className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</span>
    </div>
  );
}

function DifficultySelector({ difficulty, onChange, disabled }) {
  return (
    <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-black/25 p-1 backdrop-blur-xl lg:flex">
      {difficultyOptions.map((option) => (
        <button
          key={option}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option)}
          className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition ${
            difficulty === option ? 'border border-[#f5c518]/35 bg-[#f5c518]/12 text-[#f5c518] shadow-ember' : 'text-slate-400 hover:bg-white/8 hover:text-white'
          } disabled:cursor-not-allowed disabled:opacity-55`}
          title={disabled ? 'Difficulty changes on the next duel.' : `Set AI to ${option}`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function StanceSelector({ selected, disabled, onChange }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-black/30 p-1.5 backdrop-blur-xl">
      {stanceOptions.map(({ id, label, icon: Icon, note }) => (
        <motion.button
          key={id}
          type="button"
          disabled={disabled}
          onClick={() => onChange(id)}
          whileHover={!disabled ? { y: -2, scale: 1.04 } : undefined}
          whileTap={!disabled ? { scale: 0.96 } : undefined}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition ${
            selected === id
              ? 'border-[#f5c518]/45 bg-[#f5c518]/14 text-[#f5c518] shadow-ember'
              : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-cyan-300/35 hover:text-cyan-100'
          } disabled:cursor-not-allowed disabled:opacity-45`}
        >
          <Icon size={14} />
          {label}
          <span className="hidden text-slate-500 sm:inline">{note}</span>
        </motion.button>
      ))}
    </div>
  );
}

function OpponentBack({ index, revealed, card, onHover }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -34, rotate: 0 }}
      animate={{ opacity: 1, y: [0, -6, 0], rotate: 0 }}
      transition={{ opacity: { duration: 0.35, delay: index * 0.08 }, y: { duration: 3.2, repeat: Infinity, delay: index * 0.2 } }}
      whileHover={{ y: -14, scale: 1.06, filter: 'drop-shadow(0 0 18px rgba(245,197,24,0.45))' }}
      onHoverStart={onHover}
      className="battle-opponent-card relative grid place-items-center overflow-hidden rounded-2xl border border-violet-300/45 bg-purple-950/55 shadow-[0_0_26px_rgba(124,58,237,0.34)]"
    >
      {revealed ? (
        <motion.div initial={{ rotateY: 180 }} animate={{ rotateY: 0 }} transition={{ duration: 0.65 }} className="h-full w-full">
          <MiniCardFace card={card} compact />
        </motion.div>
      ) : (
        <div className="battle-card-back-face grid h-full w-full place-items-center">
          <div className="grid h-12 w-12 place-items-center rounded-full border border-[#f5c518]/30 bg-black/35 text-[#f5c518] shadow-ember">
            <Eye size={24} />
          </div>
          <p className="absolute bottom-4 text-[9px] font-black uppercase tracking-[0.28em] text-violet-100/70">Hidden</p>
        </div>
      )}
    </motion.div>
  );
}

function CardZone({ label, side, card, rating, combat, phase, winner, showDamage }) {
  const isWinner = winner === side;
  const isLoser = winner && winner !== side && winner !== 'draw';
  const active = Boolean(card);

  return (
    <div className="grid justify-items-center gap-3">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-100/70">{label}</p>
      <div className="battle-zone relative grid place-items-center overflow-visible rounded-[1.6rem] border border-[#f5c518]/28 bg-black/25 shadow-2xl shadow-black/40">
        {!active && <div className="battle-rune-circle absolute h-28 w-28 rounded-full border border-dashed border-[#f5c518]/38" />}
        {!active && <p className="font-display text-xl font-black text-[#f5c518] lobby-title-glow">Choose Card</p>}
        <AnimatePresence mode="wait">
          {active && (
            <motion.div
              key={`${side}-${card.id}-${phase}`}
              initial={{ opacity: 0, x: side === 'player' ? -160 : 160, y: side === 'player' ? 130 : -105, scale: 0.82, rotateY: side === 'ai' ? 180 : 0 }}
              animate={
                phase === 'impact'
                  ? { opacity: 1, x: [0, side === 'player' ? 34 : -34, 0], y: 0, scale: [1, 1.28, 1], rotateY: 0 }
                  : phase === 'result'
                    ? { opacity: isLoser ? 0.55 : 1, x: 0, y: isWinner ? -10 : 10, scale: isWinner ? [1, 1.08, 1.02] : 0.94, rotateY: 0 }
                    : { opacity: 1, x: 0, y: 0, scale: 1, rotateY: 0 }
              }
              exit={{ opacity: 0, y: side === 'player' ? 90 : -90, scale: 0.8 }}
              transition={{ duration: 0.82, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <PremiumCard card={card} selected={isWinner} dimmed={isLoser} arena />
              {isLoser && <div className="battle-crack pointer-events-none absolute inset-0 rounded-2xl" />}
              <AnimatePresence>
                {showDamage && (
                  <motion.div
                    className={`absolute -top-10 left-1/2 -translate-x-1/2 rounded-full border px-3 py-1 text-sm font-black ${
                      isWinner ? 'border-emerald-300/50 bg-emerald-400/15 text-emerald-100' : 'border-rose-300/50 bg-rose-400/15 text-rose-100'
                    }`}
                    initial={{ opacity: 0, y: 8, scale: 0.8 }}
                    animate={{ opacity: 1, y: -10, scale: [0.8, 1.2, 1] }}
                    exit={{ opacity: 0 }}
                  >
                    {combat ? `${isWinner ? '+' : ''}${combat.score}` : isWinner ? '+Score' : '-Round'}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {(rating !== undefined || combat) && ['impact', 'result'].includes(phase) && (
          <motion.p
            className={`rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] ${
              isWinner ? 'border-[#f5c518]/55 bg-[#f5c518]/15 text-[#f5c518] shadow-ember' : 'border-white/10 bg-white/[0.06] text-slate-200'
            }`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: [0.8, 1.18, 1] }}
          >
            {combat ? `Score ${combat.score} / DMG ${combat.damageTaken}` : `Rating ${rating}`}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function ClashCenter({ canClash, selected, phase, timer, result, matchResult, onClash }) {
  const showTimer = playablePhases.has(phase);
  const countdown = Math.max(0, Math.min(30, timer));
  const degrees = showTimer ? (countdown / 30) * 360 : 360;
  const underTen = showTimer && countdown <= 10;
  const winnerKey = matchResult?.winner ?? result?.roundWinner;
  const centerText = winnerKey ? getWinnerText(winnerKey) : selected ? 'Ready to Clash' : 'Choose Card';

  return (
    <div className="grid min-w-[10rem] place-items-center gap-3 text-center">
      <motion.button
        type="button"
        aria-label="Clash"
        onClick={onClash}
        disabled={!canClash}
        initial={{ opacity: 0, rotate: -35, scale: 0.82 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        whileHover={canClash ? { scale: 1.08 } : undefined}
        whileTap={canClash ? { scale: 0.96 } : undefined}
        className="battle-clash-button relative grid h-24 w-24 place-items-center rounded-full border border-[#f5c518]/55 bg-black/48 text-[#f5c518] shadow-ember disabled:cursor-not-allowed disabled:opacity-55"
        style={{
          background: `conic-gradient(${underTen ? '#fb7185' : '#f5c518'} ${degrees}deg, rgba(255,255,255,0.08) ${degrees}deg), rgba(0,0,0,0.55)`,
        }}
      >
        <span className="grid h-16 w-16 place-items-center rounded-full bg-black/70">
          <Swords size={31} />
        </span>
      </motion.button>
      <p className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-400">{phase === 'impact' ? 'Impact' : 'Clash'}</p>
      <p className={`lobby-title-glow font-display text-2xl font-black ${winnerKey === 'ai' ? 'text-rose-300' : winnerKey === 'player' ? 'text-[#f5c518]' : 'text-[#f5c518]'}`}>
        {centerText}
      </p>
      <p className={`rounded-full border px-3 py-1 text-xs font-black ${underTen ? 'border-rose-300/40 text-rose-200 animate-pulse' : 'border-white/10 text-cyan-100/80'}`}>
        {showTimer ? `${countdown}s` : '...'}
      </p>
      {result?.aiStance && (
        <p className="max-w-44 rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-300">
          You: {result.playerStance} / AI: {result.aiStance}
        </p>
      )}
      {result?.combat?.events?.length > 0 && (
        <div className="max-h-20 w-52 overflow-hidden rounded-2xl border border-cyan-300/18 bg-cyan-400/8 px-3 py-2 text-left">
          {result.combat.events.slice(0, 2).map((event, index) => (
            <p key={`${event.cardName}-${index}`} className="truncate text-[10px] font-bold text-cyan-100/85">
              {event.text}
            </p>
          ))}
        </div>
      )}
      <Zap className="battle-lightning text-cyan-200" size={28} />
    </div>
  );
}

function HandCard({ card, index, selected, disabled, onClick, onHover }) {
  const rotation = (index - 2) * 2;

  return (
    <motion.div
      className="group relative"
      initial={{ opacity: 0, y: 70, rotate: rotation }}
      animate={{ opacity: card.used ? 0.35 : 1, y: Math.abs(index - 2) * 2, rotate: rotation, scale: selected ? 1.08 : 1 }}
      transition={{ duration: 0.45, delay: 0.12 + index * 0.1, type: 'spring', stiffness: 220, damping: 22 }}
      whileHover={!disabled ? { y: -20, scale: 1.08, rotateX: 8, filter: getCardGlow(card.rarity) } : undefined}
      style={{ transformPerspective: 900, zIndex: selected ? 50 : index + 1 }}
      onHoverStart={!disabled ? onHover : undefined}
    >
      <PremiumCard card={card} selected={selected} disabled={disabled} onClick={onClick} />
      {!disabled && <CardTooltip card={card} />}
    </motion.div>
  );
}

function PremiumCard({ card, selected = false, disabled = false, dimmed = false, onClick, arena = false }) {
  const rarity = getRarityStyle(card.rarity);

  return (
    <button
      type="button"
      disabled={disabled || !onClick}
      onClick={onClick}
      className={`premium-card group relative overflow-hidden rounded-2xl border bg-slate-950/88 p-2 text-left shadow-2xl transition ${
        arena ? 'w-[clamp(8rem,10vw,10.8rem)]' : 'w-[clamp(5.4rem,8.2vw,8.9rem)]'
      } ${rarity.border} ${selected ? 'scale-[1.02] border-[#f5c518] shadow-ember' : rarity.shadow} ${dimmed ? 'opacity-70 grayscale' : ''}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-black/35" />
      <div className={`relative h-[58%] overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-900 to-violet-950`}>
        {card.imageUrl ? (
          <img src={card.imageUrl} alt={card.name} className="h-full w-full object-cover object-top transition group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_50%_35%,rgba(124,58,237,0.45),transparent_55%)]">
            <span className="font-display text-5xl font-black text-slate-400">{card.name.charAt(0)}</span>
          </div>
        )}
        <span className={`absolute right-2 top-2 rounded-full border px-2 py-0.5 text-[8px] font-black uppercase ${rarity.pill}`}>
          {card.rarity}
        </span>
      </div>
      <div className="relative mt-2 min-h-[2rem]">
        <h3 className="duel-card-name font-display text-[11px] font-black leading-tight text-white sm:text-sm">{card.name}</h3>
      </div>
      <div className="relative mt-1 grid grid-cols-3 gap-1">
        <Stat icon={Swords} label="ATK" value={card.attack} />
        <Stat icon={Shield} label="DEF" value={card.defense} />
        <Stat icon={Heart} label="HP" value={card.health} />
      </div>
    </button>
  );
}

function MiniCardFace({ card }) {
  return (
    <div className="grid h-full w-full grid-rows-[1fr_auto] gap-1 p-2">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-violet-950">
        {card.imageUrl ? (
          <img src={card.imageUrl} alt={card.name} className="h-full w-full object-cover object-top" />
        ) : (
          <div className="grid h-full place-items-center">
            <span className="font-display text-4xl font-black text-slate-400">{card.name.charAt(0)}</span>
          </div>
        )}
      </div>
      <p className="truncate font-display text-xs font-black text-white">{card.name}</p>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.055] px-1 py-1 text-center">
      <Icon className="mx-auto text-cyan-100/80" size={11} />
      <p className="text-[7px] font-black uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-[11px] font-black text-white">{value}</p>
    </div>
  );
}

function CardTooltip({ card }) {
  return (
    <motion.div
      className="pointer-events-none absolute bottom-[105%] left-1/2 z-[80] w-56 -translate-x-1/2 rounded-2xl border border-[#f5c518]/35 bg-slate-950/92 p-3 text-left opacity-0 shadow-ember backdrop-blur-xl group-hover:opacity-100"
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      whileHover={{ opacity: 1, y: 0, scale: 1 }}
    >
      <p className="font-display text-lg font-black text-[#f5c518]">{card.name}</p>
      <p className="mt-1 text-xs text-slate-300">{getLore(card)}</p>
      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">
        ATK {card.attack} / DEF {card.defense} / HP {card.health}
      </p>
    </motion.div>
  );
}

function EndOverlay({ loading, error, matchResult, reward, rewardLoading, history, onRestart }) {
  const won = matchResult?.winner === 'player';
  const title = loading ? 'Starting Duel' : error || (won ? 'VICTORY' : 'DEFEATED');

  return (
    <motion.div
      className="absolute inset-0 z-50 grid place-items-center bg-black/66 px-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {!loading && !error && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 28 }, (_, index) => (
            <span
              key={index}
              className={won ? 'victory-spark' : 'ash-spark'}
              style={{ left: `${(index * 29) % 100}%`, animationDelay: `${(index % 8) * 0.25}s` }}
            />
          ))}
        </div>
      )}
      <motion.div
        className="lobby-glass relative w-full max-w-2xl rounded-[2rem] p-7 text-center"
        initial={{ opacity: 0, scale: 0.9, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
      >
        <p className={`font-display text-6xl font-black ${won ? 'text-[#f5c518]' : 'text-rose-300'} lobby-title-glow`}>
          {title}
        </p>
        {loading && <p className="mt-3 text-slate-300">Opening the arena...</p>}
        {matchResult && (
          <>
            <p className="mt-3 text-sm font-black uppercase tracking-[0.2em] text-slate-300">
              Final Score {history.at(-1)?.score?.player ?? 0} - {history.at(-1)?.score?.ai ?? 0}
            </p>
            <RewardPanel reward={reward} loading={rewardLoading} />
            <div className="mt-5 grid gap-2">
              {history.map((round) => (
                <div key={round.round} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.045] px-4 py-2 text-sm">
                  <span className="font-black text-slate-400">Round {round.round}</span>
                  <span className="font-display font-black text-white">{round.playerCard.name}</span>
                  <span className="text-[#f5c518]">
                    {round.combat?.player?.score ?? round.playerRating} vs {round.combat?.ai?.score ?? round.aiRating}
                  </span>
                  <span className="font-black uppercase text-cyan-100">
                    {round.roundWinner} {round.pointsAwarded > 1 ? `+${round.pointsAwarded}` : ''}
                  </span>
                </div>
              ))}
              {matchResult.surrendered && <p className="rounded-xl border border-rose-300/20 bg-rose-500/10 px-4 py-2 text-sm font-black text-rose-100">Surrendered</p>}
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={onRestart}
                className="inline-flex items-center gap-2 rounded-full border border-[#f5c518]/35 bg-[#f5c518]/12 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#f5c518] transition hover:shadow-ember"
              >
                <RotateCcw size={16} />
                Play Again
              </button>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-400/10 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-100 transition hover:shadow-frost"
              >
                <Home size={16} />
                Back to Lobby
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function RewardPanel({ reward, loading }) {
  if (loading) {
    return (
      <div className="mt-5 rounded-2xl border border-[#f5c518]/25 bg-[#f5c518]/10 px-4 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#f5c518]">
        Claiming rewards...
      </div>
    );
  }

  if (!reward) {
    return (
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4 text-sm text-slate-300">
        Rewards will appear after the arena reports the result.
      </div>
    );
  }

  return (
    <motion.div
      className="mt-5 rounded-2xl border border-[#f5c518]/25 bg-white/[0.055] p-4 text-left shadow-ember"
      initial={{ opacity: 0, scale: 0.94, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <RewardStat label="XP Gained" value={`+${reward.xpGained}`} />
        <RewardStat label="Coins" value={`+${reward.coinsGained}`} />
        <RewardStat label="Level" value={reward.newLevel} pulse={reward.levelUp} />
      </div>
      {(reward.streakBonus > 0 || reward.dropPity > 0) && (
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
          {reward.streakBonus > 0 && (
            <span className="rounded-full border border-[#f5c518]/30 bg-[#f5c518]/10 px-3 py-1 text-[#f5c518]">
              Streak Bonus +{reward.streakBonus}
            </span>
          )}
          {reward.dropPity > 0 && (
            <span className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-cyan-100">
              Drop Pity {reward.dropPity}/5
            </span>
          )}
        </div>
      )}
      {reward.levelUp && (
        <motion.p
          className="mt-3 rounded-xl border border-[#f5c518]/35 bg-[#f5c518]/12 px-4 py-2 text-center text-xs font-black uppercase tracking-[0.18em] text-[#f5c518] shadow-ember"
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          Level Up
        </motion.p>
      )}
      <BonusRewardList title="Milestone" rewards={reward.levelUnlocks} />
      <BonusRewardList title="Quest Complete" rewards={reward.questRewards} />
      <BonusRewardList title="Achievement" rewards={reward.achievementRewards} />
      {reward.droppedCard && (
        <motion.div
          className="mt-4 flex items-center gap-3 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 p-3"
          initial={{ opacity: 0, scale: 0.82 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        >
          <div className="grid h-16 w-12 place-items-center overflow-hidden rounded-lg border border-[#f5c518]/40 bg-slate-950">
            {reward.droppedCard.imageUrl ? (
              <img src={reward.droppedCard.imageUrl} alt={reward.droppedCard.name} className="h-full w-full object-cover object-top" />
            ) : (
              <span className="font-display text-2xl font-black text-cyan-100">{reward.droppedCard.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100">Card Drop</p>
            <p className="font-display text-lg font-black text-white">{reward.droppedCard.name}</p>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              {reward.droppedCard.duplicate ? `Duplicate refund +${reward.droppedCard.coinRefund ?? 0} coins` : 'New collection card'}
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function BonusRewardList({ title, rewards = [] }) {
  if (!rewards.length) {
    return null;
  }

  return (
    <div className="mt-3 grid gap-2">
      {rewards.map((reward) => (
        <motion.div
          key={`${title}-${reward.id ?? reward.level}`}
          className="rounded-xl border border-[#f5c518]/25 bg-[#f5c518]/8 px-4 py-2 text-xs"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="font-black uppercase tracking-[0.16em] text-[#f5c518]">{title}</span>
          <p className="mt-1 font-bold text-slate-100">
            {reward.title ?? reward.label} {reward.coins ? `(+${reward.coins} coins)` : reward.coinsReward ? `(+${reward.xpReward} XP / +${reward.coinsReward} coins)` : ''}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

function RewardStat({ label, value, pulse = false }) {
  return (
    <motion.div
      className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-center"
      animate={pulse ? { boxShadow: ['0 0 0 rgba(245,197,24,0)', '0 0 24px rgba(245,197,24,0.45)', '0 0 0 rgba(245,197,24,0)'] } : undefined}
      transition={{ duration: 1, repeat: pulse ? Infinity : 0 }}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 font-display text-xl font-black text-[#f5c518]">{value}</p>
    </motion.div>
  );
}

function buildPreferredDeck(ownedCards) {
  const preferred = preferredDeckNames.map((name) => ownedCards.find((card) => card.name === name)).filter(Boolean);
  const fillers = ownedCards.filter((card) => !preferred.some((preferredCard) => preferredCard.id === card.id));
  return [...preferred, ...fillers].slice(0, 5);
}

function playOsc(context, frequency, duration, delay = 0, type = 'sine', gainValue = 0.028) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const start = context.currentTime + delay;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function getRarityStyle(rarity) {
  if (rarity === 'Epic') {
    return {
      border: 'border-[#f5c518]/80',
      shadow: 'shadow-[0_0_28px_rgba(245,197,24,0.34)]',
      pill: 'border-[#f5c518]/45 bg-[#f5c518]/16 text-[#f5c518]',
    };
  }

  if (rarity === 'Rare') {
    return {
      border: 'border-violet-300/70',
      shadow: 'shadow-[0_0_26px_rgba(124,58,237,0.36)]',
      pill: 'border-violet-300/45 bg-violet-400/16 text-violet-100',
    };
  }

  return {
    border: 'border-slate-300/45',
    shadow: 'shadow-[0_0_22px_rgba(148,163,184,0.22)]',
    pill: 'border-slate-300/35 bg-slate-300/12 text-slate-100',
  };
}

function getCardGlow(rarity) {
  if (rarity === 'Epic') {
    return 'drop-shadow(0 0 24px rgba(245,197,24,0.55))';
  }

  if (rarity === 'Rare') {
    return 'drop-shadow(0 0 22px rgba(124,58,237,0.55))';
  }

  return 'drop-shadow(0 0 18px rgba(148,163,184,0.42))';
}

function getWinnerText(winner) {
  if (winner === 'player') {
    return 'YOU WIN';
  }

  if (winner === 'ai') {
    return 'AI WINS';
  }

  if (winner === 'draw') {
    return 'DRAW';
  }

  return 'Choose Card';
}

function getLore(card) {
  const lore = {
    'Flame Tyrant': 'A volcanic dragon ruler whose wings leave burning sigils in the night sky.',
    'Frost Wyrm': 'A glacial wyrm that freezes the battlefield before striking.',
    'Iron Vanguard': 'A steel-hearted frontline fighter who refuses to yield ground.',
    'Shadow Duelist': 'A masked blade master who strikes from the edge of torchlight.',
    'Oathbound Tactician': 'A veteran commander who wins by making every trade unfavorable.',
    'Cave Gnarl': 'A brutal cave-born monster with a bite strong enough to crack armor.',
    'Bloodfang Beast': 'A frenzied predator that hunts by the scent of fear.',
    'Venom Maw': 'A toxic apex predator built to end rounds before defenses matter.',
    'Solar Aegis': 'A sun-crowned guardian whose shield turns judgment into light.',
    'Void Oracle': 'A starless prophet that reads fate in the silence between worlds.',
    'Celestial Bastion': 'A living fortress of divine armor and immovable judgment.',
    'Abyss Walker': 'A silent entity that steps through the deep void between worlds.',
    'Mind Fracture': 'A psychic horror that splinters courage before the first strike.',
    'Rift Mimic': 'A shifting entity that copies the shape of whatever the fight demands.',
    'Bone Reaper': 'A grave-bound executioner whose blade gathers restless souls.',
    'Grave Thorn': 'An undead stalker that roots enemies in cursed burial soil.',
    'Crypt Warden': 'A tireless guardian that keeps fighting long after defeat should come.',
    'Arcane Nox': 'A young spellcaster who threads blue fire through ancient runes.',
    'Storm Sage': 'A weather-bound wizard who calls thunder down like a verdict.',
    'Ember Drake': 'A smaller dragon that moves like falling ash and strikes like a spark.',
    'Astral Archivist': 'A spellkeeper whose long memory turns survival into power.',
    Brucklin: 'An untouchable anomaly whose defense bends reality around every blow.',
    'Nameless Echo': 'A near-mythic shadow of something older than the card game itself.',
  };

  return lore[card.name] ?? `${card.race} card with ${card.ability}.`;
}
