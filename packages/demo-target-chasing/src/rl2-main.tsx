import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Rl2App from './rl2/Rl2App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Rl2App />
  </StrictMode>,
);
