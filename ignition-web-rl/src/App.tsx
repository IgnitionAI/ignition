import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import Experience from './Experience'
import { useState, useRef } from 'react'
import { Themes, ThemeName } from './themes'

function App() {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('Futuristic')
  const [isTraining, setIsTraining] = useState(false)
  const [episodeCount, setEpisodeCount] = useState(0)
  const [totalReward, setTotalReward] = useState(0)
  const [episodeTime, setEpisodeTime] = useState(0)
  
  // Référence aux contrôles d'entraînement
  const trainingControlsRef = useRef<{
    startTraining: () => void;
    stopTraining: () => void;
    resetEnvironment: () => void;
  } | null>(null)

  const changeTheme = (themeName: ThemeName) => {
    setCurrentTheme(themeName)
  }
  
  const handleStartTraining = () => {
    if (trainingControlsRef.current) {
      trainingControlsRef.current.startTraining()
      setIsTraining(true)
    }
  }
  
  const handleStopTraining = () => {
    if (trainingControlsRef.current) {
      trainingControlsRef.current.stopTraining()
      setIsTraining(false)
    }
  }
  
  const handleResetEnvironment = () => {
    if (trainingControlsRef.current) {
      trainingControlsRef.current.resetEnvironment()
      setTotalReward(0)
    }
  }
  
  const handleEnvironmentReady = (controls: {
    startTraining: () => void;
    stopTraining: () => void;
    resetEnvironment: () => void;
  }) => {
    trainingControlsRef.current = controls
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
      
      <div className="training-controls" style={{ 
        position: 'absolute', 
        top: '60px', 
        left: '10px', 
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '15px',
        borderRadius: '8px',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '300px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: Themes[currentTheme].colors.secondary }}>
          IgnitionAI - Entraînement
        </h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Épisodes:</span>
          <span>{episodeCount}</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Récompense:</span>
          <span>{totalReward.toFixed(2)}</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Temps écoulé:</span>
          <span>{episodeTime} / 60 sec</span>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          {!isTraining ? (
            <button 
              onClick={handleStartTraining}
              style={{
                background: Themes[currentTheme].colors.primary,
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                flex: 1
              }}
            >
              Démarrer
            </button>
          ) : (
            <button 
              onClick={handleStopTraining}
              style={{
                background: '#bf0c3f',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                flex: 1
              }}
            >
              Arrêter
            </button>
          )}
          
          <button 
            onClick={handleResetEnvironment}
            style={{
              background: Themes[currentTheme].colors.secondary,
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              flex: 1
            }}
          >
            Réinitialiser
          </button>
        </div>
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
          <Experience 
            theme={Themes[currentTheme]} 
            isTraining={isTraining}
            onEpisodeCountChange={setEpisodeCount}
            onTotalRewardChange={setTotalReward}
            onEpisodeTimeChange={setEpisodeTime}
            onEnvironmentReady={handleEnvironmentReady}
          />
        </Physics>
      </Canvas>
    </>
  )
}

export default App
