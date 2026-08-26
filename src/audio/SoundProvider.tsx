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
    const offBolt = onLightning(() => {
      /* the city schedules its own thunder with a real acoustic delay */
    });
    const offLevel = onStormLevel((level) => soundscape.setStormLevel(level));
    // template portals announce themselves as you reach them
    const onPortal = (e: Event) => {
      const detail = (e as CustomEvent<{ enter?: boolean }>).detail;
      soundscape.portalTone(detail?.enter !== false);
    };
    window.addEventListener("picksaw:portal", onPortal);
    // Lightning dispatches its thunder separately, delayed by the real
    // travel time of sound — so the crack arrives after the flash.
    const onThunder = (e: Event) => {
      const d = (e as CustomEvent<{ power?: number }>).detail;
      soundscape.thunder(d?.power ?? 0.6);
    };
    window.addEventListener("picksaw:thunder", onThunder);
    return () => {
      offBolt();
      offLevel();
      window.removeEventListener("picksaw:portal", onPortal);
      window.removeEventListener("picksaw:thunder", onThunder);
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
