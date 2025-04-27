import { useTrainingStore } from "./store/trainingStore"

export function TrainingDashboard() {
  const { episodeCount, successCount, rewards, collected, elapsedTime, isTraining, progressToTarget } = useTrainingStore()

  const MAX_EPISODE_DURATION = 30; // secondes
  const timeProgress = Math.min(1, elapsedTime / MAX_EPISODE_DURATION); // clamp entre 0 et 1
  const lastReward = rewards.length > 0 ? rewards[rewards.length - 1] : 0;

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.75)',
      padding: '12px',
      borderRadius: '10px',
      color: 'white',
      fontFamily: 'sans-serif',
      fontSize: '14px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      width: '240px'
    }}>
      <h4 style={{ margin: '0 0 10px 0' }}>Training Info</h4>
      
      <div>🎯 Episodes: <strong>{episodeCount}</strong></div>
      <div>🏆 Successes: <strong>{successCount}</strong></div>
      <div>💎 Last Reward: <strong>{lastReward.toFixed(2)}</strong></div>
      <div>🎯 Target: {collected ? '✅' : '❌'}</div>
      <div>⏱️ Time: {elapsedTime.toFixed(2)}s</div> 
      
      {isTraining && (
        <>
          {/* Progression sur la durée de l'épisode */}
          <div style={{ marginTop: '8px' }}>
            <div style={{
              height: '10px',
              width: '100%',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '5px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${timeProgress * 100}%`,
                background: timeProgress > 0.95 ? '#ff5555' : '#00cc88',
                transition: 'width 0.2s linear',
              }} />
            </div>
            <div style={{ fontSize: '10px', marginTop: '4px', textAlign: 'center' }}>
              Episode Time {Math.round(timeProgress * 100)}%
            </div>
          </div>

          {/* Progression vers la cible */}
          <div style={{ marginTop: '8px' }}>
            <div style={{
              height: '10px',
              width: '100%',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '5px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${progressToTarget * 100}%`,
                background: progressToTarget > 0.95 ? '#00cc88' : '#ffaa00',
                transition: 'width 0.2s linear',
              }} />
            </div>
            <div style={{ fontSize: '10px', marginTop: '4px', textAlign: 'center' }}>
              Target Progress {Math.round(progressToTarget * 100)}%
            </div>
          </div>
        </>
      )}
      
      <button
        onClick={() => useTrainingStore.getState().setTraining(true)}
        style={{
          background: '#00cc88',
          color: 'white',
          border: 'none',
          padding: '10px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold',
          marginTop: '12px',
          fontSize: '14px'
        }}
      >
        🚀 Start Training
      </button>
    </div>
  )
}
