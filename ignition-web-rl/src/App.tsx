import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import Experience from './Experience'
import { useState } from 'react'
import { Themes, ThemeName } from './themes'

function App() {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('Futuristic')

  const changeTheme = (themeName: ThemeName) => {
    setCurrentTheme(themeName)
  }

  return (
    <>
      <div className="theme-selector" style={{ 
        position: 'absolute', 
        top: '10px', 
        left: '10px', 
        zIndex: 100,
        display: 'flex',
        gap: '10px'
      }}>
        {Object.keys(Themes).map((themeName) => (
          <button 
            key={themeName} 
            onClick={() => changeTheme(themeName as ThemeName)}
            style={{
              background: currentTheme === themeName ? Themes[themeName as ThemeName].colors.primary : '#333',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: currentTheme === themeName ? 'bold' : 'normal'
            }}
          >
            {themeName}
          </button>
        ))}
      </div>

      <Canvas camera={{ position: [30, 100, 300], fov: 60}} shadows >
        <OrbitControls 
          minDistance={30} 
          maxDistance={75}
          maxAzimuthAngle={Math.PI / 2.2} 
          maxPolarAngle={Math.PI / 2.2} 
        />
        <color attach="background" args={[Themes[currentTheme].colors.background]} />
        <Physics debug={false}>
          <Experience theme={Themes[currentTheme]} />
        </Physics>
      </Canvas>
    </>
  )
}

export default App
