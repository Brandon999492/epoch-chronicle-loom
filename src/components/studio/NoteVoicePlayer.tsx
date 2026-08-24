import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Play, Pause, Square, X, Volume2, VolumeX, ChevronDown, AudioLines, Minus,
} from "lucide-react";
import type { StructuredNote } from "@/components/studio/StructuredNoteView";
import {
  buildNoteSpeech, pickStorytellerVoice, rankVoice, voiceLabel,
  type SpeechChunk,
} from "@/components/studio/noteSpeech";

type PlayState = "idle" | "speaking" | "paused";

interface Props {
  note: StructuredNote;
  onClose: () => void;
}

const RATE_KEY = "studio-tts-rate";
const VOICE_KEY = "studio-tts-voice";
const STORY_KEY = "studio-tts-storyteller";
const VOL_KEY = "studio-tts-volume";

export function NoteVoicePlayer({ note, onClose }: Props) {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string>(() => localStorage.getItem(VOICE_KEY) || "");
  const [storyteller, setStoryteller] = useState<boolean>(() => localStorage.getItem(STORY_KEY) !== "0");
  const [rate, setRate] = useState<number>(() => Number(localStorage.getItem(RATE_KEY)) || 0.92);
  const [volume, setVolume] = useState<number>(() => {
    const v = Number(localStorage.getItem(VOL_KEY));
    return Number.isFinite(v) && v > 0 ? Math.min(1, v) : 1;
  });
  const [state, setState] = useState<PlayState>("idle");
  const [index, setIndex] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const [voiceMenu, setVoiceMenu] = useState(false);

  // Session guard prevents stale utterances from a cancelled run resuming playback.
  const sessionRef = useRef(0);
  const idxRef = useRef(0);
  const chunksRef = useRef<SpeechChunk[]>([]);
  const timerRef = useRef<number | null>(null);
  const stateRef = useRef<PlayState>("idle");
  stateRef.current = state;

  const chunks = useMemo(() => buildNoteSpeech(note, storyteller), [note, storyteller]);
  chunksRef.current = chunks;

  /* ── voices ── */
  useEffect(() => {
    if (!supported) return;
    const load = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length) setVoices(list);
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, [supported]);

  const sortedVoices = useMemo(
    () => [...voices].sort((a, b) => rankVoice(b) - rankVoice(a)),
    [voices],
  );

  const selectedVoice = useMemo(() => {
    if (voiceURI) {
      const found = voices.find((v) => v.voiceURI === voiceURI);
      if (found) return found;
    }
    return pickStorytellerVoice(voices);
  }, [voices, voiceURI]);

  /* ── engine ── */
  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const speakFrom = useCallback(
    (start: number, session: number) => {
      if (!supported) return;
      const list = chunksRef.current;
      if (start >= list.length) {
        setState("idle");
        setIndex(0);
        idxRef.current = 0;
        return;
      }
      const chunk = list[start];
      const u = new SpeechSynthesisUtterance(chunk.text);
      if (selectedVoice) {
        u.voice = selectedVoice;
        u.lang = selectedVoice.lang;
      }
      const base = storyteller ? rate : rate + 0.05;
      u.rate = Math.max(0.5, Math.min(2, chunk.kind === "heading" ? base - 0.08 : base));
      u.pitch = storyteller ? (chunk.kind === "heading" ? 0.95 : 1.0) : 1;
      u.volume = volume;

      const advance = () => {
        if (session !== sessionRef.current) return;
        const next = start + 1;
        idxRef.current = next;
        setIndex(next);
        const wait = storyteller ? chunk.pauseAfter : Math.round(chunk.pauseAfter * 0.4);
        clearTimer();
        timerRef.current = window.setTimeout(() => {
          if (session !== sessionRef.current) return;
          speakFrom(next, session);
        }, wait);
      };

      u.onend = advance;
      u.onerror = (e) => {
        // "interrupted"/"canceled" happen on stop — ignore those.
        if (session !== sessionRef.current) return;
        if (e.error === "interrupted" || e.error === "canceled") return;
        advance();
      };

      window.speechSynthesis.speak(u);
    },
    [supported, selectedVoice, rate, volume, storyteller],
  );

  const stop = useCallback(() => {
    sessionRef.current += 1;
    clearTimer();
    if (supported) window.speechSynthesis.cancel();
    idxRef.current = 0;
    setIndex(0);
    setState("idle");
  }, [supported]);

  const start = useCallback(
    (from = 0) => {
      if (!supported || !chunksRef.current.length) return;
      sessionRef.current += 1;
      const session = sessionRef.current;
      clearTimer();
      window.speechSynthesis.cancel();
      idxRef.current = from;
      setIndex(from);
      setState("speaking");
      // Small delay lets the cancel flush before queueing (iOS Safari quirk).
      timerRef.current = window.setTimeout(() => {
        if (session !== sessionRef.current) return;
        speakFrom(from, session);
      }, 60);
    },
    [supported, speakFrom],
  );

  const toggle = useCallback(() => {
    if (!supported) return;
    if (state === "speaking") {
      window.speechSynthesis.pause();
      setState("paused");
      return;
    }
    if (state === "paused") {
      window.speechSynthesis.resume();
      setState("speaking");
      // Safari sometimes drops the queue on resume; restart from the current chunk.
      window.setTimeout(() => {
        if (stateRef.current === "speaking" && !window.speechSynthesis.speaking) {
          start(idxRef.current);
        }
      }, 260);
      return;
    }
    start(0);
  }, [state, start, supported]);

  // Restart from current position when voice/rate/storyteller change mid-playback.
  const restartKey = `${selectedVoice?.voiceURI ?? ""}|${rate}|${storyteller}|${volume}`;
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    if (stateRef.current === "speaking") start(Math.min(idxRef.current, chunksRef.current.length - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restartKey]);

  // Persist preferences
  useEffect(() => { localStorage.setItem(RATE_KEY, String(rate)); }, [rate]);
  useEffect(() => { localStorage.setItem(VOL_KEY, String(volume)); }, [volume]);
  useEffect(() => { localStorage.setItem(STORY_KEY, storyteller ? "1" : "0"); }, [storyteller]);
  useEffect(() => { if (voiceURI) localStorage.setItem(VOICE_KEY, voiceURI); }, [voiceURI]);

  // Cleanup on unmount
  useEffect(() => () => {
    sessionRef.current += 1;
    clearTimer();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const total = chunks.length;
  const pct = total ? Math.min(100, Math.round((index / total) * 100)) : 0;
  const currentSection = chunks[Math.min(index, total - 1)]?.section ?? "";
  const words = useMemo(
    () => chunks.reduce((n, c) => n + c.text.split(/\s+/).length, 0),
    [chunks],
  );

  const body = (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[2147483000] flex justify-center px-3"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="pointer-events-auto w-full max-w-[560px] animate-[studio-fade-in_0.28s_ease-out_both] overflow-hidden rounded-3xl border border-border/50 bg-background/80 shadow-2xl shadow-black/30 backdrop-blur-2xl">
        {/* progress */}
        <div className="h-1 w-full bg-secondary/60">
          <div
            className="h-full rounded-r-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4">
          <button
            onClick={toggle}
            disabled={!supported || !total}
            title={state === "speaking" ? "Pause narration" : state === "paused" ? "Resume narration" : "Play narration"}
            aria-label={state === "speaking" ? "Pause" : "Play"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-all hover:opacity-90 active:scale-[0.95] disabled:opacity-40"
          >
            {state === "speaking" ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>

          <button
            onClick={stop}
            disabled={!supported || state === "idle"}
            title="Stop and reset"
            aria-label="Stop"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
          >
            <Square className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
              {state === "speaking" && <AudioLines className="h-3.5 w-3.5 shrink-0 animate-pulse text-primary" />}
              <span className="truncate">
                {!supported
                  ? "Narration isn't available in this browser"
                  : state === "speaking"
                  ? currentSection || "Reading"
                  : state === "paused"
                  ? "Paused"
                  : "Listen to this note"}
              </span>
            </div>
            <div className="truncate text-[11px] text-muted-foreground/70">
              {supported
                ? `${pct}% · ${words.toLocaleString()} words · ${selectedVoice ? voiceLabel(selectedVoice) : "Default voice"}`
                : "You can still read the note normally."}
            </div>
          </div>

          <button
            onClick={() => setMinimized((m) => !m)}
            title={minimized ? "Show controls" : "Minimize player"}
            aria-label={minimized ? "Expand player" : "Minimize player"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {minimized ? <ChevronDown className="h-4 w-4 rotate-180" /> : <Minus className="h-4 w-4" />}
          </button>
          <button
            onClick={() => { stop(); onClose(); }}
            title="Close player"
            aria-label="Close player"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Expanded controls */}
        {!minimized && supported && (
          <div className="space-y-3 border-t border-border/40 px-3 pb-3 pt-3 sm:px-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setStoryteller((s) => !s)}
                title="Storyteller mode adds warm narrative pacing and natural pauses between sections"
                className={`flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-medium transition-colors ${
                  storyteller ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <AudioLines className="h-3.5 w-3.5" /> Storyteller
              </button>

              <div className="relative">
                <button
                  onClick={() => setVoiceMenu((o) => !o)}
                  title="Choose a device voice"
                  className="flex h-9 max-w-[190px] items-center gap-1.5 rounded-xl border border-border/50 px-3 text-[13px] text-foreground transition-colors hover:bg-secondary"
                >
                  <span className="truncate">{selectedVoice ? voiceLabel(selectedVoice) : "Default voice"}</span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
                {voiceMenu && (
                  <>
                    <div className="fixed inset-0 z-0" onClick={() => setVoiceMenu(false)} />
                    <div className="absolute bottom-11 left-0 z-10 max-h-[260px] w-[260px] overflow-y-auto rounded-2xl border border-border/60 bg-popover/95 py-1 shadow-xl backdrop-blur-xl">
                      {sortedVoices.length === 0 && (
                        <div className="px-3 py-2 text-[13px] text-muted-foreground">No device voices found.</div>
                      )}
                      {sortedVoices.map((v) => (
                        <button
                          key={v.voiceURI}
                          onClick={() => { setVoiceURI(v.voiceURI); setVoiceMenu(false); }}
                          className={`block w-full px-3 py-2 text-left text-[13px] transition-colors hover:bg-secondary ${
                            selectedVoice?.voiceURI === v.voiceURI ? "text-primary" : "text-foreground"
                          }`}
                        >
                          <span className="block truncate">{voiceLabel(v)}</span>
                          <span className="block text-[11px] text-muted-foreground/70">{v.lang}{v.localService ? " · on device" : ""}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <label className="flex items-center gap-3 text-[12px] text-muted-foreground">
              <span className="w-12 shrink-0">Pacing</span>
              <input
                type="range" min={0.6} max={1.4} step={0.02} value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                title="Storyteller pacing"
                className="h-6 flex-1 accent-[hsl(var(--primary))]"
              />
              <span className="w-10 shrink-0 text-right tabular-nums">{rate.toFixed(2)}×</span>
            </label>

            <label className="flex items-center gap-3 text-[12px] text-muted-foreground">
              <span className="flex w-12 shrink-0 items-center gap-1">
                {volume === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </span>
              <input
                type="range" min={0} max={1} step={0.05} value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                title="Volume"
                className="h-6 flex-1 accent-[hsl(var(--primary))]"
              />
              <span className="w-10 shrink-0 text-right tabular-nums">{Math.round(volume * 100)}%</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(body, document.body);
}
