import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

/**
 * The interactive hero: the Cogent brain logo, reconstructed as a particle cloud
 * by sampling the actual PNG. The chaotic "Impulse" (left) hemisphere drifts fast
 * and warm; the ordered "Logic" (right) hemisphere stays calm and cool. The cursor
 * stirs the particles. Bloom gives the neon glow.
 *
 * Degrades gracefully: if reduced-motion is requested, WebGL is unavailable, the
 * image can't be sampled, or the scene throws, this renders nothing and the static
 * logo underneath (`.hero-logo-fallback` in Hero.astro) stays visible.
 */

const LOGO_SRC = '/brand/logo-512.png';
const PLANE = 5; // world units the brain spans

type Buffers = {
  positions: Float32Array;
  colors: Float32Array;
  seeds: Float32Array;
  sides: Float32Array;
  count: number;
};

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext('webgl') || c.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

async function buildFromImage(mobile: boolean): Promise<Buffers | null> {
  const img = await new Promise<HTMLImageElement | null>((resolve) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => resolve(null);
    i.src = LOGO_SRC;
  });
  if (!img) return null;

  const S = 220;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, S, S);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, S, S).data;
  } catch {
    return null; // tainted canvas — bail to fallback
  }

  const step = mobile ? 3 : 2;
  const keep = mobile ? 0.72 : 0.82; // thin the sample so it isn't over-dense
  const pos: number[] = [];
  const col: number[] = [];
  const seed: number[] = [];
  const side: number[] = [];

  const impulse = [new THREE.Color('#FF453A'), new THREE.Color('#FF9F0A')];
  const logic = [new THREE.Color('#3B82F6'), new THREE.Color('#7C7AF0')];

  for (let y = 0; y < S; y += step) {
    for (let x = 0; x < S; x += step) {
      const idx = (y * S + x) * 4;
      const alpha = data[idx + 3] / 255;
      const lum = ((data[idx] + data[idx + 1] + data[idx + 2]) / 3 / 255) * alpha;
      if (lum < 0.32) continue;
      if (Math.random() > keep) continue;

      const nx = x / S - 0.5;
      const ny = -(y / S - 0.5);
      pos.push(nx * PLANE, ny * PLANE, (Math.random() - 0.5) * 0.3);

      const s = Math.random();
      seed.push(s);

      const isImpulse = nx < 0;
      side.push(isImpulse ? -1 : 1);

      const pal = isImpulse ? impulse : logic;
      const c = pal[0].clone().lerp(pal[1], Math.random());
      const b = 0.55 + lum * 0.7;
      col.push(c.r * b, c.g * b, c.b * b);
    }
  }

  if (seed.length === 0) return null;
  return {
    positions: new Float32Array(pos),
    colors: new Float32Array(col),
    seeds: new Float32Array(seed),
    sides: new Float32Array(side),
    count: seed.length,
  };
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2  uMouse;
  uniform float uMouseActive;
  uniform float uSize;
  uniform float uPixelRatio;

  attribute vec3  aColor;
  attribute float aSeed;
  attribute float aSide;   // -1 = impulse (left), +1 = logic (right)

  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    vec3 pos = position;

    // impulse side drifts more and faster; logic side stays calm
    float chaos = aSide < 0.0 ? 1.0 : 0.28;
    float t = uTime * (0.5 + chaos * 0.9);
    float a = aSeed * 6.2831853;

    vec3 drift;
    drift.x = sin(t * 1.3 + a) + sin(t * 2.7 + a * 1.7) * 0.5;
    drift.y = cos(t * 1.1 + a * 1.3) + sin(t * 3.1 + a * 0.7) * 0.5;
    drift.z = sin(t * 0.9 + a * 2.1);
    pos += drift * (0.03 + chaos * 0.12);

    // cursor repulsion
    vec2 d = pos.xy - uMouse;
    float dist = length(d);
    float force = smoothstep(0.95, 0.0, dist) * uMouseActive;
    pos.xy += normalize(d + 1e-4) * force * 0.55;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float size = uSize * (0.55 + aSeed * 0.85);
    gl_PointSize = size * uPixelRatio * (1.0 / -mv.z);

    vAlpha = 0.45 + 0.55 * aSeed;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float mask = smoothstep(0.5, 0.04, d);
    if (mask <= 0.001) discard;
    gl_FragColor = vec4(vColor, mask * vAlpha);
  }
`;

type MouseRef = React.MutableRefObject<{ x: number; y: number; active: number }>;

function Brain({ buffers, mouse }: { buffers: Buffers; mouse: MouseRef }) {
  const { viewport } = useThree();

  const { object, material } = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(buffers.positions, 3));
    geom.setAttribute('aColor', new THREE.BufferAttribute(buffers.colors, 3));
    geom.setAttribute('aSeed', new THREE.BufferAttribute(buffers.seeds, 1));
    geom.setAttribute('aSide', new THREE.BufferAttribute(buffers.sides, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(999, 999) },
        uMouseActive: { value: 0 },
        uSize: { value: 22 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      },
    });

    return { object: new THREE.Points(geom, mat), material: mat };
  }, [buffers]);

  useEffect(() => {
    return () => {
      object.geometry.dispose();
      material.dispose();
    };
  }, [object, material]);

  useFrame((state, delta) => {
    material.uniforms.uTime.value += Math.min(delta, 0.05);

    const targetActive = mouse.current.active;
    const worldX = (mouse.current.x * viewport.width) / 2;
    const worldY = (mouse.current.y * viewport.height) / 2;
    material.uniforms.uMouse.value.set(worldX, worldY);
    material.uniforms.uMouseActive.value = THREE.MathUtils.lerp(
      material.uniforms.uMouseActive.value,
      targetActive,
      0.08,
    );

    // gentle parallax toward the cursor + idle sway
    const swayY = Math.sin(state.clock.elapsedTime * 0.15) * 0.08;
    object.rotation.y = THREE.MathUtils.lerp(
      object.rotation.y,
      swayY + mouse.current.x * 0.12 * mouse.current.active,
      0.04,
    );
    object.rotation.x = THREE.MathUtils.lerp(
      object.rotation.x,
      -mouse.current.y * 0.08 * mouse.current.active,
      0.04,
    );
  });

  return <primitive object={object} />;
}

class Boundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function HeroCanvas() {
  const [buffers, setBuffers] = useState<Buffers | null>(null);
  const [mobile, setMobile] = useState(false);
  const [frameloop, setFrameloop] = useState<'always' | 'never'>('always');
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const mouse = useRef({ x: 0, y: 0, active: 0 });

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !hasWebGL()) return;
    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    setMobile(isMobile);

    let alive = true;
    buildFromImage(isMobile).then((b) => {
      if (alive && b) setBuffers(b);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Pause the render loop (and its bloom pass) whenever the hero is scrolled
  // out of view, so it doesn't compete with the rest of the page for the GPU.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setFrameloop(entry.isIntersecting ? 'always' : 'never'),
      { rootMargin: '120px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [buffers]);

  if (!buffers) return null;

  return (
    <Boundary>
      <div
        ref={wrapRef}
        className="absolute inset-0"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          mouse.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
          mouse.current.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
          mouse.current.active = 1;
        }}
        onPointerLeave={() => {
          mouse.current.active = 0;
        }}
      >
        <Canvas
          frameloop={frameloop}
          camera={{ position: [0, 0, 7], fov: 45 }}
          dpr={[1, mobile ? 1.5 : 1.75]}
          gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        >
          <Brain buffers={buffers} mouse={mouse} />
          {!mobile && (
            /* MSAA off: additive point sprites gain nothing from it, and it is
               the single most expensive part of a fullscreen composer pass. */
            <EffectComposer multisampling={0}>
              <Bloom
                intensity={0.85}
                luminanceThreshold={0.08}
                luminanceSmoothing={0.3}
                mipmapBlur
              />
            </EffectComposer>
          )}
        </Canvas>
      </div>
    </Boundary>
  );
}
