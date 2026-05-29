"use client";
import { useEffect, useState } from "react";

type Props = {
  text: string;
  label?: string;
  className?: string;
};

/**
 * Reads the given text aloud using the browser's Web Speech API. Phase 5 may
 * upgrade to OpenAI TTS for a warmer voice; the interface stays the same.
 */
export function ReadAloud({ text, label = "Read aloud", className }: Props) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" && "speechSynthesis" in window,
    );
  }, []);

  if (!supported) return null;

  const toggle = () => {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(utter);
    setSpeaking(true);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={speaking}
      className={
        className ??
        "inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-md bg-navy-100 text-navy-800 hover:bg-navy-200 focus-visible:bg-navy-200 text-base font-medium"
      }
    >
      <span aria-hidden="true">{speaking ? "■" : "▶"}</span>
      <span>{speaking ? "Stop" : label}</span>
    </button>
  );
}
