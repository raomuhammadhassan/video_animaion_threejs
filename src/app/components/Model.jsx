import { shaderMaterial, useVideoTexture } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'
import React, { useEffect, useRef, useState } from 'react'
import { geometry } from 'maath'
extend(geometry)


// Define custom shader material
const WaterMaterial = shaderMaterial(
  { uColor: 0.7, uTexture: null, uTime: 0.0 },
  `
    uniform float uColor;
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec3 pos = position;

      float width = 8.0;
      float height = 6.0;

      float xFactor = (pos.x + width * 0.5) / width;
      float yFactor = (pos.y + height * 0.5) / height;
      float stretchFactor = xFactor * yFactor;

      pos.z += sin(pos.x * 1.0 - uTime * 2.0) * 0.5 * stretchFactor;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  `
    uniform sampler2D uTexture;
    uniform float uColor;
    varying vec2 vUv;

    void main() {
      vec4 texColor = texture2D(uTexture, vUv);
      vec3 blueTint = vec3(0.0, 0.2, 0.5);
      float blendFactor = uColor;
      vec3 finalColor = mix(texColor.rgb, blueTint, blendFactor);
      gl_FragColor = vec4(finalColor, texColor.a);
    }
  `
)

extend({ WaterMaterial })

export default function Model() {
  const videoTexture = useVideoTexture('https://lusion.dev/assets/textures/reel/desktop.mp4',{loop:true})
  const ref = useRef()
  const materialRef = useRef()
  const [targetScale, setTargetScale] = useState(1)
  const [elapsed, setElapsed] = useState(0)
  const [rippleActive, setRippleActive] = useState(false)

  function zoom() {
    setTargetScale(1.5)
    if (materialRef.current) {
      materialRef.current.uColor = 0.0
    }
    setRippleActive(true)
    setElapsed(0)
  }

  useFrame((state, delta) => {
    // Smooth scale animation
    if (ref.current) {
      ref.current.scale.x += (targetScale - ref.current.scale.x) * 0.1
    }

    // Animate ripple for 1 second, then stop
    if (rippleActive) {
      setElapsed(prev => {
        const newElapsed = prev + delta
        if (materialRef.current) {
          materialRef.current.uTime = newElapsed * 3.0
        }
        if (newElapsed > 2.0) {
          setRippleActive(false)
          if (materialRef.current) materialRef.current.uTime = 0.0
        }
        return newElapsed
      })
    }
  })
  useEffect(()=>{
    setTimeout(() => {
        zoom()

    }, 1000);
  },[])

  return (
    <mesh ref={ref} onClick={zoom} scale={[1, 1, 1]}>
      <roundedPlaneGeometry args={[8, 6,0.4,50,50]} />
      <waterMaterial ref={materialRef} uTexture={videoTexture} />
    </mesh>
  )
}
