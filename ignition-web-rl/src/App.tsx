import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import Experience from './Experience'

function App() {

  return (
    <>
      <Canvas camera={{ position: [30, 100, 300], fov: 60}} shadows >
        <OrbitControls />
        <color attach="background" args={["#171720"]} />
        <Physics debug={true}>
          <Experience />
        </Physics>
      </Canvas>
    </>
  )
}

export default App
