import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { soundscape } from "./soundscape";
import { onLightning, onStormLevel } from "../lib/stormEvents";

interface SoundApi {
  stormOn: boolean;
  lofiOn: boolean;
  toggleStorm: () => void;
  toggleLofi: () => void;
  blip: typeof soundscape.blip;
}

const SoundContext = createContext<SoundApi | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [stormOn, setStormOn] = useState(false);
  const [lofiOn, setLofiOn] = useState(false);

  // Bridge global storm events into the audio engine.
  useEffect(() => {
    const offBolt = onLightning((intensity) => soundscape.thunder(intensity));
    const offLevel = onStormLevel((level) => soundscape.setStormLevel(level));
    return () => {
      offBolt();
      offLevel();
    };
  }, []);

  const toggleStorm = useCallback(() => {
    soundscape.toggle("storm").then((on) => setStormOn(on));
  }, []);

  const toggleLofi = useCallback(() => {
    soundscape.toggle("lofi").then((on) => setLofiOn(on));
  }, []);

  const value = useMemo<SoundApi>(
    () => ({
      stormOn,
      lofiOn,
      toggleStorm,
      toggleLofi,
      blip: (kind?: "hover" | "click" | "toggle" | "success") =>
        soundscape.blip(kind ?? "hover"),
    }),
    [stormOn, lofiOn, toggleStorm, toggleLofi]
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    // Safe no-op fallback so components work outside the provider too.
    return {
      stormOn: false,
      lofiOn: false,
      toggleStorm: () => {},
      toggleLofi: () => {},
      blip: (() => {}) as typeof soundscape.blip,
    } satisfies SoundApi;
  }
  return ctx;
}
