export interface GDPState {
    heavy: number;
    light: number;
    agri: number;
  }
  
  export interface GameState {
    year: number;
    gdp: GDPState;
    selectedGoal: 'industrial' | 'agricultural' | null;
    rocketProgramStarted: boolean;
    rocketLaunched: boolean;
    modifiers: {
      heavyEfficiency: number;
      agriEfficiency: number;
      heavyBonus: number;
      stability: number;
    };
    flags: {
      greatLeap: boolean;
      sovietSplit: boolean;
    };
    gameOver: boolean;
    phase: 'setup' | 'playing' | 'report' | 'summary';
    reportData?: {
        year: number;
        rates: GDPState;
        event?: GameEvent;
    };
  }
  
  export interface GameEvent {
    title: string;
    desc: string;
    yesText: string;
    noText: string;
    effect: (state: GameState) => Partial<GameState>;
    resultText: string;
  }
  
  export const INITIAL_STATE: GDPState = { heavy: 100, light: 150, agri: 750 };