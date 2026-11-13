import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import PpoReplayApp from './ppo/PpoReplayApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PpoReplayApp />
  </StrictMode>,
);
