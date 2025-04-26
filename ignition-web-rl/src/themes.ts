// Définition des types pour notre système de thèmes
export interface MaterialProps {
  color: string;
  metalness: number;
  roughness: number;
  emissive?: string;
  emissiveIntensity?: number;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  floor: string;
  gridCell: string;
  gridSection: string;
}

export interface ThemeProps {
  name: string;
  colors: ThemeColors;
  materials: {
    wall: MaterialProps;
    obstacle: MaterialProps;
    agent: MaterialProps;
    floor: MaterialProps;
    target: MaterialProps;
  };
  logo: {
    startColor: string;
    endColor: string;
    materialProps: MaterialProps;
  };
  lighting: {
    ambient: {
      intensity: number;
    };
    directional: {
      intensity: number;
      position: [number, number, number];
    };
    spot: {
      intensity: number;
      color: string;
      angle: number;
      penumbra: number;
      distance: number;
    };
  };
  grid: {
    cellSize: number;
    cellThickness: number;
    sectionSize: number;
    sectionThickness: number;
    fadeStrength: number;
  };
}

// Thème futuriste (celui que vous utilisez actuellement)
export const FuturisticTheme: ThemeProps = {
  name: "Futuristic",
  colors: {
    primary: "#0c8cbf",
    secondary: "#a5f3fc",
    accent: "#3f4e8d",
    background: "#171720",
    floor: "#171730",
    gridCell: "#3f4e8d",
    gridSection: "#0c8cbf"
  },
  materials: {
    wall: {
      color: "#0c8cbf",
      metalness: 0.6,
      roughness: 0.2
    },
    obstacle: {
      color: "#a5f3fc",
      metalness: 0.8,
      roughness: 0.1,
      emissive: "#a5f3fc",
      emissiveIntensity: 0.2
    },
    agent: {
      color: "#0c8cbf",
      metalness: 0.7,
      roughness: 0.2,
      emissive: "#0c8cbf",
      emissiveIntensity: 0.3
    },
    floor: {
      color: "#171730",
      metalness: 0.8,
      roughness: 0.2
    },
    target: {
      color: "#ff9d00",
      metalness: 0.9,
      roughness: 0.1,
      emissive: "#ff9d00",
      emissiveIntensity: 0.8
    }
  },
  logo: {
    startColor: "#a5f3fc",
    endColor: "#0c8cbf",
    materialProps: {
      color: "#ffffff",
      metalness: 0.8,
      roughness: 0.1,
      emissive: "#0c8cbf",
      emissiveIntensity: 0.5
    }
  },
  lighting: {
    ambient: {
      intensity: 0.3
    },
    directional: {
      intensity: 1.5,
      position: [10, 10, 5]
    },
    spot: {
      intensity: 1,
      color: "#0c8cbf",
      angle: 0.6,
      penumbra: 0.5,
      distance: 50
    }
  },
  grid: {
    cellSize: 2,
    cellThickness: 0.6,
    sectionSize: 10,
    sectionThickness: 1.5,
    fadeStrength: 1
  }
};

// Thème antique
export const AncientTheme: ThemeProps = {
  name: "Ancient",
  colors: {
    primary: "#8d6e63",
    secondary: "#d7ccc8",
    accent: "#a1887f",
    background: "#3e2723",
    floor: "#4e342e",
    gridCell: "#8d6e63",
    gridSection: "#6d4c41"
  },
  materials: {
    wall: {
      color: "#8d6e63",
      metalness: 0.1,
      roughness: 0.8
    },
    obstacle: {
      color: "#a1887f",
      metalness: 0.2,
      roughness: 0.7,
      emissive: "#d7ccc8",
      emissiveIntensity: 0.1
    },
    agent: {
      color: "#d7ccc8",
      metalness: 0.3,
      roughness: 0.6,
      emissive: "#d7ccc8",
      emissiveIntensity: 0.2
    },
    floor: {
      color: "#4e342e",
      metalness: 0.2,
      roughness: 0.8
    },
    target: {
      color: "#ffd54f",
      metalness: 0.4,
      roughness: 0.5,
      emissive: "#ffd54f",
      emissiveIntensity: 0.6
    }
  },
  logo: {
    startColor: "#d7ccc8",
    endColor: "#8d6e63",
    materialProps: {
      color: "#ffffff",
      metalness: 0.3,
      roughness: 0.7,
      emissive: "#d7ccc8",
      emissiveIntensity: 0.3
    }
  },
  lighting: {
    ambient: {
      intensity: 0.5
    },
    directional: {
      intensity: 1.2,
      position: [10, 10, 5]
    },
    spot: {
      intensity: 0.8,
      color: "#ffcc80",
      angle: 0.7,
      penumbra: 0.6,
      distance: 40
    }
  },
  grid: {
    cellSize: 2,
    cellThickness: 0.4,
    sectionSize: 10,
    sectionThickness: 1.2,
    fadeStrength: 0.8
  }
};

// Thème naturel
export const NatureTheme: ThemeProps = {
  name: "Nature",
  colors: {
    primary: "#388e3c",
    secondary: "#81c784",
    accent: "#1b5e20",
    background: "#1b3024",
    floor: "#2e7d32",
    gridCell: "#4caf50",
    gridSection: "#2e7d32"
  },
  materials: {
    wall: {
      color: "#388e3c",
      metalness: 0.1,
      roughness: 0.9
    },
    obstacle: {
      color: "#81c784",
      metalness: 0.1,
      roughness: 0.8,
      emissive: "#81c784",
      emissiveIntensity: 0.1
    },
    agent: {
      color: "#1b5e20",
      metalness: 0.2,
      roughness: 0.7,
      emissive: "#81c784",
      emissiveIntensity: 0.2
    },
    floor: {
      color: "#2e7d32",
      metalness: 0.1,
      roughness: 0.9
    },
    target: {
      color: "#8bc34a",
      metalness: 0.3,
      roughness: 0.6,
      emissive: "#8bc34a",
      emissiveIntensity: 0.5
    }
  },
  logo: {
    startColor: "#81c784",
    endColor: "#1b5e20",
    materialProps: {
      color: "#ffffff",
      metalness: 0.2,
      roughness: 0.8,
      emissive: "#81c784",
      emissiveIntensity: 0.3
    }
  },
  lighting: {
    ambient: {
      intensity: 0.6
    },
    directional: {
      intensity: 1.3,
      position: [10, 10, 5]
    },
    spot: {
      intensity: 0.7,
      color: "#aed581",
      angle: 0.8,
      penumbra: 0.7,
      distance: 45
    }
  },
  grid: {
    cellSize: 2,
    cellThickness: 0.5,
    sectionSize: 10,
    sectionThickness: 1.3,
    fadeStrength: 0.9
  }
};

// Thème par défaut (futuriste)
export const DefaultTheme = FuturisticTheme;

// Tous les thèmes disponibles
export const Themes = {
  Futuristic: FuturisticTheme,
  Ancient: AncientTheme,
  Nature: NatureTheme
};

// Type pour les noms de thèmes
export type ThemeName = keyof typeof Themes;
