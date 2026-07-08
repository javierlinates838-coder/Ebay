"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

export type SpeechStatus = "idle" | "playing" | "paused";

const emptySubscribe = () => () => {};

export function useSpeechSupported(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => typeof window !== "undefined" && "speechSynthesis" in window,
    () => false
  );
}

/**
 * Voice list preferring the requested language (BCP-47 prefix match, default
 * English), loaded when the browser makes them available.
 */
export function useVoices(lang = "en"): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => {
      const all = window.speechSynthesis.getVoices();
      const matching = all.filter((v) =>
        v.lang.toLowerCase().startsWith(lang.toLowerCase())
      );
      setVoices(matching.length > 0 ? matching : all);
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, [lang]);

  return voices;
}

export interface SpeechController {
  supported: boolean;
  status: SpeechStatus;
  /** Index into the last `play()` queue, or null when idle. */
  currentIndex: number | null;
  voices: SpeechSynthesisVoice[];
  voiceURI: string | null;
  setVoiceURI: (uri: string) => void;
  rate: number;
  setRate: (rate: number) => void;
  play: (texts: string[], startIndex?: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  skip: (delta: number) => void;
}

/**
 * Sequential text-to-speech over a queue of texts (one utterance per verse),
 * built on the browser SpeechSynthesis API. Voice and rate changes restart
 * the current item so they take effect immediately. Pass the content's
 * BCP-47 language so the browser picks a matching voice.
 */
export function useSpeech(lang = "en"): SpeechController {
  const supported = useSpeechSupported();
  const voices = useVoices(lang);
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [voiceURI, setVoiceURIState] = useState<string | null>(null);
  const [rate, setRateState] = useState(1);

  const queueRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  // Only the utterance holding the latest token may drive state; stale
  // utterances (replaced by a restart, stop, or another player) are ignored.
  const tokenRef = useRef(0);
  const voiceURIRef = useRef<string | null>(null);
  const rateRef = useRef(1);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const langRef = useRef(lang);
  // Utterance callbacks fire between renders; they re-enter through this ref.
  const speakAtRef = useRef<(index: number) => void>(() => {});

  useEffect(() => {
    voicesRef.current = voices;
    langRef.current = lang;
  }, [voices, lang]);

  const speakAt = useCallback((index: number) => {
    const synth = window.speechSynthesis;
    const token = ++tokenRef.current;
    synth.cancel();
    if (index >= queueRef.current.length) {
      setStatus("idle");
      setCurrentIndex(null);
      return;
    }
    indexRef.current = index;
    setCurrentIndex(index);
    setStatus("playing");

    const utterance = new SpeechSynthesisUtterance(queueRef.current[index]);
    utterance.rate = rateRef.current;
    utterance.lang = langRef.current;
    const voice = voicesRef.current.find((v) => v.voiceURI === voiceURIRef.current);
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
      if (tokenRef.current !== token) return;
      speakAtRef.current(index + 1);
    };
    utterance.onerror = () => {
      // While still the active utterance, any error (including an external
      // cancel from another player) ends this playback session.
      if (tokenRef.current !== token) return;
      setStatus("idle");
      setCurrentIndex(null);
    };
    synth.speak(utterance);
  }, []);

  useEffect(() => {
    speakAtRef.current = speakAt;
  }, [speakAt]);

  const play = useCallback(
    (texts: string[], startIndex = 0) => {
      if (!supported) return;
      queueRef.current = texts;
      speakAt(startIndex);
    },
    [supported, speakAt]
  );

  const stop = useCallback(() => {
    if (!supported) return;
    tokenRef.current++;
    window.speechSynthesis.cancel();
    setStatus("idle");
    setCurrentIndex(null);
  }, [supported]);

  const pause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setStatus("paused");
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setStatus("playing");
  }, [supported]);

  const skip = useCallback(
    (delta: number) => {
      if (!supported || queueRef.current.length === 0) return;
      const next = Math.min(
        Math.max(indexRef.current + delta, 0),
        queueRef.current.length - 1
      );
      speakAt(next);
    },
    [supported, speakAt]
  );

  const setVoiceURI = useCallback(
    (uri: string) => {
      voiceURIRef.current = uri;
      setVoiceURIState(uri);
      if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
        speakAt(indexRef.current);
      }
    },
    [speakAt]
  );

  const setRate = useCallback(
    (value: number) => {
      rateRef.current = value;
      setRateState(value);
      if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
        speakAt(indexRef.current);
      }
    },
    [speakAt]
  );

  // Stop speaking when the component using the controller unmounts.
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    supported,
    status,
    currentIndex,
    voices,
    voiceURI,
    setVoiceURI,
    rate,
    setRate,
    play,
    pause,
    resume,
    stop,
    skip,
  };
}
