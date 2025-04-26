import { create } from 'zustand'

// Dimensions de l'arène
const ARENA_SIZE = 40
const SAFE_ZONE = 5 // Zone de sécurité pour éviter que la cible soit trop près des bords

// Fonction pour générer une position aléatoire dans l'arène
function generateRandomPosition(): [number, number, number] {
  // Générer des coordonnées aléatoires dans l'arène
  const x = (Math.random() * (ARENA_SIZE - 2 * SAFE_ZONE)) - (ARENA_SIZE / 2 - SAFE_ZONE)
  const z = (Math.random() * (ARENA_SIZE - 2 * SAFE_ZONE)) - (ARENA_SIZE / 2 - SAFE_ZONE)
  
  // La hauteur est fixe pour que la cible soit au-dessus du sol
  return [x, 1.5, z]
}

interface TargetState {
  position: [number, number, number];
  collected: boolean;
  resetTarget: () => void;
  collectTarget: () => void;
}

export const useTargetStore = create<TargetState>((set) => ({
  position: generateRandomPosition(),
  collected: false,
  resetTarget: () => set({ position: generateRandomPosition(), collected: false }),
  collectTarget: () => {
    set({ collected: true })
    // Après un court délai, régénérer une nouvelle cible à une position différente
    setTimeout(() => {
      set({ position: generateRandomPosition(), collected: false })
    }, 1000)
  }
}))

// Exporter les constantes pour les utiliser ailleurs
export { ARENA_SIZE, SAFE_ZONE }
