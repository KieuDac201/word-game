"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonButton } from "@/components/ui/neon-button";
import {
  playKeypressClick,
  playMistypeThud,
  playWordComplete,
  playSentenceDrop,
  playGameOver,
  playVictory,
  playGameStart,
  playUIClick,
} from "@/lib/core/audio";
import { session } from "../session";
import { routes } from "../definition";
import {
  getLastLetter,
  checkMoveRules,
  getRandomStarterWord,
  pickBotWord,
  getWordTier,
  getTimerStealSeconds,
} from "../engine";
import { validateWord, loadFullDictionary, getWordDetails } from "../dictionary";
import { P2PManager, type PeerStatus } from "../webrtc";
import { BOT_PROFILES, DEFAULT_CONFIG, MIN_TIMER_FLOOR } from "../config";
import type {
  PlayerId,
  PlayerState,
  ChainWord,
  P2PMessage,
  GameResultPayload,
  WordTier,
} from "../types";
import type { ClashSessionConfig } from "../session";

export default function WordChainPlayScreen() {
  const router = useRouter();

  // Load session config
  const [config] = useState<ClashSessionConfig>(() => {
    return (
      session.loadConfig() || {
        mode: "vs-bot",
        playerName: "Player 1",
        difficulty: DEFAULT_CONFIG.difficulty,
        turnSeconds: DEFAULT_CONFIG.turnSeconds,
        initialHearts: DEFAULT_CONFIG.initialHearts,
        minWordLength: DEFAULT_CONFIG.minWordLength,
      }
    );
  });

  // Pre-generate starter word for solo bot mode
  const [initialStarter] = useState(() => getRandomStarterWord());

  // Network & Lobby State
  const [peerStatus, setPeerStatus] = useState<PeerStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const p2pRef = useRef<P2PManager | null>(null);

  // Match State: vs-bot starts immediately; online matches start when connected
  const [gameStarted, setGameStarted] = useState<boolean>(
    () => config.mode === "vs-bot"
  );
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [opponentLeft, setOpponentLeft] = useState<{
    name: string;
    reason: string;
  } | null>(null);

  const [maxTurnSeconds, setMaxTurnSeconds] = useState<number>(() => config.turnSeconds || 30);
  const [maxHearts, setMaxHearts] = useState<number>(() => config.initialHearts || 3);
  const maxTurnSecondsRef = useRef<number>(config.turnSeconds || 30);

  useEffect(() => {
    maxTurnSecondsRef.current = maxTurnSeconds;
  }, [maxTurnSeconds]);

  const [p1, setP1] = useState<PlayerState>({
    id: "player1",
    name: config.playerName || "Player 1",
    hearts: config.initialHearts || 3,
    wordsCount: 0,
    totalLetters: 0,
    isTurn: true,
  });

  const [p2, setP2] = useState<PlayerState>({
    id: "player2",
    name:
      config.mode === "vs-bot"
        ? BOT_PROFILES[config.difficulty].name
        : "Opponent",
    hearts: config.initialHearts || 3,
    wordsCount: 0,
    totalLetters: 0,
    isTurn: false,
    isBot: config.mode === "vs-bot",
  });

  const [currentTurn, setCurrentTurn] = useState<PlayerId>("player1");
  const [requiredLetter, setRequiredLetter] = useState<string>(() =>
    config.mode === "vs-bot"
      ? getLastLetter(initialStarter).toUpperCase()
      : "C"
  );
  const [timeLeft, setTimeLeft] = useState<number>(config.turnSeconds || 30);
  const [chain, setChain] = useState<ChainWord[]>(() => {
    if (config.mode === "vs-bot") {
      return [
        {
          id: "starter",
          word: initialStarter,
          playedBy: "player2",
          playedByName: "Arena Master",
          timestamp: 0,
          definition: "Starter word for the battle",
        },
      ];
    }
    return [];
  });
  const [usedWords, setUsedWords] = useState<Set<string>>(() => {
    if (config.mode === "vs-bot") {
      return new Set([initialStarter]);
    }
    return new Set();
  });

  // Input State
  const [inputWord, setInputWord] = useState<string>("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<boolean>(false);

  // Time Steal & Feedback Animation State
  const [stealNotification, setStealNotification] = useState<{
    id: number;
    amount: number;
    tier: WordTier;
    targetPlayer: PlayerId;
  } | null>(null);
  const [timerFlashed, setTimerFlashed] = useState<boolean>(false);

  const matchStartTimestamp = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Background dictionary loading & audio start
  useEffect(() => {
    loadFullDictionary();
    if (config.mode === "vs-bot") {
      matchStartTimestamp.current = Date.now();
      playGameStart();
    }
  }, [config.mode]);

  const triggerShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 500);
  };

  const chainRef = useRef<ChainWord[]>(chain);
  const p1Ref = useRef<PlayerState>(p1);
  const p2Ref = useRef<PlayerState>(p2);
  const applyWordRef = useRef<(word: string, by: PlayerId, byName: string) => Promise<void>>(() => Promise.resolve());
  const handleTurnTimeoutRef = useRef<() => void>(() => {});
  const matchInitiatedRef = useRef(false);

  useEffect(() => {
    chainRef.current = chain;
  }, [chain]);

  useEffect(() => {
    p1Ref.current = p1;
  }, [p1]);

  useEffect(() => {
    p2Ref.current = p2;
  }, [p2]);

  // Handle Player Leaving the Match
  const handleLeaveMatch = useCallback(() => {
    playUIClick();
    if (config.mode !== "vs-bot" && p2pRef.current) {
      const myId: PlayerId =
        config.mode === "online-guest" ? "player2" : "player1";
      const myName = myId === "player1" ? p1Ref.current.name : p2Ref.current.name;
      p2pRef.current.send({
        type: "PLAYER_LEFT",
        sender: myId,
        payload: { playerName: myName, reason: "left the match" },
        timestamp: Date.now(),
      });
    }
    router.push(routes.setup);
  }, [config.mode, router]);

  // Broadcast beforeunload if tab is closed/refreshed
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (config.mode !== "vs-bot" && p2pRef.current) {
        const myId: PlayerId =
          config.mode === "online-guest" ? "player2" : "player1";
        const myName =
          myId === "player1" ? p1Ref.current.name : p2Ref.current.name;
        p2pRef.current.send({
          type: "PLAYER_LEFT",
          sender: myId,
          payload: { playerName: myName, reason: "left the match" },
          timestamp: Date.now(),
        });
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [config.mode]);

  // End Game handler
  const endGame = useCallback(
    (winnerId: PlayerId | "draw") => {
      setIsGameOver(true);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      const isWin =
        (config.mode === "online-guest" && winnerId === "player2") ||
        (config.mode !== "online-guest" && winnerId === "player1");

      if (isWin) {
        playVictory();
      } else {
        playGameOver();
      }

      const currentChain = chainRef.current;
      const currentP1 = p1Ref.current;
      const currentP2 = p2Ref.current;

      const longestP1 = currentChain
        .filter((c) => c.playedBy === "player1")
        .reduce((max, c) => (c.word.length > max.length ? c.word : max), "");
      const longestP2 = currentChain
        .filter((c) => c.playedBy === "player2")
        .reduce((max, c) => (c.word.length > max.length ? c.word : max), "");

      const startTime = matchStartTimestamp.current || Date.now();
      const resultPayload: GameResultPayload = {
        winner: winnerId,
        winnerName: winnerId === "player1" ? currentP1.name : currentP2.name,
        loserName: winnerId === "player1" ? currentP2.name : currentP1.name,
        chain: currentChain,
        p1Stats: {
          name: currentP1.name,
          words: currentP1.wordsCount,
          heartsRemaining: currentP1.hearts,
          longestWord: longestP1 || "N/A",
        },
        p2Stats: {
          name: currentP2.name,
          words: currentP2.wordsCount,
          heartsRemaining: currentP2.hearts,
          longestWord: longestP2 || "N/A",
        },
        matchDurationSeconds: Math.floor((Date.now() - startTime) / 1000),
      };

      session.saveResult(resultPayload);
      setTimeout(() => {
        router.push(routes.result);
      }, 1500);
    },
    [config.mode, router]
  );

  const currentTurnRef = useRef<PlayerId>(currentTurn);
  const isGameOverRef = useRef<boolean>(isGameOver);
  const isProcessingTimeout = useRef<boolean>(false);

  useEffect(() => {
    currentTurnRef.current = currentTurn;
  }, [currentTurn]);

  useEffect(() => {
    isGameOverRef.current = isGameOver;
  }, [isGameOver]);

  // Turn Timeout logic (deducts exactly 1 heart)
  const handleTurnTimeout = useCallback(() => {
    if (isProcessingTimeout.current || isGameOverRef.current) return;
    isProcessingTimeout.current = true;

    playSentenceDrop();
    triggerShake();

    const activeTurn = currentTurnRef.current;
    if (activeTurn === "player1") {
      setP1((prev) => {
        const nextHearts = prev.hearts - 1;
        if (nextHearts <= 0) {
          endGame("player2");
        }
        return { ...prev, hearts: Math.max(0, nextHearts) };
      });
    } else {
      setP2((prev) => {
        const nextHearts = prev.hearts - 1;
        if (nextHearts <= 0) {
          endGame("player1");
        }
        return { ...prev, hearts: Math.max(0, nextHearts) };
      });
    }

    // Switch turn and reset timer
    const nextTurn = activeTurn === "player1" ? "player2" : "player1";
    setCurrentTurn(nextTurn);
    setTimeLeft(maxTurnSecondsRef.current);

    setTimeout(() => {
      isProcessingTimeout.current = false;
    }, 400);
  }, [endGame]);

  // Timer loop
  useEffect(() => {
    if (!gameStarted || isGameOver) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimeout(() => {
            handleTurnTimeout();
          }, 0);
          return maxTurnSecondsRef.current;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [gameStarted, isGameOver, handleTurnTimeout]);

  // Apply a word to the chain
  const applyWord = useCallback(
    async (word: string, by: PlayerId, byName: string) => {
      const cleanWord = word.trim().toLowerCase();
      const lastChar = getLastLetter(cleanWord).toUpperCase();
      const tier = getWordTier(cleanWord);
      const stealAmount = getTimerStealSeconds(cleanWord);

      playWordComplete();

      // Add to chain
      const details = await getWordDetails(cleanWord);
      const newChainItem: ChainWord = {
        id: `${Date.now()}-${Math.random()}`,
        word: cleanWord,
        playedBy: by,
        playedByName: byName,
        timestamp: Date.now(),
        definition: details.definition,
        translationVi: details.translationVi,
        tier,
        timerSteal: stealAmount,
      };

      setChain((prev) => [newChainItem, ...prev]);
      setUsedWords((prev) => new Set(prev).add(cleanWord));
      setRequiredLetter(lastChar);

      // Switch turn
      const nextTurn = by === "player1" ? "player2" : "player1";
      setCurrentTurn(nextTurn);

      // Calculate opponent starting timer with steal deduction (floored at MIN_TIMER_FLOOR)
      const nextStartingSeconds = Math.max(
        MIN_TIMER_FLOOR,
        maxTurnSecondsRef.current - stealAmount
      );
      setTimeLeft(nextStartingSeconds);

      // Trigger steal notification and timer flash if any time was stolen
      if (stealAmount > 0) {
        setStealNotification({
          id: Date.now(),
          amount: stealAmount,
          tier,
          targetPlayer: nextTurn,
        });
        setTimerFlashed(true);
        setTimeout(() => setTimerFlashed(false), 800);
        setTimeout(() => setStealNotification(null), 1400);
      }

      if (by === "player1") {
        setP1((prev) => ({
          ...prev,
          wordsCount: prev.wordsCount + 1,
          totalLetters: prev.totalLetters + cleanWord.length,
        }));
      } else {
        setP2((prev) => ({
          ...prev,
          wordsCount: prev.wordsCount + 1,
          totalLetters: prev.totalLetters + cleanWord.length,
        }));
      }
    },
    []
  );

  // Bot Turn Simulation
  useEffect(() => {
    if (!gameStarted || isGameOver || config.mode !== "vs-bot") return;

    if (currentTurn === "player2") {
      const profile = BOT_PROFILES[config.difficulty];
      const thinkTime =
        Math.random() * (profile.maxThinkMs - profile.minThinkMs) +
        profile.minThinkMs;

      const botTimeout = setTimeout(async () => {
        // Check if bot fails randomly
        const willFail = Math.random() < profile.failProbability;
        const botWord = willFail
          ? null
          : pickBotWord(requiredLetter, usedWords, config.difficulty);

        if (botWord) {
          applyWord(botWord, "player2", profile.name);
        } else {
          // Bot gets stuck and times out
          handleTurnTimeout();
        }
      }, thinkTime);

      return () => clearTimeout(botTimeout);
    }
  }, [
    currentTurn,
    gameStarted,
    isGameOver,
    config.mode,
    config.difficulty,
    requiredLetter,
    usedWords,
    applyWord,
    handleTurnTimeout,
  ]);

  // Handle Player Word Submission
  const handleSubmitWord = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!gameStarted || isGameOver || isValidating) return;

    // In online mode, ensure it's your turn
    const isMyTurn =
      config.mode === "online-guest"
        ? currentTurn === "player2"
        : currentTurn === "player1";

    if (!isMyTurn) return;

    const trimmed = inputWord.trim().toLowerCase();
    if (!trimmed) return;

    // Check rules: length, letter, duplicate
    const ruleCheck = checkMoveRules(
      trimmed,
      requiredLetter,
      usedWords,
      config.minWordLength || 3
    );

    if (!ruleCheck.valid) {
      playMistypeThud();
      setInputError(ruleCheck.reason || "Invalid move");
      return;
    }

    setIsValidating(true);
    setInputError(null);

    const isEnglish = await validateWord(trimmed);
    setIsValidating(false);

    if (!isEnglish) {
      playMistypeThud();
      setInputError(`"${trimmed.toUpperCase()}" is not a recognized English word.`);
      return;
    }

    // Valid word!
    setInputWord("");
    const myId: PlayerId = config.mode === "online-guest" ? "player2" : "player1";
    const myName = myId === "player1" ? p1.name : p2.name;

    applyWord(trimmed, myId, myName);

    // Send to peer if online
    if (p2pRef.current && (config.mode === "online-host" || config.mode === "online-guest")) {
      p2pRef.current.send({
        type: "PLAY_WORD",
        sender: myId,
        payload: { word: trimmed, playerName: myName },
        timestamp: Date.now(),
      });
    }
  };

  useEffect(() => {
    applyWordRef.current = applyWord;
  }, [applyWord]);

  useEffect(() => {
    handleTurnTimeoutRef.current = handleTurnTimeout;
  }, [handleTurnTimeout]);

  // Initialize Match (WebRTC Online Setup) - Run ONCE per room session
  useEffect(() => {
    if (config.mode === "vs-bot") {
      return;
    }

    matchInitiatedRef.current = false;

    // P2P Online Setup
    const p2p = new P2PManager(
      // onMessage
      (msg: P2PMessage) => {
        if (msg.type === "START_MATCH") {
          const starterWord = String(msg.payload?.starterWord || "clash");
          const hostName = String(msg.payload?.hostName || "Host");
          const hostTurnSeconds = Number(msg.payload?.turnSeconds) || 30;
          const hostInitialHearts = Number(msg.payload?.initialHearts) || 3;

          setMaxTurnSeconds(hostTurnSeconds);
          setMaxHearts(hostInitialHearts);
          maxTurnSecondsRef.current = hostTurnSeconds;
          setTimeLeft(hostTurnSeconds);
          setP1((prev) => ({ ...prev, name: hostName, hearts: hostInitialHearts }));
          setP2((prev) => ({ ...prev, hearts: hostInitialHearts }));

          const firstLetter = getLastLetter(starterWord).toUpperCase();
          setRequiredLetter(firstLetter);
          setUsedWords(new Set([starterWord]));
          setChain([
            {
              id: "starter",
              word: starterWord,
              playedBy: "player1",
              playedByName: hostName,
              timestamp: Date.now(),
              definition: "Starter word for the match",
            },
          ]);
          matchStartTimestamp.current = Date.now();
          setGameStarted(true);
          playGameStart();
        } else if (msg.type === "PLAY_WORD") {
          const word = String(msg.payload?.word || "");
          const playerName = String(msg.payload?.playerName || "Opponent");
          if (word) {
            applyWordRef.current(word, msg.sender, playerName);
          }
        } else if (msg.type === "TURN_TIMEOUT") {
          handleTurnTimeoutRef.current();
        } else if (msg.type === "PLAYER_LEFT") {
          const leaverName = String(msg.payload?.playerName || "Opponent");
          setIsGameOver(true);
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          playGameOver();
          setOpponentLeft({
            name: leaverName,
            reason: "has left the arena",
          });
        }
      },
      // onStatusChange
      (status, error) => {
        setPeerStatus(status);
        if (error) setStatusMessage(error);

        if (
          status === "connected" &&
          config.mode === "online-host" &&
          !matchInitiatedRef.current
        ) {
          matchInitiatedRef.current = true;
          // Host initiates match start ONCE
          const starter = getRandomStarterWord();
          const firstLetter = getLastLetter(starter).toUpperCase();
          setRequiredLetter(firstLetter);
          setUsedWords(new Set([starter]));
          setChain([
            {
              id: "starter",
              word: starter,
              playedBy: "player1",
              playedByName: p1Ref.current.name,
              timestamp: Date.now(),
              definition: "Starter word for the match",
            },
          ]);

          p2p.send({
            type: "START_MATCH",
            sender: "player1",
            payload: {
              starterWord: starter,
              hostName: p1Ref.current.name,
              turnSeconds: maxTurnSecondsRef.current,
              initialHearts: maxHearts,
            },
            timestamp: Date.now(),
          });

          matchStartTimestamp.current = Date.now();
          setGameStarted(true);
          playGameStart();
        } else if (status === "disconnected" && !isGameOverRef.current) {
          const opponentName =
            config.mode === "online-guest"
              ? p1Ref.current.name
              : p2Ref.current.name;
          setIsGameOver(true);
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          playGameOver();
          setOpponentLeft((prev) =>
            prev || {
              name: opponentName,
              reason: "disconnected from the battle",
            }
          );
        }
      }
    );

    p2pRef.current = p2p;

    if (config.mode === "online-host" && config.roomCode) {
      p2p.createRoom(config.roomCode);
    } else if (config.mode === "online-guest" && config.roomCode) {
      p2p.joinRoom(config.roomCode);
    }

    return () => {
      p2p.destroy();
    };
  }, [config.mode, config.roomCode, maxHearts]);

  // Keep input focused
  useEffect(() => {
    if (gameStarted && !isGameOver) {
      const isMyTurn =
        config.mode === "online-guest"
          ? currentTurn === "player2"
          : currentTurn === "player1";
      if (isMyTurn) {
        inputRef.current?.focus();
      }
    }
  }, [currentTurn, gameStarted, isGameOver, config.mode]);

  const isMyTurn =
    config.mode === "online-guest"
      ? currentTurn === "player2"
      : currentTurn === "player1";

  return (
    <div
      className={`min-h-[100dvh] h-[100dvh] bg-[var(--surface-0)] text-white flex flex-col items-center justify-between relative overflow-hidden transition-transform duration-100 touch-manipulation ${
        screenShake ? "animate-shake" : ""
      }`}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[var(--neon-yellow)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[10%] w-[500px] h-[300px] bg-[var(--neon-pink)]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-4xl px-3 py-2.5 sm:px-6 sm:py-4 flex items-center justify-between z-10 border-b border-white/5 shrink-0">
        <button
          type="button"
          onClick={handleLeaveMatch}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-white/60 hover:text-[var(--neon-yellow)] transition-colors py-1 cursor-pointer"
        >
          <span>✕</span> <span className="hidden sm:inline">Leave Match</span>
        </button>

        {config.roomCode && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono">
            <span className="text-white/40">ROOM:</span>
            <span className="text-[var(--neon-yellow)] font-bold tracking-wider">
              {config.roomCode}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs font-mono text-white/50">
          <span
            className={`w-2 h-2 rounded-full inline-block ${
              gameStarted
                ? "bg-[var(--neon-green)] animate-pulse"
                : "bg-yellow-400 animate-ping"
            }`}
          />
          <span className="text-[11px] sm:text-xs">{gameStarted ? "Live Battle" : "Connecting..."}</span>
        </div>
      </header>

      {/* Waiting Lobby Overlay (Multiplayer Only) */}
      {!gameStarted && config.mode !== "vs-bot" && (
        <div className="w-full max-w-md my-auto p-4 sm:p-6 z-20">
          <GlassCard className="p-6 sm:p-8 text-center space-y-4 sm:space-y-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-[var(--neon-yellow)]/10 border border-[var(--neon-yellow)]/30 flex items-center justify-center text-2xl sm:text-3xl animate-bounce">
              ⚔️
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-black">
                {config.mode === "online-host"
                  ? "Waiting for Opponent..."
                  : "Joining Battle Room..."}
              </h2>
              <p className="text-xs text-white/60">
                {config.mode === "online-host"
                  ? `Share Room Code "${config.roomCode}" or your invite link with your friend to connect.`
                  : `Connecting to host with code "${config.roomCode}"...`}
              </p>
            </div>

            {statusMessage && (
              <div className="text-xs text-red-400 font-mono bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                {statusMessage}
              </div>
            )}

            <div className="pt-2">
              <div className="inline-block px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 font-mono text-xs sm:text-sm tracking-widest text-[var(--neon-yellow)]">
                STATUS: {peerStatus.toUpperCase()}
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Main Duel Arena */}
      {gameStarted && (
        <main className="w-full max-w-4xl px-3 sm:px-6 py-2 sm:py-4 flex flex-col flex-1 z-10 space-y-2.5 sm:space-y-4 overflow-hidden min-h-0">
          {/* Players Scoreboard & Health */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4 shrink-0">
            {/* Player 1 Card */}
            <GlassCard
              className={`p-2.5 sm:p-4 transition-all duration-300 ${
                currentTurn === "player1"
                  ? "border-[var(--neon-yellow)] shadow-[0_0_25px_rgba(255,225,77,0.25)] bg-[var(--neon-yellow)]/5"
                  : "opacity-75"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <span className="text-lg sm:text-2xl shrink-0">👤</span>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-white truncate">
                      {p1.name} {config.mode !== "online-guest" && "(You)"}
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-mono text-white/50 truncate">
                      {p1.wordsCount}w • {p1.totalLetters}pts
                    </div>
                  </div>
                </div>

                {/* Hearts */}
                <div className="flex gap-0.5 sm:gap-1 text-sm sm:text-lg shrink-0">
                  {Array.from({ length: maxHearts }).map((_, i) => (
                    <span
                      key={i}
                      className={
                        i < p1.hearts
                          ? "opacity-100 scale-100 transition-transform"
                          : "opacity-25 grayscale scale-90"
                      }
                    >
                      ❤️
                    </span>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Player 2 Card */}
            <GlassCard
              className={`p-2.5 sm:p-4 transition-all duration-300 ${
                currentTurn === "player2"
                  ? "border-[var(--neon-yellow)] shadow-[0_0_25px_rgba(255,225,77,0.25)] bg-[var(--neon-yellow)]/5"
                  : "opacity-75"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <span className="text-lg sm:text-2xl shrink-0">
                    {config.mode === "vs-bot"
                      ? BOT_PROFILES[config.difficulty].avatar
                      : "🤺"}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-white truncate">
                      {p2.name} {config.mode === "online-guest" && "(You)"}
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-mono text-white/50 truncate">
                      {p2.wordsCount}w • {p2.totalLetters}pts
                    </div>
                  </div>
                </div>

                {/* Hearts */}
                <div className="flex gap-0.5 sm:gap-1 text-sm sm:text-lg shrink-0">
                  {Array.from({ length: maxHearts }).map((_, i) => (
                    <span
                      key={i}
                      className={
                        i < p2.hearts
                          ? "opacity-100 scale-100 transition-transform"
                          : "opacity-25 grayscale scale-90"
                      }
                    >
                      ❤️
                    </span>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Center Stage: Timer & Target Letter HUD */}
          <div className="flex items-center justify-center py-1 sm:py-2 shrink-0">
            <div className="flex items-center gap-4 sm:gap-8">
              {/* Turn Indicator */}
              <div className="text-center">
                <div className="text-[9px] sm:text-[11px] font-mono text-white/40 uppercase tracking-widest">
                  Turn
                </div>
                <div className="text-xs sm:text-base font-bold mt-0.5 whitespace-nowrap">
                  {isMyTurn ? (
                    <span className="text-[var(--neon-yellow)] animate-pulse">
                      ⚡ YOUR TURN
                    </span>
                  ) : (
                    <span className="text-white/60">OPPONENT</span>
                  )}
                </div>
              </div>

              {/* Big Circular Countdown Clock with Linear Progress Arc & Time Steal Indicator */}
              <div className="relative flex items-center justify-center shrink-0">
                {/* Floating Time Steal Popup Animation */}
                {stealNotification && (
                  <div
                    key={stealNotification.id}
                    className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-none z-30 animate-timer-steal whitespace-nowrap"
                  >
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black border shadow-lg flex items-center gap-1 ${
                        stealNotification.tier === "power"
                          ? "bg-red-600 text-white border-red-300 shadow-[0_0_18px_rgba(239,68,68,0.9)]"
                          : "bg-yellow-400 text-black border-yellow-200 shadow-[0_0_18px_rgba(250,204,21,0.9)]"
                      }`}
                    >
                      {stealNotification.tier === "power" ? "🔥" : "⚡"} -{stealNotification.amount}s TIME STEAL!
                    </span>
                  </div>
                )}

                <div
                  className={`relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center transition-all ${
                    timerFlashed ? "animate-timer-flash" : ""
                  }`}
                >
                  <svg
                    className="absolute inset-0 w-full h-full -rotate-90"
                    viewBox="0 0 64 64"
                  >
                    {/* Background Track Circle */}
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth="3.5"
                      fill="transparent"
                    />
                    {/* Linear Depletion Progress Circle */}
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      stroke={
                        timerFlashed || timeLeft <= 5
                          ? "#ef4444"
                          : timeLeft <= 10
                          ? "#facc15"
                          : "var(--neon-cyan)"
                      }
                      strokeWidth="3.5"
                      strokeDasharray={2 * Math.PI * 26}
                      strokeDashoffset={
                        -(2 * Math.PI * 26) *
                        (1 - Math.max(0, Math.min(1, timeLeft / maxTurnSeconds)))
                      }
                      strokeLinecap="round"
                      fill={timerFlashed || timeLeft <= 5 ? "rgba(239, 68, 68, 0.16)" : "transparent"}
                      style={{
                        transition:
                          "stroke-dashoffset 1s linear, stroke 0.3s ease, fill 0.3s ease",
                      }}
                      className={
                        timerFlashed || timeLeft <= 5
                          ? "drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]"
                          : timeLeft <= 10
                          ? "drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]"
                          : "drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]"
                      }
                    />
                  </svg>

                  {/* Text Countdown Value */}
                  <div
                    className={`relative font-mono font-black text-sm sm:text-base tracking-tight transition-colors ${
                      timerFlashed || timeLeft <= 5
                        ? "text-red-400 animate-pulse"
                        : timeLeft <= 10
                        ? "text-yellow-300"
                        : "text-white"
                    }`}
                  >
                    {timeLeft}s
                  </div>
                </div>
              </div>

              {/* Target Starting Letter */}
              <div className="text-center">
                <div className="text-[9px] sm:text-[11px] font-mono text-white/40 uppercase tracking-widest">
                  Starts With
                </div>
                <div className="text-2xl sm:text-3xl font-black text-[var(--neon-yellow)] mt-0.5 drop-shadow-[0_0_15px_rgba(255,225,77,0.5)]">
                  {requiredLetter}
                </div>
              </div>
            </div>
          </div>

          {/* Submission Input Box */}
          <GlassCard className="p-2.5 sm:p-4 space-y-2 shrink-0">
            <form onSubmit={handleSubmitWord} className="flex gap-2 sm:gap-3">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputWord}
                  disabled={!isMyTurn || isValidating}
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="off"
                  spellCheck={false}
                  enterKeyHint="send"
                  inputMode="text"
                  onChange={(e) => {
                    playKeypressClick();
                    setInputWord(e.target.value);
                    setInputError(null);
                  }}
                  placeholder={
                    isMyTurn
                      ? `Type word starting with "${requiredLetter}"...`
                      : "Opponent's turn..."
                  }
                  className={`w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-xl text-base sm:text-lg font-mono tracking-wider uppercase outline-none transition-all ${
                    isMyTurn
                      ? "bg-black/60 border-2 border-[var(--neon-yellow)] text-white focus:shadow-[0_0_20px_rgba(255,225,77,0.25)]"
                      : "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
                  }`}
                />
                {isValidating && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs font-mono text-[var(--neon-yellow)] animate-pulse">
                    Validating...
                  </div>
                )}
              </div>

              <NeonButton
                type="submit"
                disabled={!isMyTurn || isValidating || !inputWord.trim()}
                className="px-4 py-2.5 sm:px-6 sm:py-3.5 text-sm sm:text-base font-bold whitespace-nowrap active:scale-95 touch-manipulation"
              >
                ⚔️ Strike
              </NeonButton>
            </form>

            {/* Error Message Tooltip */}
            {inputError && (
              <div className="text-[11px] sm:text-xs font-mono text-red-400 bg-red-500/10 px-2.5 py-1.5 rounded-lg border border-red-500/20 flex items-center gap-1.5">
                <span>⚠️</span>
                <span>{inputError}</span>
              </div>
            )}
          </GlassCard>

          {/* Word Chain Timeline */}
          <div className="flex-1 min-h-0 flex flex-col space-y-1.5 overflow-hidden">
            <div className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-white/40 flex items-center justify-between shrink-0">
              <span>Word Chain Stream ({chain.length})</span>
              <span>Latest at Top</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {chain.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl border backdrop-blur-md transition-all flex items-center justify-between gap-2 ${
                    idx === 0
                      ? "bg-white/10 border-[var(--neon-yellow)]/50 shadow-[0_0_15px_rgba(255,225,77,0.1)]"
                      : "bg-white/5 border-white/5 opacity-80"
                  }`}
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg font-black tracking-wider uppercase font-mono">
                        <span className="text-[var(--neon-yellow)]">
                          {item.word[0]}
                        </span>
                        {item.word.slice(1, -1)}
                        <span className="text-[var(--neon-cyan)] font-extrabold underline">
                          {item.word.slice(-1)}
                        </span>
                      </span>

                      <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/10 text-white/70 truncate max-w-[90px] sm:max-w-none">
                        {item.playedByName}
                      </span>
                    </div>

                    {item.translationVi ? (
                      <div className="text-[11px] sm:text-xs text-[var(--neon-green)] line-clamp-1 flex items-center gap-1 font-medium">
                        <span className="text-[9px] opacity-70 font-mono">VN:</span>
                        <span>{item.translationVi}</span>
                      </div>
                    ) : item.definition ? (
                      <div className="text-[11px] sm:text-xs text-white/60 line-clamp-1 italic">
                        {item.definition}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.tier === "power" && (
                      <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-mono font-bold flex items-center gap-0.5">
                        🔥 -5s
                      </span>
                    )}
                    {item.tier === "strong" && (
                      <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[10px] font-mono font-bold flex items-center gap-0.5">
                        ⚡ -3s
                      </span>
                    )}
                    <span className="text-[10px] sm:text-xs font-mono text-white/30">
                      {item.word.length}L
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* Opponent Left Notification Modal Overlay */}
      {opponentLeft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <GlassCard className="w-full max-w-md p-6 sm:p-8 text-center space-y-4 sm:space-y-6 border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-3xl animate-bounce">
              🚪
            </div>

            <div className="space-y-1.5">
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-mono text-[11px] uppercase tracking-wider">
                Match Interrupted
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Opponent Left the Match
              </h2>
              <p className="text-xs sm:text-sm text-white/70">
                <span className="text-[var(--neon-yellow)] font-bold">{opponentLeft.name}</span> {opponentLeft.reason}.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white/60 flex items-center justify-center gap-2">
              <span className="text-lg">🏆</span>
              <span>You are awarded the match victory!</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <NeonButton
                onClick={() => router.push(routes.setup)}
                className="w-full sm:flex-1 py-3 text-sm font-bold"
              >
                ⚔️ Find New Match
              </NeonButton>
              <Link
                href="/"
                className="w-full sm:flex-1 py-3 font-bold rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-center transition-all flex items-center justify-center text-sm"
              >
                Arcade Hub
              </Link>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
