
import { BossType, EnemyType, TurretType, WeaponStats, WeaponType, BiomeType, DefenseUpgradeType, ModuleType } from "./types";

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
  grenadeRadius: 150,
  grenadeDamage: 500,
  maxGrenades: 3,
  initialScore: 300, // Initial Scraps
};

export const DEFENSE_UPGRADE_INFO = {
    [DefenseUpgradeType.INFECTION_DISPOSAL]: {
        cost: 3500,
        armorMitigation: 0.9, // 90%
        regenRate: 10 / 60
    },
    [DefenseUpgradeType.SPORE_BARRIER]: {
        cost: 2700,
        maxArmorBonus: 100 // Adds 100 to make it 200
    },
    [DefenseUpgradeType.IMPACT_PLATE]: {
        cost: 3100,
        meleeReduction: 0.2 // 20%
    }
};

export const MODULE_STATS = {
    [ModuleType.GEL_BARREL]: {
        name: "Gel Penetration Diffuser",
        cost: 1900,
        desc: "Damage +40%",
        exclude: [WeaponType.FLAMETHROWER, WeaponType.GRENADE_LAUNCHER, WeaponType.PULSE_RIFLE, 'GRENADE']
    },
    [ModuleType.MAG_FEED]: {
        name: "Efficient Stack Feed",
        cost: 1700,
        desc: "Mag Capacity +100%",
        exclude: [WeaponType.FLAMETHROWER, WeaponType.GRENADE_LAUNCHER, WeaponType.PULSE_RIFLE, 'GRENADE']
    },
    [ModuleType.MICRO_RUPTURER]: {
        name: "Micro-Vibration Rupturer",
        cost: 2100,
        desc: "Damage +60%",
        only: [WeaponType.SR, WeaponType.GRENADE_LAUNCHER, WeaponType.PULSE_RIFLE, 'GRENADE']
    },
    [ModuleType.PRESSURIZED_BOLT]: {
        name: "Pressurized Bolt",
        cost: 2300,
        desc: "+10% Fire Rate per shot (Stacks)",
        only: [WeaponType.AR, WeaponType.FLAMETHROWER, WeaponType.PULSE_RIFLE]
    }
};

export const MAX_SAVE_SLOTS = 7;
export const MAX_PINNED_SLOTS = 3;

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

export const BIOME_STYLES: Record<BiomeType, {
    name: string;
    planetColor: string;
    groundColor: string;
    rockColor: string;
    craterColor: string;
    dustColor: string;
    atmosphereColor: string;
}> = {
    [BiomeType.BARREN]: {
        name: "Barren Moon",
        planetColor: "#94a3b8", // slate-400
        groundColor: "#111827", // gray-900
        rockColor: "#4B5563", // gray-600
        craterColor: "#1F2937", // gray-800
        dustColor: "#9CA3AF", // gray-400
        atmosphereColor: "rgba(0,0,0,0)" 
    },
    [BiomeType.ICE]: {
        name: "Cryo World",
        planetColor: "#38bdf8", // sky-400
        groundColor: "#162a36", // dark blueish
        rockColor: "#7dd3fc", // sky-300
        craterColor: "#0c4a6e", // sky-900
        dustColor: "#bae6fd", // sky-200
        atmosphereColor: "rgba(186, 230, 253, 0.05)" // slight cyan tint
    },
    [BiomeType.VOLCANIC]: {
        name: "Molten Core",
        planetColor: "#ef4444", // red-500
        groundColor: "#1a0505", // very dark red
        rockColor: "#7f1d1d", // red-900
        craterColor: "#450a0a", // red-950
        dustColor: "#f87171", // red-400
        atmosphereColor: "rgba(239, 68, 68, 0.05)" // slight red tint
    },
    [BiomeType.DESERT]: {
        name: "Arid Wastes",
        planetColor: "#f59e0b", // amber-500
        groundColor: "#271b0a", // dark amber/brown
        rockColor: "#92400e", // amber-800
        craterColor: "#451a03", // amber-950
        dustColor: "#fcd34d", // amber-300
        atmosphereColor: "rgba(245, 158, 11, 0.05)" // slight amber tint
    },
    [BiomeType.TOXIC]: {
        name: "Xeno Swamp",
        planetColor: "#10b981", // emerald-500
        groundColor: "#031c12", // dark emerald
        rockColor: "#065f46", // emerald-800
        craterColor: "#064e3b", // emerald-900
        dustColor: "#6ee7b7", // emerald-300
        atmosphereColor: "rgba(16, 185, 129, 0.05)" // slight green tint
    }
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
        TAB_MEMORY: "MEMORY",
        TAB_PLANET: "PLANET INFO",
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
        
        // Planet Info
        PLANET_ANALYSIS: "PLANETARY ANALYSIS",
        SECTOR_NAME: "SECTOR DESIGNATION",
        ATMOSPHERE_TYPE: "ATMOSPHERE CLASS",
        GENE_MODIFIER: "GENE STRENGTH MODIFIER",
        SECTOR_WAVES: "SECTOR DURATION (WAVES)",
        
        // Memory
        SAVE_STATE: "SAVE CURRENT STATE",
        MEMORY_STORAGE: "CRYO-MEMORY STORAGE",
        EXTRACTABLE_MEMORIES: "EXTRACTABLE CRYO-MEMORIES",
        PINNED: "PINNED",
        PIN: "PIN",
        UNPIN: "UNPIN",
        LOAD: "EXTRACT",
        DELETE: "PURGE",
        EMPTY_SLOT: "EMPTY SLOT",
        SAVE_SUCCESS: "STATE ARCHIVED SUCCESSFULLY",
        
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
        ACTIVE_SYSTEMS: "ACTIVE SYSTEMS",
        GRENADE: "GRENADE",
        LOADOUT_HEADER: "ACTIVE LOADOUT",
        LOADOUT_HINT: "Click weapon to assemble modules. Drag to equip.",
        BACKPACK_HEADER: "BACKPACK STORAGE",
        CLOSE_BACKPACK: "PRESS [C] TO CLOSE BACKPACK",
        SLOT_SIDEARM: "(Sidearm)",
        SLOT_MAIN: "(Main)",
        SLOT: "SLOT",
        ASSEMBLY_TITLE: "WEAPON ASSEMBLY",
        MODULES_STORAGE: "AVAILABLE MODULES",

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
        TAB_DEFENSE: "DEFENSE",
        TAB_MODULES: "MODULES",
        CLOSE_DEPOT: "CLOSE DEPOT",

        // Upgrades
        UPGRADE_INFECTION: "Rapid Filtration System",
        UPGRADE_INFECTION_DESC: "Armor mitigation +10%. Regen rate increased.",
        UPGRADE_SPORE: "Spore Barrier Coating",
        UPGRADE_SPORE_DESC: "Max Armor capacity increased to 200.",
        UPGRADE_IMPACT: "Kinetic Redistribution Plate",
        UPGRADE_IMPACT_DESC: "Reduces incoming melee damage by 20%.",
        OWNED: "OWNED"
    },
    CN: {
        // Pause
        PAUSE_TITLE: "战术终端_V1.0",
        SYSTEM_PAUSED: "系统暂停",
        TAB_DATA: "数据",
        TAB_CONFIG: "设置",
        TAB_NOTES: "笔记",
        TAB_DATABASE: "图鉴",
        TAB_MEMORY: "记忆冷藏",
        TAB_PLANET: "星球信息",
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
        
        // Planet Info
        PLANET_ANALYSIS: "行星分析",
        SECTOR_NAME: "扇区代号",
        ATMOSPHERE_TYPE: "大气类型",
        GENE_MODIFIER: "基因强度修正",
        SECTOR_WAVES: "扇区持续时间 (波数)",

        // Memory
        SAVE_STATE: "存档当前状态",
        MEMORY_STORAGE: "记忆冷藏库",
        EXTRACTABLE_MEMORIES: "可提取的冷藏记忆",
        PINNED: "已置顶",
        PIN: "置顶",
        UNPIN: "取消置顶",
        LOAD: "提取",
        DELETE: "删除",
        EMPTY_SLOT: "空槽位",
        SAVE_SUCCESS: "状态归档成功",

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
        ACTIVE_SYSTEMS: "激活系统",
        GRENADE: "手雷",
        LOADOUT_HEADER: "当前装备",
        LOADOUT_HINT: "点击武器进行模块装配。拖拽装备。",
        BACKPACK_HEADER: "背包储物",
        CLOSE_BACKPACK: "按 [C] 关闭背包",
        SLOT_SIDEARM: "(副武器)",
        SLOT_MAIN: "(主武器)",
        SLOT: "插槽",
        ASSEMBLY_TITLE: "武器装配台",
        MODULES_STORAGE: "可用模块",

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
        TAB_DEFENSE: "防御升级",
        TAB_MODULES: "强化模块",
        CLOSE_DEPOT: "关闭补给站",

        // Upgrades
        UPGRADE_INFECTION: "感染液快速排散结构",
        UPGRADE_INFECTION_DESC: "护甲伤害阻挡率提升至90%，脱战回复速度提升至每秒10点。",
        UPGRADE_SPORE: "腐蚀性孢子阻隔层",
        UPGRADE_SPORE_DESC: "护甲上限提升至200点。",
        UPGRADE_IMPACT: "重压冲击再分布背板",
        UPGRADE_IMPACT_DESC: "受到的所有近战类伤害降低20% (计算护甲前)。",
        OWNED: "已拥有"
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
