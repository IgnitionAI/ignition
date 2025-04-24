import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import Experience from './Experience'

function App() {

  return (
    <>
      <Canvas camera={{ position: [30, 100, 300], fov: 60}} shadows >
        <OrbitControls 
          minDistance={30} 
          maxDistance={75}
          maxAzimuthAngle={Math.PI / 2.2} // Limite l'angle pour ne pas passer sous le sol
          maxPolarAngle={Math.PI / 2.2} // Limite l'angle pour ne pas passer sous le sol
        />
        <color attach="background" args={["#171720"]} />
        <Physics debug={false}>
          <Experience />
        </Physics>
      </Canvas>
    </>
  )
}

export default App
