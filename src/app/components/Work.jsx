'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useVideoTexture } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';

function DistortionEffect({ renderTarget }) {
  const { gl, scene, camera, size } = useThree();
  const composer = useRef();

  useEffect(() => {
    const rt = new THREE.WebGLRenderTarget(size.width, size.height);
    renderTarget.current = rt;

    const comp = new EffectComposer(gl, rt);
    comp.setSize(size.width, size.height);
    comp.addPass(new RenderPass(scene, camera));

    const shader = {
      uniforms: {
        tDiffuse: { value: null },
        tDisplacement: { value: new THREE.TextureLoader().load('/displacement.png') },
        uTime: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D tDisplacement;
        uniform float uTime;
        varying vec2 vUv;

        void main() {
          vec2 displacement = texture2D(tDisplacement, vUv + vec2(uTime * 0.05, 0.0)).rg;
          vec2 distortedUv = vUv + displacement * 0.05;

          // Only distort top-right corner
          float maskX = smoothstep(0.7, 1.0, vUv.x);
          float maskY = smoothstep(0.7, 1.0, vUv.y);
          float mask = maskX * maskY;

          vec4 original = texture2D(tDiffuse, vUv);
          vec4 distorted = texture2D(tDiffuse, distortedUv);
          gl_FragColor = mix(original, distorted, mask);
        }
      `
    };

    const shaderPass = new ShaderPass(shader);
    comp.addPass(shaderPass);

    composer.current = comp;

    return () => comp.dispose();
  }, [gl, scene, camera, size, renderTarget]);

  useFrame(({ clock }) => {
    if (composer.current) {
      composer.current.passes[1].uniforms.uTime.value = clock.elapsedTime;
      composer.current.render();
    }
  }, 1);

  return null;
}

function DistortedPlane() {
  const videoTexture = useVideoTexture('https://lusion.dev/assets/textures/reel/desktop.mp4');
  return (
    <mesh>
      <planeGeometry args={[10, 6]} />
      <meshBasicMaterial map={videoTexture} toneMapped={false} />
    </mesh>
  );
}

export default function Work() {
  const renderTarget = useRef(null);

  return (
    <div style={{ height: '100vh' }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <ambientLight />
        <DistortedPlane />
        <DistortionEffect renderTarget={renderTarget} />
      </Canvas>
    </div>
  );
}
