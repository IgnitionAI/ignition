import { Center, Text, shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { useFrame, extend } from '@react-three/fiber'
import { useRef } from 'react'

// Définition d'un matériau shader personnalisé pour le gradient
//vibe-coding for shader
const GradientMaterial = shaderMaterial(
  {
    colorA: new THREE.Color('#a5f3fc'),
    colorB: new THREE.Color('#0c8cbf')
  },
  // Vertex shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform vec3 colorA;
    uniform vec3 colorB;
    varying vec2 vUv;
    
    void main() {
      vec3 color = mix(colorA, colorB, vUv.y);
      gl_FragColor = vec4(color, 1.0);
    }
  `
)

// Étendre React Three Fiber avec notre matériau personnalisé
extend({ GradientMaterial })

// Déclarer le type pour TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      gradientMaterial: any
    }
  }
}

function Logo3D() {
  const groupRef = useRef<THREE.Group>(null)
  const materialRef = useRef<any>(null)
  
  // Animation de flottement agressive
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime
      
      // Mouvement vertical plus rapide et plus ample
      groupRef.current.position.y = 15 + Math.sin(time * 1.2) * 0.8
      
      // Ajout d'un mouvement latéral pour plus de dynamisme
      groupRef.current.position.x = Math.sin(time * 0.7) * 0.5
      
      // Mouvement avant/arrière pour effet 3D
      groupRef.current.position.z = -15 + Math.sin(time * 0.9) * 0.7
      
      // Rotations plus prononcées sur plusieurs axes
      groupRef.current.rotation.y = Math.sin(time * 0.8) * 0.15
      groupRef.current.rotation.x = Math.sin(time * 0.6) * 0.08
      groupRef.current.rotation.z = Math.sin(time * 0.5) * 0.05
    }
  })
  
  return (
     <group ref={groupRef} position={[0, 15, -15]}>
      <Center position={[0, 1, 0]}>
          <Text
            fontSize={4}
            font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
            characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
            letterSpacing={0.05}
            color="#0c8cbf"
          >
            IgnitionAI
            {/* @ts-ignore */}
            <gradientMaterial ref={materialRef} />
          </Text>
     </Center>
   </group>
  )
}

export default Logo3D