import { useTranslation } from 'react-i18next';
import { useTrainingStore } from './store/trainingStore';

interface TrainingControlsProps {
  startTraining: () => void;
  stopTraining: () => void;
  resetEnvironment: () => void;
}

const ACTION_KEYS = ['left', 'right', 'forward', 'backward'] as const;

export function TrainingControls({ startTraining, stopTraining, resetEnvironment }: TrainingControlsProps) {
  const { t, i18n } = useTranslation();
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>{t('training.title')}</h3>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['fr', 'en'] as const).map((lng) => (
            <button
              key={lng}
              onClick={() => void i18n.changeLanguage(lng)}
              style={{
                fontWeight: i18n.language === lng ? 'bold' : 'normal',
                background: i18n.language === lng ? '#4a9eff' : undefined,
              }}
            >
              {t(`language.${lng}`)}
            </button>
          ))}
        </div>
      </div>
      <div>{t('training.episodes')} {episodeCount}</div>
      <div>{t('training.success', { success: successCount, total: episodeCount })}</div>
      <div>{t('training.difficulty', { level: difficulty + 1 })}</div>
      <div>{t('training.time', { seconds: episodeTime.toFixed(1) })}</div>
      <div>
        {t('training.lastAction', {
          action: lastAction !== -1 ? t(`training.actions.${ACTION_KEYS[lastAction]}`) : t('training.actions.none')
        })}
      </div>
      <div>{t('training.reward')} {reward.toFixed(2)}</div>
      <div style={{ marginTop: '10px' }}>
        {!isTraining ? (
          <button onClick={startTraining}>{t('training.start')}</button>
        ) : (
          <button onClick={stopTraining}>{t('training.stop')}</button>
        )}
        <button onClick={resetEnvironment} style={{ marginLeft: '10px' }}>{t('training.reset')}</button>
      </div>
    </div>
  );
}
