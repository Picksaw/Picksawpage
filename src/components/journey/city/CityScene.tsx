/**
 * CityScene — everything that lives inside the district's Canvas.
 *
 * Composition (Phase 1) → camera (Phase 2) → lighting (Phase 3) →
 * atmosphere, rain, materials, life, portals, props, particles,
 * lightning, audio and the observatory finale layer in on top of this
 * without disturbing what is underneath.
 */

import Buildings from "./Buildings";
import Street from "./Street";
import WetGround from "./WetGround";
import CameraRig from "./CameraRig";
import Skyline from "./Skyline";
import HeroPlots from "./HeroPlots";
import Lighting from "./Lighting";
import Sky from "./Sky";
import ContextGuard from "./ContextGuard";
import StreetLamps from "./StreetLamps";
import PostFX, { AdaptiveDPR } from "./PostFX";
import Atmosphere from "./Atmosphere";
import Rain from "./Rain";
import LensWater from "./LensWater";
import BuildingLife from "./BuildingLife";
import Portals from "./Portals";
import Props from "./Props";
import Particles from "./Particles";
import Lightning from "./Lightning";
import Soundscape3D from "./Soundscape3D";
import Observatory from "./Observatory";
import type { Quality } from "../lib/quality";
import type { TemplateItem } from "../../../config/templatesConfig";

export default function CityScene({
  quality,
  onOpenTemplate,
  onContextLost,
  onContextRestored,
}: {
  quality: Quality;
  onOpenTemplate: (item: TemplateItem) => void;
  onContextLost?: () => void;
  onContextRestored?: () => void;
}) {
  return (
    <>
      <ContextGuard onLost={onContextLost} onRestored={onContextRestored} />

      <CameraRig quality={quality} />
      <AdaptiveDPR quality={quality} />

      {/* drawn first — guarantees every pixel is written each frame */}
      <Sky />

      <Lighting quality={quality} />

      <WetGround quality={quality} />
      <Street quality={quality} />
      <Buildings quality={quality} />
      <HeroPlots quality={quality} />
      <Portals quality={quality} onOpen={onOpenTemplate} />
      <StreetLamps quality={quality} />
      <BuildingLife quality={quality} />
      <Props quality={quality} />
      {quality.skyline && <Skyline quality={quality} />}

      {/* layered atmospheric depth — owns the scene fog too */}
      <Atmosphere quality={quality} />
      <Rain quality={quality} />
      <Particles quality={quality} />
      <LensWater quality={quality} />
      <Lightning quality={quality} />

      <Observatory quality={quality} />
      <Soundscape3D quality={quality} />

      <PostFX quality={quality} />
    </>
  );
}
