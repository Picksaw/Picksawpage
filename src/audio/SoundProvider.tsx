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
  stormVol: number;
  lofiVol: number;
  toggleStorm: () => void;
  toggleLofi: () => void;
  setStormVol: (v: number) => void;
  setLofiVol: (v: number) => void;
  blip: typeof soundscape.blip;
}

const SoundContext = createContext<SoundApi | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [stormOn, setStormOn] = useState(false);
  const [lofiOn, setLofiOn] = useState(false);
  const [volumes, setVolumes] = useState(() => soundscape.volumes);

  // Bridge global storm events into the audio engine.
  useEffect(() => {
    // The 2D storm canvas fires this on every strike; it is the only
    // thing scheduling thunder now that the city is gone.
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

  const setStormVol = useCallback((v: number) => {
    soundscape.setVolume("storm", v);
    setVolumes((prev) => ({ ...prev, storm: v }));
  }, []);

  const setLofiVol = useCallback((v: number) => {
    soundscape.setVolume("lofi", v);
    setVolumes((prev) => ({ ...prev, lofi: v }));
  }, []);

  const value = useMemo<SoundApi>(
    () => ({
      stormOn,
      lofiOn,
      stormVol: volumes.storm,
      lofiVol: volumes.lofi,
      toggleStorm,
      toggleLofi,
      setStormVol,
      setLofiVol,
      blip: (kind?: "hover" | "click" | "toggle" | "success") =>
        soundscape.blip(kind ?? "hover"),
    }),
    [stormOn, lofiOn, volumes, toggleStorm, toggleLofi, setStormVol, setLofiVol]
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
      stormVol: 0.75,
      lofiVol: 0.8,
      toggleStorm: () => {},
      toggleLofi: () => {},
      setStormVol: () => {},
      setLofiVol: () => {},
      blip: (() => {}) as typeof soundscape.blip,
    } satisfies SoundApi;
  }
  return ctx;
}
