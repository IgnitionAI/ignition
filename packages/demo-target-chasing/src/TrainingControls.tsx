import { useTrainingStore } from './store/trainingStore';

interface TrainingControlsProps {
  startTraining: () => void;
  stopTraining: () => void;
  resetEnvironment: () => void;
}

export function TrainingControls({ startTraining, stopTraining, resetEnvironment }: TrainingControlsProps) {
  const { 
    isTraining,
    episodeCount,
    reward,
    episodeTime,
    successCount,
    difficulty,
    lastAction
  } = useTrainingStore();

  return (
    <div className="training-controls">
      <h3>Contrôle d'entraînement</h3>
      <div>Épisodes: {episodeCount}</div>
      <div>Succès: {successCount} / {episodeCount}</div>
      <div>Difficulté: {difficulty + 1}/3</div>
      <div>Temps: {episodeTime.toFixed(1)}s</div>
      <div>Dernière action: {lastAction !== -1 ? ['Gauche', 'Droite', 'Avant', 'Arrière'][lastAction] : 'Aucune'}</div>
      <div>Récompense: {reward.toFixed(2)}</div>
      <div style={{ marginTop: '10px' }}>
        {!isTraining ? (
          <button onClick={startTraining}>Démarrer l'entraînement</button>
        ) : (
          <button onClick={stopTraining}>Arrêter l'entraînement</button>
        )}
        <button onClick={resetEnvironment} style={{ marginLeft: '10px' }}>Réinitialiser</button>
      </div>
    </div>
  );
}
