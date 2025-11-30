





import { BossType, EnemyType, TurretType, WeaponStats, WeaponType } from "./types";

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 900;

// New World Dimensions (Long and Narrow)
export const WORLD_WIDTH = 1200;
export const WORLD_HEIGHT = 3200; 

export const BASE_STATS = {
  maxHp: 5000,
  width: 200,
  height: 100,
};

export const INVENTORY_SIZE = 30;

export const PLAYER_STATS = {
  maxHp: 200,
  maxArmor: 100,
  speed: 4, // Slightly faster for larger map
  armorRegenDelay: 5000,
  armorRegenRate: 6 / 60, // per frame (approx 60fps)
  hpRegenDelay: 10000,
  hpRegenRate: 0.5 / 60,
  grenadeDamage: 500,
  grenadeRadius: 150,
  maxGrenades: 3,
  initialScore: 300, // Initial Scraps
};

export const WEAPONS: Record<WeaponType, WeaponStats> = {
  [WeaponType.AR]: {
    name: 'Assault Rifle',
    damage: 45,
    fireRate: 100,
    spread: 0.1,
    magSize: 30,
    reloadTime: 1500,
    range: 600,
    projectileSpeed: 20,
  },
  [WeaponType.SG]: {
    name: 'Shotgun',
    damage: 35,
    pellets: 8,
    fireRate: 600,
    spread: 0.3,
    magSize: 8,
    reloadTime: 2000,
    range: 300,
    projectileSpeed: 18,
  },
  [WeaponType.SR]: {
    name: 'Sniper Rifle',
    damage: 400,
    fireRate: 1500,
    spread: 0.01,
    magSize: 5,
    reloadTime: 2500,
    range: 1200,
    projectileSpeed: 40,
  },
  [WeaponType.PISTOL]: {
    name: 'Pistol',
    damage: 60,
    fireRate: 300,
    spread: 0.05,
    magSize: 12,
    reloadTime: 1000,
    range: 500,
    projectileSpeed: 18,
  },
  [WeaponType.FLAMETHROWER]: {
    name: 'Flamethrower',
    damage: 15,
    fireRate: 40,
    spread: 0.15,
    magSize: 100,
    reloadTime: 3000,
    range: 350,
    projectileSpeed: 12,
    isPiercing: true
  },
  [WeaponType.PULSE_RIFLE]: {
    name: 'Pulse Rifle',
    damage: 35,
    fireRate: 80,
    spread: 0.02,
    magSize: 45,
    reloadTime: 1200,
    range: 700,
    projectileSpeed: 30,
    isPiercing: true
  },
  [WeaponType.GRENADE_LAUNCHER]: {
    name: 'Grenade Launcher',
    damage: 300, // Direct hit
    fireRate: 1200,
    spread: 0.1,
    magSize: 6,
    reloadTime: 3500,
    range: 600,
    projectileSpeed: 15,
    isExplosive: true
  }
};

export const INITIAL_AMMO = {
  [WeaponType.AR]: 300,
  [WeaponType.SG]: 60,
  [WeaponType.SR]: 50,
  [WeaponType.PISTOL]: Infinity,
  [WeaponType.FLAMETHROWER]: 400,
  [WeaponType.PULSE_RIFLE]: 200,
  [WeaponType.GRENADE_LAUNCHER]: 24,
};

export const ENEMY_STATS: Record<EnemyType, { hp: number; speed: number; damage: number; score: number; radius: number; color: string; attackRate?: number; range?: number }> = {
  [EnemyType.GRUNT]: { hp: 100, speed: 1.2, damage: 10, score: 10, radius: 15, color: '#F87171' }, // Red 400
  [EnemyType.RUSHER]: { hp: 300, speed: 2.1, damage: 15, score: 20, radius: 12, color: '#FCD34D' }, // Yellow 300
  [EnemyType.TANK]: { hp: 1500, speed: 0.6, damage: 30, score: 50, radius: 25, color: '#1F2937' }, // Gray 800
  [EnemyType.KAMIKAZE]: { hp: 50, speed: 3.0, damage: 200, score: 15, radius: 10, color: '#A855F7' }, // Purple 500
  [EnemyType.VIPER]: { hp: 150, speed: 0.9, damage: 40, score: 30, radius: 18, color: '#10B981', attackRate: 2000, range: 450 }, // Green 500
};

export const BOSS_STATS = {
    [BossType.RED_SUMMONER]: {
        hp: 10000,
        damage: 50,
        speed: 1.4,
        score: 1000,
        radius: 40,
        color: '#7f1d1d', // Dark Red
        summonRate: 2000, // 2s
    },
    [BossType.BLUE_BURST]: {
        hp: 8000,
        damage: 30,
        speed: 1.2,
        score: 1000,
        radius: 35,
        color: '#1e3a8a', // Dark Blue
        fireRate: 1200, // 1.2s
        burstDelay: 100, // 100ms between shots in burst
    },
    [BossType.PURPLE_ACID]: {
        hp: 12000,
        damage: 40,
        speed: 1.3,
        score: 1000,
        radius: 45,
        color: '#581c87', // Dark Purple
        fireRate: 4000, // 4s
        projectileDamage: 60,
    }
};

export const TOXIC_ZONE_STATS = {
    dps: 10, // 10 damage per second
    radius: 60,
    duration: 8000, // 8s
};

export const TURRET_COSTS = {
  baseCost: 1200,
  costIncrement: 100,
  upgrade_gauss: 3500,
  upgrade_sniper: 3700,
  upgrade_missile: 4100,
};

export const TURRET_STATS = {
  [TurretType.STANDARD]: { hp: 600, range: 400, damage: 60, fireRate: 120 },
  [TurretType.GAUSS]:    { hp: 800, range: 650, damage: 90, fireRate: 100 },
  [TurretType.SNIPER]:   { hp: 800, range: 1300, damage: 140, fireRate: 250 },
  [TurretType.MISSILE]:  { hp: 1000, range: 9999, damage: 160, fireRate: 840 }, // Global range, slower fire rate
};

export const ALLY_STATS = {
  hp: 200,
  speed: 1.8,
  damage: 20,
  range: 400,
  maxCount: 5,
};

export const SHOP_PRICES = {
  AR_AMMO: 50,
  SG_AMMO: 80,
  SR_AMMO: 100,
  GRENADE: 150,
  PULSE_AMMO: 60,
  FLAME_AMMO: 50,
  GL_AMMO: 120,
  WEAPON_PULSE: 1300,
  WEAPON_FLAME: 1900,
  WEAPON_GL: 2100,
};

export const TRANSLATIONS = {
    EN: {
        // Pause
        PAUSE_TITLE: "TACTICAL_TERMINAL_V1.0",
        SYSTEM_PAUSED: "SYSTEM_PAUSED",
        TAB_DATA: "DATA",
        TAB_CONFIG: "CONFIG",
        TAB_NOTES: "NOTES",
        TAB_DATABASE: "BESTIARY",
        TOTAL_DAMAGE: "Total Damage",
        SHOTS_FIRED: "Shots Fired",
        ACCURACY: "Accuracy",
        KILLS_ANALYSIS: "Confirmed Kills Analysis",
        VISUAL_SETTINGS: "VISUAL_INTERFACE_SETTINGS",
        HUD_OVERLAY: "HUD_OVERLAY",
        GORE: "GORE_RENDERER (Blood Stains)",
        DMG_TEXT: "DAMAGE_FLOATING_TEXT",
        LANGUAGE: "SYSTEM_LANGUAGE",
        RESUME_HINT: "PRESS [P] TO RESUME OPERATION",
        
        // Bestiary
        BESTIARY_LOCKED: "ENCRYPTED DATA",
        BESTIARY_HINT: "Target must be encountered in combat to decrypt classification.",
        DANGER_LEVEL: "THREAT LEVEL",
        CLASSIFICATION: "CLASS",

        // Backpack
        STATUS_HEADER: "OPERATIVE STATUS",
        HEALTH: "HEALTH",
        ARMOR: "ARMOR",
        SCRAPS: "SCRAPS",
        UTILITIES: "UTILITIES",
        GRENADE: "GRENADE",
        LOADOUT_HEADER: "ACTIVE LOADOUT",
        LOADOUT_HINT: "Drag weapons from backpack to slots to equip.",
        BACKPACK_HEADER: "BACKPACK STORAGE",
        CLOSE_BACKPACK: "PRESS [C] TO CLOSE BACKPACK",
        SLOT_SIDEARM: "(Sidearm)",
        SLOT_MAIN: "(Main)",
        SLOT: "SLOT",

        // Tactical Call
        UNIT_STATUS: "UNIT STATUS",
        NO_UNITS: "NO ACTIVE UNITS DETECTED",
        TOTAL_UNITS: "TOTAL UNITS",
        TACTICAL_COMMAND: "TACTICAL COMMAND",
        PRIORITY_OVERRIDE: "BROADCAST PRIORITY OVERRIDE",
        CMD_DEFEND: "DEFEND BASE",
        CMD_DEFEND_DESC: "UNITS PATROL PERIMETER",
        CMD_FOLLOW: "FOLLOW ME",
        CMD_FOLLOW_DESC: "UNITS ESCORT PLAYER",
        CMD_ASSAULT: "ASSAULT",
        CMD_ASSAULT_DESC: "UNITS PUSH FORWARD",
        CLOSE_CHANNEL: "PRESS [TAB] TO CLOSE CHANNEL",
        
        // Shop
        DEPOT_TITLE: "SUPPLY DEPOT",
        DEPOT_SUBTITLE: "Acquire ammunition and explosives.",
        FUNDS: "Available Funds",
        TAB_AMMO: "AMMUNITION",
        TAB_WEAPONS: "WEAPONRY",
        CLOSE_DEPOT: "CLOSE DEPOT",
    },
    CN: {
        // Pause
        PAUSE_TITLE: "战术终端_V1.0",
        SYSTEM_PAUSED: "系统暂停",
        TAB_DATA: "数据",
        TAB_CONFIG: "设置",
        TAB_NOTES: "笔记",
        TAB_DATABASE: "图鉴",
        TOTAL_DAMAGE: "总伤害",
        SHOTS_FIRED: "射击次数",
        ACCURACY: "命中率",
        KILLS_ANALYSIS: "击杀分析",
        VISUAL_SETTINGS: "视觉界面设置",
        HUD_OVERLAY: "HUD 界面显示",
        GORE: "血腥效果渲染",
        DMG_TEXT: "伤害数值浮动",
        LANGUAGE: "系统语言 (LANGUAGE)",
        RESUME_HINT: "按 [P] 继续行动",
        
        // Bestiary
        BESTIARY_LOCKED: "数据加密",
        BESTIARY_HINT: "需要在战斗中遭遇目标以解密数据。",
        DANGER_LEVEL: "威胁等级",
        CLASSIFICATION: "分类",

        // Backpack
        STATUS_HEADER: "干员状态",
        HEALTH: "生命值",
        ARMOR: "护甲值",
        SCRAPS: "残片",
        UTILITIES: "战术道具",
        GRENADE: "手雷",
        LOADOUT_HEADER: "当前装备",
        LOADOUT_HINT: "拖动背包武器至插槽装备。",
        BACKPACK_HEADER: "背包储物",
        CLOSE_BACKPACK: "按 [C] 关闭背包",
        SLOT_SIDEARM: "(副武器)",
        SLOT_MAIN: "(主武器)",
        SLOT: "插槽",

        // Tactical Call
        UNIT_STATUS: "单位状态",
        NO_UNITS: "未检测到活跃单位",
        TOTAL_UNITS: "单位总数",
        TACTICAL_COMMAND: "战术指挥",
        PRIORITY_OVERRIDE: "广播优先级覆盖",
        CMD_DEFEND: "基地防守",
        CMD_DEFEND_DESC: "单位在周边巡逻",
        CMD_FOLLOW: "跟随指令",
        CMD_FOLLOW_DESC: "单位护送玩家",
        CMD_ASSAULT: "全军突击",
        CMD_ASSAULT_DESC: "单位向前推进",
        CLOSE_CHANNEL: "按 [TAB] 关闭频道",

        // Shop
        DEPOT_TITLE: "补给站",
        DEPOT_SUBTITLE: "获取弹药与爆炸物。",
        FUNDS: "可用资金",
        TAB_AMMO: "弹药补给",
        TAB_WEAPONS: "武器库",
        CLOSE_DEPOT: "关闭补给站",
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
    }
};