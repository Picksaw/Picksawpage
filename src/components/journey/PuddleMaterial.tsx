import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import CSM from "three-custom-shader-material";

export function PuddleMaterial() {
  const maps = useTexture({
    map: import.meta.env.BASE_URL + "road/aerial_asphalt_01_diff_2k.webp",
    normalMap: import.meta.env.BASE_URL + "road/aerial_asphalt_01_nor_gl_2k.webp",
    roughnessMap: import.meta.env.BASE_URL + "road/aerial_asphalt_01_rough_2k.webp",
    aoMap: import.meta.env.BASE_URL + "road/aerial_asphalt_01_ao_2k.webp",
  });

  useLayoutEffect(() => {
    for (const key in maps) {
      // @ts-ignore
      maps[key].wrapS = maps[key].wrapT = THREE.RepeatWrapping;
      // @ts-ignore
      maps[key].repeat.set(55, 75);
    }
  }, [maps]);

  const vertexShader = useMemo(() => `
varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
    vPosition = position;
    vUv = uv;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
}
`, []);

  const fragmentShader = useMemo(
    () =>
      `
			uniform float uTime;
      uniform float uRainFactor;

			varying vec3 vPosition;
			varying vec2 vUv;
      varying vec3 vWorldPosition;

			vec3 csm_PuddleNormal;
			float csm_PuddleNormalMask;

      // MAX_RADIUS removed (optimized out for 60fps)
      #define HASHSCALE1 .1031
      #define HASHSCALE3 vec3(.1031, .1030, .0973)

      float mapLinear(float x, float a1, float a2, float b1, float b2) {
        return b1 + (x - a1) * (b2 - b1) / (a2 - a1);
      }

      float hash12(vec2 p) {
        vec3 p3  = fract(vec3(p.xyx) * HASHSCALE1);
        p3 += dot(p3, p3.yzx + 19.19);
        return fract((p3.x + p3.y) * p3.z);
      }

      vec2 hash22(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * HASHSCALE3);
        p3 += dot(p3, p3.yzx+19.19);
        return fract((p3.xx+p3.yz)*p3.zy);
      }

      vec3 getRipples(vec2 uv) {
        // GPU Opt: Just a simple single-pass procedural ripple, no nested loops
        float time = uTime * 2.0;
        vec2 p0 = floor(uv);
        vec2 circles = vec2(0.0);
        
        vec2 hsh = p0;
        vec2 p = p0 + hash22(hsh);
        float t = fract(0.3*time + hash12(hsh));
        vec2 v = p - uv;
        float d = length(v) - t;
        float h = 1e-3;
        float d1 = d - h;
        float d2 = d + h;
        float p1 = sin(31.*d1) * smoothstep(-0.6, -0.3, d1) * smoothstep(0., -0.3, d1);
        float p2 = sin(31.*d2) * smoothstep(-0.6, -0.3, d2) * smoothstep(0., -0.3, d2);
        
        circles += normalize(v) * ((p2 - p1) / (2. * h) * (1. - t) * (1. - t));
        vec3 n = vec3(circles * 0.15, 1.0);
        return normalize(n);
      }

      
      // Simple 2D noise
      vec2 random2(vec2 st){
          st = vec2( dot(st,vec2(127.1,311.7)),
                    dot(st,vec2(269.5,183.3)) );
          return -1.0 + 2.0*fract(sin(st)*43758.5453123);
      }

      float noise(vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);
          vec2 u = f*f*(3.0-2.0*f);
          return mix( mix( dot( random2(i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
                           dot( random2(i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                      mix( dot( random2(i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
                           dot( random2(i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
      }

      float fbm(vec2 st) {
          float v = 0.0;
          float a = 0.5;
          vec2 shift = vec2(100.0);
          mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
          for (int i = 0; i < 2; ++i) { // 2 passes instead of 4 for massive performance gain
              v += a * noise(st);
              st = rot * st * 2.0 + shift;
              a *= 0.5;
          }
          return v;
      }

      float getPuddle(vec2 uv) {
        float n = fbm((uv + vec2(3.0, 0.0)) * 0.2);
        // Normalize roughly to 0-1
        n = n * 0.5 + 0.5;
        return smoothstep(0.4, 0.6, n);
      }


			vec3 perturbNormal(vec3 inputNormal, vec3 noiseNormal, float strength) {
				vec3 noiseNormalOrthogonal = noiseNormal - (dot(noiseNormal, inputNormal) * inputNormal);
				vec3 noiseNormalProjectedBump = mat3(csm_internal_vModelViewMatrix) * noiseNormalOrthogonal;
				return normalize(inputNormal - (noiseNormalProjectedBump * strength));
			}

			void main() {
        float roughnessProgress = smoothstep(0.0, 0.75, uRainFactor);
        roughnessProgress = clamp(roughnessProgress, 0.0, 1.0);

        float normalProgress = smoothstep(0.75, 1.0, uRainFactor);
        normalProgress = clamp(normalProgress, 0.0, 1.0);

				// FBM is also heavy. Fade it out at distance
        float distToCamPuddle = length(vWorldPosition - cameraPosition);
        float puddleNoise = 0.5; // Default safe value
        if (distToCamPuddle < 60.0) {
            puddleNoise = getPuddle(vUv * vec2(110.0, 150.0) * 1.5);
            // Blend into a flat 0.5 noise at a distance
            puddleNoise = mix(puddleNoise, 0.5, smoothstep(40.0, 60.0, distToCamPuddle));
        }

				// // Normals
				csm_PuddleNormal = vNormal;
				csm_PuddleNormalMask = smoothstep(0.2, 1.0, puddleNoise) * normalProgress;

				csm_PuddleNormal = csm_PuddleNormal;

				// // Roughness
        float prevRoughness = csm_Roughness;
				csm_Roughness = 1.0 - csm_PuddleNormalMask;
				csm_Roughness = clamp(csm_Roughness, 0.05, 0.2);
        csm_Roughness = mix(prevRoughness, csm_Roughness, roughnessProgress);

				// // Ripples
        // High performance check: only compute expensive ripples if we are close to the camera!
        float distToCam = length(vWorldPosition - cameraPosition);
        vec3 rippleNormals = vec3(0.0);
        
        if (distToCam < 35.0) {
            rippleNormals = getRipples(vUv * vec2(110.0, 150.0) * 5.0);
            // fade out ripples over distance to avoid harsh cutoff
            float rippleFade = smoothstep(35.0, 20.0, distToCam);
            csm_PuddleNormal = perturbNormal(csm_PuddleNormal, rippleNormals, 0.25 * uRainFactor * rippleFade);
        }
      
        
        
        
        
        // Road lines
        float stripeW = 0.035;
        float centerStripe = (1.0 - step(stripeW, abs(vWorldPosition.x))) * step(0.5, fract(vWorldPosition.z * 0.25));
        float edgeStripeL = (1.0 - step(stripeW, abs(vWorldPosition.x + 2.6)));
        float edgeStripeR = (1.0 - step(stripeW, abs(vWorldPosition.x - 2.6)));
        float roadLines = clamp(centerStripe + edgeStripeL + edgeStripeR, 0.0, 1.0);

        // Darken the color to fit the scene better
        csm_DiffuseColor.rgb *= 0.6; // Brighter
        csm_DiffuseColor.rgb += vec3(0.01, 0.04, 0.07); // Base ambient blue
        
        // Apply road lines
        csm_DiffuseColor.rgb = mix(csm_DiffuseColor.rgb, vec3(0.05, 0.5, 0.8), roadLines * 0.7);
        csm_Roughness = mix(csm_Roughness, 0.35, roadLines); // road lines are less reflective

  
			}
		`,
    [],
  );

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRainFactor: { value: 1.0 }, // Rain is always at 1.0 since it's raining in this scene
    }),
    [],
  );

  const patchMap = useMemo(
    () => ({
      "*": {
        "#include <normal_fragment_maps>": `
				#include <normal_fragment_maps>
				normal = mix(normal, csm_PuddleNormal, csm_PuddleNormalMask);
			`,
      },
    }),
    [],
  );

  useFrame((_, dt) => {
    uniforms.uTime.value += dt;
  });

  return (
    <CSM
      key={vertexShader + fragmentShader}
      baseMaterial={THREE.MeshPhysicalMaterial}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={uniforms}
      patchMap={patchMap}
      transparent={false}
      envMapIntensity={2.5}
      {...maps}
    />
  );
}
