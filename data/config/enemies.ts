
import { EnemyType, BossType, EnemyStatsConfig } from "../../types";

export const ENEMY_STATS: Record<EnemyType, EnemyStatsConfig> = {
  [EnemyType.GRUNT]: { 
      hp: 100, speed: 0.96, damage: 10, scoreReward: 10, radius: 15, color: '#F87171',
      detectionRange: 400 // Short sighted
  },
  [EnemyType.RUSHER]: { 
      hp: 300, speed: 1.68, damage: 15, scoreReward: 20, radius: 12, color: '#FCD34D',
      detectionRange: 600 // High alertness
  },
  [EnemyType.TANK]: { 
      hp: 1500, speed: 0.48, damage: 30, scoreReward: 50, radius: 25, color: '#1F2937',
      detectionRange: 500
  },
  [EnemyType.KAMIKAZE]: { 
      hp: 50, speed: 2.4, damage: 200, scoreReward: 15, radius: 10, color: '#A855F7',
      detectionRange: 500
  },
  [EnemyType.VIPER]: { 
      hp: 150, speed: 0.72, damage: 40, scoreReward: 30, radius: 18, color: '#10B981', 
      attackRate: 2000, range: 450,
      detectionRange: 800 // Hunter behavior
  },
  [EnemyType.PUSTULE]: { 
      hp: 3000, speed: 0, damage: 30, scoreReward: 1000, radius: 40, color: '#a3e635', 
      detectionRange: 0 // Passive until touch
  },
};

export const BOSS_STATS: Record<BossType, EnemyStatsConfig> = {
    [BossType.RED_SUMMONER]: {
        hp: 10000, damage: 50, speed: 1.12, scoreReward: 1000, radius: 40, color: '#7f1d1d',
        summonRate: 2000,
        detectionRange: 1000
    },
    [BossType.BLUE_BURST]: {
        hp: 8000, damage: 30, speed: 0.96, scoreReward: 1000, radius: 35, color: '#1e3a8a',
        fireRate: 1200, burstDelay: 100,
        detectionRange: 1200
    },
    [BossType.PURPLE_ACID]: {
        hp: 12000, damage: 40, speed: 1.04, scoreReward: 1000, radius: 45, color: '#581c87',
        fireRate: 4000, projectileDamage: 60,
        detectionRange: 1000
    },
    [BossType.HIVE_MOTHER]: {
        hp: 20000, damage: 60, speed: 0, scoreReward: 5000, radius: 60, color: '#ef4444',
        detectionRange: 2000
    }
};

export const BESTIARY_DB: Record<string, { codeName: string, classification: string, danger: number, description: string }> = {
    [EnemyType.GRUNT]: {
        codeName: "GRUNT",
        classification: "SWARM INFANTRY",
        danger: 1,
        description: "Standard biological drone. Exhibits rudimentary intelligence. Relies on overwhelming numbers to breach defenses. Vulnerable to small arms fire."
    },
    [EnemyType.RUSHER]: {
        codeName: "RUSHER",
        classification: "RAPID ASSAULT",
        danger: 2,
        description: "Fast-moving agile variant evolved for closing distance. Notable orange carapace and scythe-like appendages. Prioritize elimination before they reach melee range."
    },
    [EnemyType.TANK]: {
        codeName: "TANK",
        classification: "HEAVY ARMOR",
        danger: 4,
        description: "Heavily plated bio-form resembling a terrestrial beetle. Extremely resilient to kinetic impacts. Slow movement speed allows for kiting tactics."
    },
    [EnemyType.KAMIKAZE]: {
        codeName: "KAMIKAZE",
        classification: "VOLATILE",
        danger: 5,
        description: "Unstable mutation carrying a payload of volatile acid. Self-destructs upon proximity. Glowing purple sac indicates critical mass. Maintain safe distance."
    },
    [EnemyType.VIPER]: {
        codeName: "VIPER",
        classification: "RANGED SUPPORT",
        danger: 3,
        description: "Aerial unit capable of launching corrosive projectiles. Maintains distance while bombarding targets. Green bio-luminescence marks attack vectors."
    },
    [EnemyType.PUSTULE]: {
        codeName: "NONGBAO",
        classification: "BIO-NODE",
        danger: 6,
        description: "A stationary organic growth that acts as a forward spawning point for the swarm. Heavily armored and dangerous to touch. Destroy immediately to prevent reinforcement floods."
    },
    [BossType.RED_SUMMONER]: {
        codeName: "THE HIVE LORD",
        classification: "APEX SPAWNER",
        danger: 9,
        description: "Massive biological anchor. Possesses a gestation sac capable of rapidly birthing Grunt drones. Must be destroyed to halt the swarm expansion."
    },
    [BossType.BLUE_BURST]: {
        codeName: "COBALT REAPER",
        classification: "APEX ARTILLERY",
        danger: 9,
        description: "Highly evolved ranged specialist. Fires bursts of high-velocity plasma spines. Plated in dense blue chitin. Prioritize cover during its burst cycle."
    },
    [BossType.PURPLE_ACID]: {
        codeName: "PLAGUE BRINGER",
        classification: "APEX TOXIN",
        danger: 10,
        description: "Walking bio-hazard. Lobs organic mortars that create persistent zones of denial. The purple acid melts durasteel in seconds. Avoid area of effect."
    },
    [BossType.HIVE_MOTHER]: {
        codeName: "MATRIARCH",
        classification: "HIVE CORE",
        danger: 10,
        description: "The central nervous system of the planetary infestation. This massive, stationary bio-structure coordinates all local swarm activities. It is heavily armored and protected by a rapidly regenerating chitinous shell. Destroying it will sever the connection to the hive mind in this sector."
    }
};
