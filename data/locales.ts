










export const TRANSLATIONS = {
    EN: {
        // ... (Keep existing keys for basic game elements)
        // General
        GAME_TITLE: "BASE",
        GAME_SUB: "TACTICAL SURVIVAL SIMULATION",
        SURVIVAL_MODE: "SURVIVAL",
        SURVIVAL_DESC: "Endless Waves // Simulation",
        EXPLORE_MODE: "EXPLORE",
        EXPLORE_DESC: "Campaign Mode // Deployment",
        
        // OS Interface
        OS_BOOT: "INITIALIZING VANGUARD KERNEL v44.2...",
        OS_CHECK_MEM: "CHECKING MEMORY INTEGRITY... [OK]",
        OS_MOUNT_FS: "MOUNTING FILE SYSTEM... [OK]",
        OS_EST_LINK: "ESTABLISHING NEURO-LINK... [OK]",
        OS_LOAD_MODS: "LOADING TACTICAL MODULES...",
        OS_AUTH: "AUTHENTICATING USER...",
        OS_ACCESS: "ACCESS GRANTED. WELCOME, COMMANDER.",
        OS_SHUTDOWN: "SYSTEM SHUTDOWN",
        OS_DESKTOP_ARCHIVES: "ARCHIVES",
        OS_DESKTOP_KERNEL: "KERNEL_DATA",
        OS_DESKTOP_OPS: "OPS_MANUAL.txt",
        OS_DESKTOP_NAV: "NAV_PROTOCOLS.doc",
        OS_WINDOW_CLOSE: "CLOSE",
        OS_TASKBAR_START: "START",
        OS_TASKBAR_TIME: "TIME",

        // OS Files - Basic Operations (OPS_MANUAL.txt)
        FILE_OPS_TITLE: "OPERATIONAL FIELD GUIDE",
        FILE_OPS_BODY: `
:: VANGUARD EXOSUIT CONTROL SCHEME ::

[MOVEMENT]
- W/A/S/D: Vector Thrusters.
- SPACE: Emergency Brake (Not Implemented in v1.0 Suit).

[COMBAT]
- MOUSE: Aiming Reticle (360°).
- LEFT CLICK: Primary Fire.
- RIGHT CLICK: Toggle Scope / Precision Aim.
- [R]: Reload Thermal Clip. DO NOT FORGET TO RELOAD.
- [G]: Deploy Fragmentation Grenade.
- [L]: Release Neuro-Lure (Accelerates Wave / Grants Bonus).

[LOGISTICS]
- [E]: Interact (Build Turret / Upgrade Turret).
- [B]: Open Supply Depot (Must be near Base).
- [C]: Open Backpack / Weapon Module Assembly.
- [TAB]: Open Tactical Command Interface (Ally Orders).

:: SURVIVAL TIPS ::
1. The Molecular Printer (Base) is your lifeline. If HP hits 0, the mission is scrubbed.
2. Scraps are harvested from neutralized threats. Use them to upgrade defenses.
3. Turrets are force multipliers. A Missile Turret (Level 2) has GLOBAL range.
        `,

        // OS Files - Navigation (NAV_PROTOCOLS.doc)
        FILE_NAV_TITLE: "INTERSTELLAR NAVIGATION & DEPLOYMENT",
        FILE_NAV_BODY: `
:: EXPLORATION MODE PROTOCOLS ::

[SECTOR MAPPING]
The Starmap displays potential resource worlds. Each planet has a unique 'Gene Strength' modifier and atmospheric composition.

[DEPLOYMENT COST]
Dropping the base from orbit requires energy, converted from Scraps. 
Cost Formula: Current Funds * (Landing Difficulty %).
High difficulty planets cost more to deploy but yield higher rewards.

[MISSION TYPES]
1. DEFENSE: Survive specific wave count. Victory requires 0 hostiles remaining.
2. OFFENSE (ASSAULT): Locate and destroy the Hive Mother. No waves. Time is irrelevant.

[RETREAT]
If the base is destroyed, Emergency Extraction pulls you back to the Colossus. You keep your inventory, but the mission is marked FAILED.
        `,

        // OS Folders - Archives (Lore)
        FOLDER_ARCHIVES_TITLE: "CLASSIFIED ARCHIVES",
        ARCHIVE_0_NAME: "history_01.txt",
        ARCHIVE_0_CONTENT: `
SUBJECT: THE SCOURGE ORIGIN
DATE: 2199.04.12
SOURCE: USG ISHIMURA-IV LOGS

The deep-space mining vessel USG Ishimura-IV returned from Sector 7G with a dormant spore sample. Upon exposure to oxygen-rich atmospheres, it mutated rapidly, bonding with organic matter to create 'The Scourge'. Within 5 years, Earth's population was reduced by 80%. The Scourge does not just kill; it repurposes biomass into combat-efficient forms. It is not a disease. It is a biological imperative.
        `,
        ARCHIVE_1_NAME: "vanguard_initiative.log",
        ARCHIVE_1_CONTENT: `
SUBJECT: PROJECT VANGUARD
CLEARANCE: COMMANDER

The remnants of humanity retreated to the Colossus-Class Heavy Cruisers—massive city-ships designed for deep space survival. You are part of the Vanguard initiative: a specialized force deployed to reclaim resource-rich worlds essential for the fleet's survival. We do not fight to win. We fight to eat. To breathe. To survive one more day.
        `,
        ARCHIVE_2_NAME: "molecular_printing.tech",
        ARCHIVE_2_CONTENT: `
SUBJECT: MOLECULAR PRINTING (SCRAPS)

The 'Base' you defend is a mobile Molecular Printer. It requires raw material ('Scraps') to fabricate ammunition and structures in real-time. Scraps are harvested from local geological features and, grimly, from the carbon remains of neutralized bio-forms. When you kill a Grunt, you are harvesting its carbon to print the bullet that kills the next one.
        `,
        ARCHIVE_3_NAME: "neuro_link_warning.med",
        ARCHIVE_3_CONTENT: `
WARNING: NEURO-LINK SIDE EFFECTS

Prolonged use of the V-Suit Neuro-Link can cause auditory hallucinations and 'phantom signal' detection. Vanguard Operatives are required to undergo psychological evaluation after every 3 deployments. If you hear voices from the Scourge, terminate the link immediately. The Hive Mind is psionic in nature. Do not listen to it.
        `,

        // OS Folders - Kernel (Deep Mechanics)
        FOLDER_KERNEL_TITLE: "SYSTEM KERNEL // DEEP DATA",
        KERNEL_0_NAME: "spawn_logic.js",
        KERNEL_0_CONTENT: `
// ENEMY SPAWN ALGORITHM
// Variable 'Wave' = Current Wave Number

function calculateEnemyCount(Wave) {
    let base = 12;
    let scaling = 5 * Wave;
    let frenzyMultiplier = isFrenzy ? 3 : 1;
    
    return (base + scaling) * frenzyMultiplier;
}

// NOTE: Enemies spawn every 500ms.
// High wave counts result in seamless streams of hostiles.
        `,
        KERNEL_1_NAME: "biological_scaling.sim",
        KERNEL_1_CONTENT: `
:: ATMOSPHERIC SCALING FACTORS ::

[OXYGEN (O2)]
Effect: Metabolic Overdrive
Formula: Enemy_HP = Base_HP * (1 + 1.2 * Oxygen_Percentage)
Target: Grunts, Rushers
Notes: High O2 planets produce bullet sponges. Bring high DPS.

[SULFUR (S)]
Effect: Volatile Chemistry
Formula: Viper_Damage = Base_Dmg * (1 + 0.1 * Sulfur_Index)
Formula: Kamikaze_HP = Base_HP * (1 + 0.1 * Sulfur_Index)
Notes: Sulfur stabilizes explosive compounds. Acid burns hotter.

[GENE STRENGTH]
Effect: Global Multiplier
Formula: Final_Stat = Calculated_Stat * Gene_Strength
Notes: A Gene Strength of 2.0 means everything is twice as strong.
        `,
        KERNEL_2_NAME: "armor_physics.dat",
        KERNEL_2_CONTENT: `
:: ABLATIVE ARMOR MECHANICS ::

Mitigation_Rate = 0.8 (80%)
Penetration_Rate = 0.2 (20%)

IF Player_Has_Armor > 0:
    Incoming_Damage = 100
    Armor_Takes = 80
    Health_Takes = 20
ELSE:
    Health_Takes = 100

REGENERATION:
- Armor: Begins 5 seconds after last hit. Rate: 1/sec.
- Health: Begins 10 seconds after last hit. Rate: 0.5/sec.
        `,
        KERNEL_3_NAME: "lure_economy.xls",
        KERNEL_3_CONTENT: `
:: LURE RISK/REWARD CALCULATION ::

Action: Press [L] to skip wave timer.
Condition: Must be >10s remaining.

Reward Formula:
Seconds_Skipped * Wave_Number = Bonus_Scraps

Example:
Skipping 20s on Wave 10
20 * 10 = 200 Scraps Bonus

Risk:
Immediate spawn of next wave. No downtime for reload or regen.
        `,

        // Old keys kept for compatibility or reused
        // ... (Keep existing keys for Shop, Bestiary, Messages, etc.) ...
        // Pause
        PAUSE_TITLE: "TACTICAL_TERMINAL_V1.0",
        SYSTEM_PAUSED: "SYSTEM_PAUSED",
        TAB_DATA: "DATA",
        TAB_CONFIG: "CONFIG",
        TAB_NOTES: "LOGS",
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
        
        // Notes / Field Manual Logs
        LOG_TITLE: "COMMANDER'S FIELD LOG",
        LOG_SUBTITLE: "VANGUARD OPERATIVE ARCHIVE",
        
        LOG_1_DATE: "2248.05.12",
        LOG_1_TITLE: "ARRIVAL: THE SCOURGE",
        LOG_1_CONTENT: "We dropped from the Colossus at 0600. The Mycelium Scourge has taken this sector completely. The air tastes of sulfur and ash. My mission is simple: Establish a beachhead, protect the Molecular Printer (The Base), and harvest enough biomass 'Scraps' to fabricate an extraction path. We are humanity's last hope. If the Base falls, the mission is scrubbed, and I'll be emergency extracted back to orbit.",

        LOG_2_DATE: "2248.05.13",
        LOG_2_TITLE: "COMBAT PROTOCOLS",
        LOG_2_CONTENT: "Refresher on V-Suit controls: [W/A/S/D] for movement. [1-4] to switch weapons instantly. The Shotgun (Slot 2) is vital for pushing back swarmers, while the Sniper (Slot 3) eliminates high-value targets. Remember to reload [R] manually during lulls in combat. Don't hoard Grenades; press [G] to clear crowds. If I survive long enough, my Armor will auto-repair after 5 seconds of avoiding damage.",

        LOG_3_DATE: "2248.05.14",
        LOG_3_TITLE: "THE LURE (RISK/REWARD)",
        LOG_3_CONTENT: "I've discovered a way to accelerate resource gathering. By pressing [L], I can release a synthetic pheromone 'Lure'. This enrages the swarm, causing the next wave to spawn IMMEDIATELY. Why do this? The Printer harvests airborne particulates from the frenzy. Skipping the timer grants a massive Scrap bonus. It's dangerous, but poverty kills faster than the aliens. Look for the flashing '>>' icon on the HUD.",

        LOG_4_DATE: "2248.05.16",
        LOG_4_TITLE: "BASE DEFENSE & ECONOMY",
        LOG_4_CONTENT: "I cannot be everywhere at once. I must use Scraps to build Automated Turrets at the glowing hardpoints by pressing [E]. A basic turret is weak, but upgrading it [E] to a Missile Launcher provides global range support. I can also access the Supply Depot by pressing [B] near the base to buy ammo or permanent suit upgrades. Check the Backpack [C] to install weapon modules found in the field.",

        LOG_5_DATE: "2248.05.20",
        LOG_5_TITLE: "THE HIVE MOTHER",
        LOG_5_CONTENT: "Intel suggests a Class-5 Bio-Structure: The Hive Mother. It doesn't move, but it controls the swarm. It has thick armor that regenerates based on atmospheric Oxygen. To kill it, I need to weather the storm until it sheds its carapace. That is the only window of opportunity. The 'Carapace Analyzer' ship module is mandatory for this fight.",

        // Planet Info & Map
        PLANET_ANALYSIS: "PLANETARY ANALYSIS",
        SECTOR_NAME: "SECTOR DESIGNATION",
        ATMOSPHERE_TYPE: "ATMOSPHERE CLASS",
        GENE_MODIFIER: "GENE STRENGTH MODIFIER",
        THREAT_LEVEL: "THREAT LEVEL",
        SECTOR_WAVES: "SECTOR DURATION (WAVES)",
        ATMOSPHERE_COMP: "ATMOSPHERIC COMPOSITION",
        LANDING_DIFFICULTY: "ORBITAL INSERTION DIFFICULTY",
        OFFENSE_TAG: "OFFENSE",
        CLEARED_TAG: "CLEARED",
        ASSAULT_OPS: "ASSAULT OPS",
        WAVES_SUFFIX: "WAVES",
        SULFUR_INDEX: "SULFUR INDEX",
        VIEW_ANALYSIS: "View Analysis",
        DROP_COST: "DROP COST",
        INITIATE_DROP: "INITIATE DROP",
        INSUFFICIENT_FUNDS: "INSUFFICIENT FUNDS",
        AVAILABLE_FUNDS: "Available Funds",
        HIGH: "HIGH",
        MEDIUM: "MEDIUM",
        LOW: "LOW",
        
        // Planet Detail Screen
        PLANETARY_SCAN: "PLANETARY SCAN COMPLETE",
        HAZARD_ASSESSMENT: "HAZARD ASSESSMENT",
        LAUNCH_WINDOW: "LAUNCH WINDOW",
        TACTICAL_ASSESSMENT: "TACTICAL ASSESSMENT",
        ATMOSPHERIC_BREAKDOWN: "ATMOSPHERIC BREAKDOWN",
        ESTIMATED_HOSTILES: "EST. HOSTILES",
        RESOURCE_DENSITY: "RESOURCE DENSITY",
        SCAN_ID: "SCAN ID",
        FULL_ANALYSIS_BTN: "FULL TACTICAL ANALYSIS",

        // Planet Construction
        PC_TITLE: "PLANETARY CONSTRUCTION",
        PC_SUB: "COLONIAL EXTRACTION SYSTEMS",
        PC_BTN: "PLANET CONSTRUCTION",
        PC_SLOTS_AVAILABLE: "CONSTRUCTION SLOTS",
        PC_BIOMASS: "BIOMASS EXTRACTOR",
        PC_OXYGEN: "OXYGEN SIPHON",
        PC_BIOMASS_DESC: "Harvests organic material from the ecosystem.",
        PC_OXYGEN_DESC: "Condenses atmospheric oxygen into fuel.",
        PC_YIELD: "YIELD",
        PC_BUILD: "CONSTRUCT",
        PC_PER_MISSION: "PER MISSION",
        PC_YIELD_MSG: "PLANETARY YIELDS: +{0} SCRAPS",
        PC_SLOT_LOCKED: "SLOT LOCKED",
        PC_SLOT_EMPTY: "EMPTY SLOT",

        // Galactic Events
        EVENT_EXPANSION_TITLE: "SCOURGE EXPANSION DETECTED",
        EVENT_EXPANSION_DESC: "The hive mind is reinforcing its hold on the sector. Unclaimed planets have mutated.",
        EVENT_EXPANSION_EFFECT: "All uncolonized planets: Gene Strength +0.1 - 0.3",
        EVENT_INVASION_TITLE: "COLONY INVASION ALERT",
        EVENT_INVASION_DESC: "A massive swarm has overrun one of your established colonies. Infrastructure critical.",
        EVENT_INVASION_EFFECT: "Colony Lost. Planet reverted to Hostile. Buildings Destroyed. Threat Level Increased.",
        EVENT_SALVAGE_TITLE: "COSMIC SALVAGE",
        EVENT_SALVAGE_DESC: "Sensors detected a derelict supply pod drifting in orbit.",
        EVENT_SALVAGE_EFFECT: "Resources Acquired: +{0} Scraps",
        ACKNOWLEDGE: "ACKNOWLEDGE",

        // Biomes
        BIOME_Barren: "Barren",
        BIOME_Ice: "Ice",
        BIOME_Volcanic: "Volcanic",
        BIOME_Desert: "Desert",
        BIOME_Toxic: "Toxic",
        BIOME_BARREN: "Barren",
        BIOME_ICE: "Ice",
        BIOME_VOLCANIC: "Volcanic",
        BIOME_DESERT: "Desert",
        BIOME_TOXIC: "Toxic",

        // Atmosphere Modal (Legacy/Reused)
        PLANET_ATMOS_ANALYSIS: "Planetary Atmosphere Analysis",
        SPECTROSCOPIC_DATA: "SPECTROSCOPIC DATA",
        ATMOS_DETAILS_PRE: "Full atmospheric breakdown of sector target",
        ATMOS_DETAILS_MID: ". Composition suggests",
        ATMOS_DETAILS_POST: "environmental conditions.",
        UPLINK_ESTABLISHED: "UPLINK ESTABLISHED",
        SECURE_CONNECTION: "SECURE CONNECTION",
        ATMOS_LABEL: "ATMOS",
        
        // Gases
        GAS_OXYGEN_NAME: "Oxygen",
        GAS_OXYGEN_DESC: "Essential for biological respiration. Influences local fauna metabolism.",
        GAS_NITROGEN_NAME: "Nitrogen",
        GAS_NITROGEN_DESC: "Inert gas. Standard atmospheric filler.",
        GAS_CO2_NAME: "Carbon Dioxide",
        GAS_CO2_DESC: "Greenhouse gas. Indicates heavy respiration or combustion.",
        GAS_ARGON_NAME: "Argon",
        GAS_ARGON_DESC: "Noble gas. Common in radioactive decay environments.",
        GAS_METHANE_NAME: "Methane",
        GAS_METHANE_DESC: "Highly flammable organic compound.",
        GAS_SULFUR_NAME: "Sulfur Dioxide",
        GAS_SULFUR_DESC: "Toxic volcanic byproduct.",
        GAS_HELIUM_NAME: "Helium",
        GAS_HELIUM_DESC: "Light noble gas.",

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

        // Bestiary Entries
        ENEMY_GRUNT_NAME: "GRUNT",
        ENEMY_GRUNT_CLASS: "SWARM INFANTRY",
        ENEMY_GRUNT_DESC: "Standard biological drone. Exhibits rudimentary intelligence. Relies on overwhelming numbers to breach defenses. Vulnerable to small arms fire.",
        ENEMY_RUSHER_NAME: "RUSHER",
        ENEMY_RUSHER_CLASS: "RAPID ASSAULT",
        ENEMY_RUSHER_DESC: "Fast-moving agile variant evolved for closing distance. Notable orange carapace and scythe-like appendages. Prioritize elimination before they reach melee range.",
        ENEMY_TANK_NAME: "TANK",
        ENEMY_TANK_CLASS: "HEAVY ARMOR",
        ENEMY_TANK_DESC: "Heavily plated bio-form resembling a terrestrial beetle. Extremely resilient to kinetic impacts. Slow movement speed allows for kiting tactics.",
        ENEMY_KAMIKAZE_NAME: "KAMIKAZE",
        ENEMY_KAMIKAZE_CLASS: "VOLATILE",
        ENEMY_KAMIKAZE_DESC: "Unstable mutation carrying a payload of volatile acid. Self-destructs upon proximity. Glowing purple sac indicates critical mass. Maintain safe distance.",
        ENEMY_VIPER_NAME: "VIPER",
        ENEMY_VIPER_CLASS: "RANGED SUPPORT",
        ENEMY_VIPER_DESC: "Aerial unit capable of launching corrosive projectiles. Maintains distance while bombarding targets. Green bio-luminescence marks attack vectors.",
        ENEMY_RED_SUMMONER_NAME: "THE HIVE LORD",
        ENEMY_RED_SUMMONER_CLASS: "APEX SPAWNER",
        ENEMY_RED_SUMMONER_DESC: "Massive biological anchor. Possesses a gestation sac capable of rapidly birthing Grunt drones. Must be destroyed to halt the swarm expansion.",
        ENEMY_BLUE_BURST_NAME: "COBALT REAPER",
        ENEMY_BLUE_BURST_CLASS: "APEX ARTILLERY",
        ENEMY_BLUE_BURST_DESC: "Highly evolved ranged specialist. Fires bursts of high-velocity plasma spines. Plated in dense blue chitin. Prioritize cover during its burst cycle.",
        ENEMY_PURPLE_ACID_NAME: "PLAGUE BRINGER",
        ENEMY_PURPLE_ACID_CLASS: "APEX TOXIN",
        ENEMY_PURPLE_ACID_DESC: "Walking bio-hazard. Lobs organic mortars that create persistent zones of denial. The purple acid melts durasteel in seconds. Avoid area of effect.",
        ENEMY_HIVE_MOTHER_NAME: "MATRIARCH",
        ENEMY_HIVE_MOTHER_CLASS: "HIVE CORE",
        ENEMY_HIVE_MOTHER_DESC: "The central nervous system of the planetary infestation. This massive, stationary bio-structure coordinates all local swarm activities. It is heavily armored and protected by a rapidly regenerating chitinous shell. Destroying it will sever the connection to the hive mind in this sector.",

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

        // Weapons
        WEAPON_AR_NAME: "Assault Rifle",
        WEAPON_SG_NAME: "Shotgun",
        WEAPON_SR_NAME: "Sniper Rifle",
        WEAPON_PISTOL_NAME: "Pistol",
        WEAPON_FLAMETHROWER_NAME: "Flamethrower",
        WEAPON_PULSE_RIFLE_NAME: "Pulse Rifle",
        WEAPON_GRENADE_LAUNCHER_NAME: "Grenade Launcher",
        WEAPON_GRENADE_NAME: "Frag Grenade", // For shop item

        // Ammo
        AMMO_AR_NAME: "Assault Rifle Ammo",
        AMMO_AR_DESC: "+60 Rnds",
        AMMO_SG_NAME: "Shotgun Shells",
        AMMO_SG_DESC: "+16 Shells",
        AMMO_SR_NAME: "Sniper Rounds",
        AMMO_SR_DESC: "+10 Rnds",
        AMMO_GRENADE_NAME: "Frag Grenade",
        AMMO_GRENADE_DESC: "+1 Unit",
        AMMO_PULSE_NAME: "Pulse Cells",
        AMMO_PULSE_DESC: "+90 Energy",
        AMMO_FLAME_NAME: "Napalm Tanks",
        AMMO_FLAME_DESC: "+200 Fuel",
        AMMO_GL_NAME: "40mm Grenades",
        AMMO_GL_DESC: "+12 Rnds",

        // Weapon Shop Descs
        WEAPON_PULSE_DESC: "Piercing Energy (10% Decay)",
        WEAPON_FLAME_DESC: "Incendiary",
        WEAPON_GL_DESC: "Heavy Explosive",

        // Weapon Modules
        MODULE_GEL_BARREL_NAME: "Gel Penetration Diffuser",
        MODULE_GEL_BARREL_DESC: "Damage +40%",
        MODULE_MAG_FEED_NAME: "Efficient Stack Feed",
        MODULE_MAG_FEED_DESC: "Mag Capacity +100%",
        MODULE_MICRO_RUPTURER_NAME: "Micro-Vibration Rupturer",
        MODULE_MICRO_RUPTURER_DESC: "Damage +60%",
        MODULE_PRESSURIZED_BOLT_NAME: "Pressurized Bolt",
        MODULE_PRESSURIZED_BOLT_DESC: "+10% Fire Rate per shot (Stacks)",
        
        // Module Compatibility
        COMPAT_ONLY: "ONLY: {0}",
        COMPAT_EXCLUDE: "EXCLUDES: {0}",
        COMPAT_ALL: "COMPATIBLE WITH ALL BALLISTIC WEAPONS",
        COMPAT_GRENADE: "GRENADES",

        // Spaceship
        SHIP_STATUS: "VESSEL STATUS",
        SHIP_CLASS: "Colossus Class",
        SHIP_TYPE: "HEAVY CRUISER",
        SHIP_MODULES: "INSTALLED MODULES",
        SHIP_AVAILABLE: "AVAILABLE UPGRADES",
        INSTALL: "INSTALL",
        INSTALLED: "INSTALLED",
        RETURN_SECTOR: "Return to Sector",
        STORAGE_ACCESS: "Storage Access",
        FRAGMENTS: "FRAGMENTS",
        SHIP_CLASS_NAME: "Colossus Class",
        SHIP_TYPE_NAME: "HEAVY CRUISER",
        VESSEL_ONLINE: "VESSEL STATUS: ONLINE",
        HULL_INTEGRITY: "HULL INTEGRITY",
        NO_MODULES: "No additional modules installed. System nominal.",
        SYSTEM_UPGRADE: "SYSTEM UPGRADE",
        XENO_MATRIX: "XENO-DATA MATRIX",
        ENGINEERING: "Engineering",
        MODULE_FAB: "MODULE FABRICATION",
        ALL_INSTALLED: "All available modules fabricated and installed.",
        NO_FUNDS: "NO FUNDS",
        RETURN_SECTOR_BTN: "Return to Sector",
        INSTALL_BTN: "INSTALL",
        CORE_DB: "CORE DATABASE",
        ACCESS_COMPUTER: "ACCESS TERMINAL",
        BASE_RESEARCH: "INFRASTRUCTURE RESEARCH",
        RESEARCH_BTN: "BASE RESEARCH",

        // Spaceship Modules
        SHIP_MOD_BASE_REINFORCEMENT_NAME: "Base Reinforcement Module",
        SHIP_MOD_BASE_REINFORCEMENT_DESC: "Deployed Base HP +3000",
        SHIP_MOD_CARAPACE_ANALYZER_NAME: "Xenobiology Carapace Analyzer",
        SHIP_MOD_CARAPACE_ANALYZER_DESC: "All Player Damage +20%",
        SHIP_MOD_ORBITAL_CANNON_NAME: "Orbital Long-Range Support",
        SHIP_MOD_ORBITAL_CANNON_DESC: "Strikes nearest enemy every 8s (400 Dmg)",
        SHIP_MOD_ATMOSPHERIC_DEFLECTOR_NAME: "Atmospheric Drag Adaptive Deflector",
        SHIP_MOD_ATMOSPHERIC_DEFLECTOR_DESC: "Orbital Drop Cost -50%",

        // Infrastructure Research
        INFRA_TITLE: "INFRASTRUCTURE",
        INFRA_SUB: "Research & Development",
        INFRA_ACQUIRED: "ACQUIRED TECH",
        INFRA_AVAILABLE: "AVAILABLE RESEARCH PROJECTS",
        INFRA_LOCKED_MSG: "RESEARCH PROTOCOLS LOCKED. MISSION SUCCESS REQUIRED FOR NEXT CYCLE.",
        INFRA_MAXED_MSG: "MAXIMUM RESEARCH CAPACITY REACHED.",
        INFRA_SELECT_BTN: "INITIATE RESEARCH",
        INFRA_COST: "COST",
        INFRA_BASE_HP_DESC: "Base Hull Integrity +{0}",
        INFRA_TURRET_HP_DESC: "Automated Turret Armor +{0}",
        INFRA_TURRET_L1_DMG_DESC: "Standard Turret Damage +{0}%",
        INFRA_TURRET_GAUSS_RATE_DESC: "Gauss Cannon Fire Rate +{0}%",
        INFRA_TURRET_SNIPER_RANGE_DESC: "Sniper Turret Range +{0}%",
        INFRA_TURRET_MISSILE_DMG_DESC: "Missile Warhead Yield +{0}%",
        INFRA_GLOBAL_TURRET_DMG_DESC: "Global Defense Damage +{0}%",
        INFRA_GLOBAL_TURRET_RATE_DESC: "Global Defense Fire Rate +{0}%",
        INFRA_TURRET_L1_COST_DESC: "Standard Turret Cost -{0}%",

        // Orbital
        ORBITAL_TITLE: "Orbital Matrix",
        CALIBRATION: "Calibration",
        ORBITAL_SUB: "Weapon System Optimization Tree",
        CURRENT_OUTPUT: "CURRENT OUTPUT",
        DMG_MULT: "DAMAGE MULTIPLIER",
        RATE_DIV: "FIRE RATE DIVISION",
        LAYER: "LAYER",
        UPGRADE_TYPE: "UPGRADE TYPE",
        KINETIC_AMP: "KINETIC AMPLIFICATION",
        CYCLING_SPD: "CYCLING SPEED",
        EFFECT: "EFFECT",
        COST: "COST",
        ACQUIRED: "ACQUIRED",
        HOVER_NODE: "HOVER OVER A NODE TO VIEW SCHEMATICS",

        // Carapace
        XENO_TITLE: "Xenobiology",
        ANALYSIS: "Analysis",
        WEAKNESS_MATRIX: "Weakness Identification Matrix",
        ROW_BONUS: "ROW {0} BONUS",
        ROW_BONUS_LABEL: "ROW BONUS",
        GLOBAL_DMG: "Global Damage",
        COL_BONUS_LABEL: "COL BONUS",
        COL_BONUS_ARMOR: "Armor",
        TARGET_SPECIES: "TARGET SPECIES",
        DMG_AMP: "DAMAGE AMPLIFICATION",
        ANALYSIS_COST: "ANALYSIS COST",
        COMPLETE_BTN: "COMPLETE",
        HOVER_DATA: "HOVER OVER A DATA NODE TO VIEW DETAILS",

        // Mission Success
        UPLINK_EST: "UPLINK ESTABLISHED",
        PROTOCOL_ZULU: "PROTOCOL 10-ZULU",
        SECTOR_PACIFIED: "SECTOR PACIFIED",
        MISSION_OBJ: "MISSION OBJECTIVES",
        COMPLETE: "COMPLETE",
        RESOURCES_SECURED: "RESOURCES SECURED",
        SCRAPS_TRANSFER: "MOLECULAR SCRAPS TRANSFER COMPLETE",
        HOSTILES_NEUTRALIZED: "HOSTILES NEUTRALIZED",
        BASE_INTEGRITY: "BASE INTEGRITY",
        SUCCESS_DESC: "All local resistance has been eliminated. The area is secure for automated mining drones. Prepare for orbital extraction and debriefing.",
        INITIATE_ASCENT: "INITIATE ASCENT",
        NET_SECURE: "VANGUARD NET // SECURE // 200 OK",

        // Extraction
        CRITICAL_FAILURE: "CRITICAL SYSTEM FAILURE",
        SIGNAL_LOST: "SIGNAL LOST",
        BASE_COMPROMISED: "BASE COMPROMISED",
        EMERGENCY_PROTO: "EMERGENCY PROTOCOL",
        EXECUTED: "EXECUTED",
        LOG_INTEGRITY: "Base structural integrity at 0%. Auto-destruct sequence initiated.",
        LOG_POD: "Commander Escape Pod launched. Trajectory: High Orbit.",
        LOG_DOCK: "Colossus docking successful. Operative recovered.",
        FAILURE_DESC: "The planetary beachhead has been lost. Resources gathered prior to destruction have been transmitted. The sector remains hostile. Re-group and select a new drop zone.",
        RETURN_BRIDGE: "RETURN TO BRIDGE",
        NO_SIGNAL: "NO SIGNAL // NO SIGNAL // NO SIGNAL",

        // Mission Failed
        MISSION_FAILED: "MISSION FAILED",
        REPORT_ID: "REPORT ID",
        FINAL_SCORE: "FINAL SCORE",
        RE_DEPLOY: "Re-Deploy",
        SAVE_INTEL: "Save Intel",

        // Turret
        GAUSS_NAME: "GAUSS CANNON",
        GAUSS_DESC: "High DPS, Rapid Fire",
        SNIPER_NAME: "RAILGUN SNIPER",
        SNIPER_DESC: "Extreme Range, High Damage",
        MISSILE_NAME: "HELLFIRE MISSILE",
        MISSILE_DESC: "Global Range, Homing, AoE",
        DMG: "DMG",
        RNG: "RNG",
        SPD: "SPD",
        GLOBAL: "GLOBAL",
        CANCEL_HINT: "PRESS [ESC] TO CANCEL",

        // Interact
        OPEN_DEPOT: "OPEN DEPOT [B]",
        UPGRADE_TURRET: "UPGRADE [E]",
        BUILD_TURRET: "BUILD TURRET [E]",

        // Main Menu
        IMPORT_DATA: "IMPORT DATA",
        NO_ARCHIVES: "NO DATA ARCHIVED",
        
        // HUD & Lure
        SKIP_WAVE: "DEPLOY LURE",

        // Upgrades
        UPGRADE_INFECTION: "Rapid Filtration System",
        UPGRADE_INFECTION_DESC: "Armor mitigation +10%. Regen rate increased.",
        UPGRADE_SPORE: "Spore Barrier Coating",
        UPGRADE_SPORE_DESC: "Max Armor capacity increased to 200.",
        UPGRADE_IMPACT: "Kinetic Redistribution Plate",
        UPGRADE_IMPACT_DESC: "Reduces incoming melee damage by 20%.",
        OWNED: "OWNED",

        // Messages
        WAVE_STARTED: "WAVE {0} STARTED",
        FRENZY_DETECTED: "WARNING: FRENZY DETECTED",
        BOSS_DETECTED: "WARNING: APEX LIFEFORM",
        ORBITAL_DROP_COST: "ORBITAL DROP COST: -{0} SCRAPS",
        DEFLECTOR_ACTIVE: "ADAPTIVE DEFLECTOR ACTIVE",
        MISSION_ASSAULT: "MISSION: ASSAULT HIVE MOTHER",
        LURE_REWARD: "LURE REWARD: +{0}",
        FINAL_WAVE: "FINAL WAVE ACCELERATED",
        LURE_PENDING: "LURE RECHARGE PENDING...",
        ORBITAL_STRIKE: "ORBITAL STRIKE: {0}",
        ROW_UNLOCKED: "ROW BONUS UNLOCKED: DAMAGE +{0}%",
        COL_UNLOCKED: "COL BONUS UNLOCKED: ARMOR +{0}",
        HIVE_MOTHER_SHED: "HIVE MOTHER SHEDDING CARAPACE",
        HIVE_MOTHER_KILL: "HIVE MOTHER ELIMINATED",
        DOMINANCE_BONUS: "DOMINANCE BONUS: +{0}",
        GAME_SAVED: "GAME SAVED",
        GAME_LOADED: "GAME LOADED",
        LOAD_FAIL: "LOAD FAILED: CORRUPT DATA",
        REINFORCEMENTS: "REINFORCEMENTS ARRIVED",
        FRENZY_BANNER: "WARNING: SWARM FRENZY DETECTED",
        BOSS_BANNER: "WARNING: HIGH CLASS BIO-SIGNATURE",
        VESSEL_STATUS: "VESSEL STATUS",
    },
    CN: {
        // ... (Keep existing keys)
        // General
        GAME_TITLE: "基地",
        GAME_SUB: "战术生存模拟",
        SURVIVAL_MODE: "生存模式",
        SURVIVAL_DESC: "无尽波次 // 模拟训练",
        EXPLORE_MODE: "探索模式",
        EXPLORE_DESC: "战役模式 // 实地部署",

        // OS Interface
        OS_BOOT: "正在初始化先锋操作系统...",
        OS_CHECK_MEM: "正在检查内存完整性... [OK]",
        OS_MOUNT_FS: "挂载文件系统... [OK]",
        OS_EST_LINK: "建立神经链接... [OK]",
        OS_LOAD_MODS: "加载战术模块...",
        OS_AUTH: "验证用户身份...",
        OS_ACCESS: "访问已授权。欢迎，指挥官。",
        OS_SHUTDOWN: "系统关闭",
        OS_DESKTOP_ARCHIVES: "机密档案",
        OS_DESKTOP_KERNEL: "核心数据",
        OS_DESKTOP_OPS: "基础操作指南.txt",
        OS_DESKTOP_NAV: "星际航行协议.doc",
        OS_WINDOW_CLOSE: "关闭",
        OS_TASKBAR_START: "开始",
        OS_TASKBAR_TIME: "时间",

        // OS Files - Basic Operations (OPS_MANUAL.txt)
        FILE_OPS_TITLE: "战地操作指南",
        FILE_OPS_BODY: `
:: 先锋外骨骼控制方案 ::

[移动]
- W/A/S/D: 矢量推进器。
- SPACE: 紧急制动 (V1.0 未实装)。

[战斗]
- 鼠标: 360° 瞄准准星。
- 左键: 主武器射击。
- 右键: 切换瞄准镜 / 精确瞄准。
- [R]: 装填热能弹夹。务必记得手动装填。
- [G]: 投掷破片手雷。
- [L]: 释放神经诱捕剂 (加速波次 / 获取奖励)。

[后勤]
- [E]: 交互 (建造炮塔 / 升级炮塔)。
- [B]: 打开补给站 (必须在基地附近)。
- [C]: 打开背包 / 武器模块装配。
- [TAB]: 打开战术指挥界面 (指挥友军)。

:: 生存提示 ::
1. 分子打印机（基地）是你的生命线。如果生命值归零，任务取消。
2. 残片是从被消灭的威胁中收集的。用它们来升级防御。
3. 炮塔是力量倍增器。导弹炮塔（2级）拥有全图射程。
        `,

        // OS Files - Navigation (NAV_PROTOCOLS.doc)
        FILE_NAV_TITLE: "星际航行与部署协议",
        FILE_NAV_BODY: `
:: 探索模式协议 ::

[扇区测绘]
星图显示了潜在的资源世界。每个行星都有独特的“基因强度”修正值和大气成分。

[部署成本]
从轨道投放基地需要能量，由残片转换而来。
成本公式：当前资金 * (投放难度 %)。
高难度行星的部署成本更高，但回报也更丰厚。

[任务类型]
1. 防御：在特定波次中生存。胜利条件是剩余 0 个敌对目标。
2. 进攻（突击）：定位并摧毁虫巢之母。没有波次限制。时间无关紧要。

[撤退]
如果基地被摧毁，紧急撤离程序会将你拉回巨像号。你保留库存，但任务标记为失败。
        `,

        // OS Folders - Archives (Lore)
        FOLDER_ARCHIVES_TITLE: "机密档案库",
        ARCHIVE_0_NAME: "history_01.txt",
        ARCHIVE_0_CONTENT: `
主题：天灾起源
日期：2199.04.12
来源：USG 伊石村四号 日志

深空采矿船 USG 伊石村四号从 7G 扇区带回了一个休眠的孢子样本。暴露在富氧大气中后，它迅速变异，与有机物质结合创造了“天灾”。5年内，地球人口减少了80%。天灾不仅仅是杀戮；它重塑生物质，将其转化为高效的战斗形式。它不是疾病。它是生物学上的绝对命令。
        `,
        ARCHIVE_1_NAME: "vanguard_initiative.log",
        ARCHIVE_1_CONTENT: `
主题：先锋计划
权限：指挥官

人类的残余撤退到了巨像级重型巡洋舰上——这些巨大的城市舰船专为深空生存而设计。你是先锋计划的一部分：一支专门的部队，被部署去收复舰队生存所必需的富资源世界。我们不是为了胜利而战。我们为了吃饭而战。为了呼吸而战。为了多活一天而战。
        `,
        ARCHIVE_2_NAME: "molecular_printing.tech",
        ARCHIVE_2_CONTENT: `
主题：分子打印技术 (残片)

你保卫的“基地”是一台移动式分子打印机。它需要原材料（“残片”）来实时制造弹药和结构。残片是从当地地质特征中收集的，或者残酷地说，是从被消灭的生物形态的碳基残留物中收集的。当你杀死一只工蜂时，你正在收集它的碳来打印杀死下一只工蜂的子弹。
        `,
        ARCHIVE_3_NAME: "neuro_link_warning.med",
        ARCHIVE_3_CONTENT: `
警告：神经链接副作用

长时间使用 V-Suit 神经链接会导致幻听和“幻影信号”检测。先锋干员需要在每次部署 3 次后接受心理评估。如果你听到来自天灾的声音，请立即终止链接。主脑本质上是灵能的。不要倾听它。
        `,

        // OS Folders - Kernel (Deep Mechanics)
        FOLDER_KERNEL_TITLE: "系统内核 // 深度数据",
        KERNEL_0_NAME: "spawn_logic.js",
        KERNEL_0_CONTENT: `
// 敌人生成算法
// 变量 'Wave' = 当前波次

function calculateEnemyCount(Wave) {
    let base = 12;
    let scaling = 5 * Wave;
    let frenzyMultiplier = isFrenzy ? 3 : 1;
    
    return (base + scaling) * frenzyMultiplier;
}

// 注意：敌人每 500ms 生成一次。
// 高波次会导致无缝的敌对流。
        `,
        KERNEL_1_NAME: "biological_scaling.sim",
        KERNEL_1_CONTENT: `
:: 大气缩放因子 ::

[氧气 (O2)]
效果：代谢过载
公式：敌人生命值 = 基础生命值 * (1 + 1.2 * 氧气百分比)
目标：工蜂，突击兽
备注：高氧行星会产生“子弹海绵”。携带高 DPS 武器。

[硫磺 (S)]
效果：挥发性化学反应
公式：毒蛇伤害 = 基础伤害 * (1 + 0.1 * 硫磺指数)
公式：自爆者生命值 = 基础生命值 * (1 + 0.1 * 硫磺指数)
备注：硫磺稳定了爆炸性化合物。酸液燃烧得更猛烈。

[基因强度]
效果：全局倍率
公式：最终属性 = 计算属性 * 基因强度
备注：2.0 的基因强度意味着一切都比平时强两倍。
        `,
        KERNEL_2_NAME: "armor_physics.dat",
        KERNEL_2_CONTENT: `
:: 烧蚀装甲机制 ::

减伤率 = 0.8 (80%)
穿透率 = 0.2 (20%)

如果 玩家护甲 > 0:
    受到伤害 = 100
    护甲承受 = 80
    生命承受 = 20
否则:
    生命承受 = 100

再生协议:
- 护甲: 在最后一次受击 5 秒后开始。速率: 1/秒。
- 生命: 在最后一次受击 10 秒后开始。速率: 0.5/秒。
        `,
        KERNEL_3_NAME: "lure_economy.xls",
        KERNEL_3_CONTENT: `
:: 诱捕风险/回报计算 ::

动作: 按 [L] 跳过波次计时器。
条件: 剩余时间必须 > 10秒。

回报公式:
跳过的秒数 * 波次 = 奖励残片

示例:
在第 10 波跳过 20 秒
20 * 10 = 200 残片奖励

风险:
下一波立即生成。没有装填或再生的停机时间。
        `,

        // Old keys
        // Pause
        PAUSE_TITLE: "战术终端_V1.0",
        SYSTEM_PAUSED: "系统暂停",
        TAB_DATA: "数据",
        TAB_CONFIG: "设置",
        TAB_NOTES: "日志",
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
        
        // Notes / Field Manual Logs
        LOG_TITLE: "指挥官战地日志",
        LOG_SUBTITLE: "先锋干员档案",
        
        LOG_1_DATE: "2248.05.12",
        LOG_1_TITLE: "抵达：天灾降临",
        LOG_1_CONTENT: "我们于0600时从巨像号空降。菌丝天灾已经彻底占领了这个扇区。空气中充满了硫磺和灰烬的味道。我的任务很简单：建立滩头阵地，保护分子打印机（基地），并收集足够的生物质‘残片’来制造撤离通道。如果基地陷落，任务取消，我也将被紧急回收至轨道。",

        LOG_2_DATE: "2248.05.13",
        LOG_2_TITLE: "战斗协议",
        LOG_2_CONTENT: "重温V型外骨骼控制：[W/A/S/D] 移动。[1-4] 瞬间切换武器。霰弹枪（2号位）对于击退虫群至关重要，而狙击枪（3号位）用于清除高价值目标。记住在战斗间隙手动装填 [R]。不要吝啬手雷，按 [G] 清理密集怪群。如果我存活足够久，护甲会在未受伤害 5 秒后自动修复。",

        LOG_3_DATE: "2248.05.14",
        LOG_3_TITLE: "诱捕剂（风险与回报）",
        LOG_3_CONTENT: "我发现了一种加速资源收集的方法。按下 [L] 键释放合成费洛蒙‘诱捕剂’。这会激怒虫群，导致下一波敌人立即生成。为什么要这样做？打印机可以从疯狂的虫群中更高效地提取颗粒。跳过等待时间会给予巨额残片奖励。这很危险，但贫穷比外星人杀人更快。留意HUD上闪烁的 '>>' 图标。",

        LOG_4_DATE: "2248.05.16",
        LOG_4_TITLE: "基地防御与经济",
        LOG_4_CONTENT: "我无法分身乏术。我必须使用残片在发光的硬点上建造自动炮塔，按 [E] 键。基础炮塔很弱，但按 [E] 升级为导弹发射器后可提供全图支援。我也可以在基地附近按 [B] 打开补给站购买弹药或永久升级。按 [C] 检查背包并安装在战场上发现的武器模块。",

        LOG_5_DATE: "2248.05.20",
        LOG_5_TITLE: "虫巢之母",
        LOG_5_CONTENT: "情报显示该扇区存在一个 5 级生物结构：虫巢之母。它不会移动，但它控制着虫群。它拥有厚重的装甲板，并且会根据大气含氧量进行再生。要杀死它，我必须在它蜕壳时抓住机会，那是唯一的攻击窗口。飞船上的‘异种生物甲壳解析装置’模块对于这场战斗是强制性的。",

        // Planet Info & Map
        PLANET_ANALYSIS: "行星分析",
        SECTOR_NAME: "扇区代号",
        ATMOSPHERE_TYPE: "大气类型",
        GENE_MODIFIER: "基因强度修正",
        THREAT_LEVEL: "威胁等级",
        SECTOR_WAVES: "扇区持续时间 (波数)",
        ATMOSPHERE_COMP: "大气成分分析",
        LANDING_DIFFICULTY: "轨道投放难度",
        OFFENSE_TAG: "进攻任务",
        CLEARED_TAG: "已肃清",
        ASSAULT_OPS: "突击行动",
        WAVES_SUFFIX: "波次",
        SULFUR_INDEX: "硫磺指数",
        VIEW_ANALYSIS: "查看详细分析",
        DROP_COST: "投放消耗",
        INITIATE_DROP: "开始投放",
        INSUFFICIENT_FUNDS: "资金不足",
        AVAILABLE_FUNDS: "可用资金",
        HIGH: "高",
        MEDIUM: "中",
        LOW: "低",
        
        // Planet Detail Screen
        PLANETARY_SCAN: "行星扫描完成",
        HAZARD_ASSESSMENT: "环境危害评估",
        LAUNCH_WINDOW: "发射窗口",
        TACTICAL_ASSESSMENT: "战术评估",
        ATMOSPHERIC_BREAKDOWN: "大气成分解析",
        ESTIMATED_HOSTILES: "预计敌对单位",
        RESOURCE_DENSITY: "资源密度",
        SCAN_ID: "扫描 ID",
        FULL_ANALYSIS_BTN: "完整战术分析",

        // Planet Construction
        PC_TITLE: "行星建设",
        PC_SUB: "殖民地开采系统",
        PC_BTN: "行星建设",
        PC_SLOTS_AVAILABLE: "建设槽位",
        PC_BIOMASS: "生物质提取基地",
        PC_OXYGEN: "氧气虹吸站",
        PC_BIOMASS_DESC: "从生态系统中提取有机物质。",
        PC_OXYGEN_DESC: "将大气中的氧气冷凝为燃料。",
        PC_YIELD: "产出",
        PC_BUILD: "建造",
        PC_PER_MISSION: "每次任务",
        PC_YIELD_MSG: "行星产出：+{0} 残片",
        PC_SLOT_LOCKED: "槽位锁定",
        PC_SLOT_EMPTY: "空闲槽位",

        // Galactic Events
        EVENT_EXPANSION_TITLE: "检测到天灾扩散",
        EVENT_EXPANSION_DESC: "主脑正在加强对扇区的控制。未占领行星发生变异。",
        EVENT_EXPANSION_EFFECT: "所有未殖民行星：基因强度 +0.1 - 0.3",
        EVENT_INVASION_TITLE: "殖民地入侵警报",
        EVENT_INVASION_DESC: "大规模虫群淹没了一个已建立的殖民地。基础设施危急。",
        EVENT_INVASION_EFFECT: "殖民地丢失。行星恢复敌对。建筑被毁。威胁等级增加。",
        EVENT_SALVAGE_TITLE: "宇宙打捞",
        EVENT_SALVAGE_DESC: "传感器检测到一艘漂浮在轨道的废弃补给舱。",
        EVENT_SALVAGE_EFFECT: "获得资源：+{0} 残片",
        ACKNOWLEDGE: "确认",

        // Biomes
        BIOME_BARREN: "荒芜",
        BIOME_ICE: "极寒",
        BIOME_VOLCANIC: "火山",
        BIOME_DESERT: "沙漠",
        BIOME_TOXIC: "剧毒",

        // Atmosphere Modal (Legacy/Reused)
        PLANET_ATMOS_ANALYSIS: "行星大气分析",
        SPECTROSCOPIC_DATA: "光谱数据",
        ATMOS_DETAILS_PRE: "扇区目标",
        ATMOS_DETAILS_MID: "的大气全解析。成分显示为",
        ATMOS_DETAILS_POST: "环境条件。",
        UPLINK_ESTABLISHED: "上行链路已建立",
        SECURE_CONNECTION: "安全连接",
        ATMOS_LABEL: "大气层",

        // Gases
        GAS_OXYGEN_NAME: "氧气",
        GAS_OXYGEN_DESC: "生物呼吸的必需品。影响当地动物群的代谢率。",
        GAS_NITROGEN_NAME: "氮气",
        GAS_NITROGEN_DESC: "惰性气体。标准的大气填充物。",
        GAS_CO2_NAME: "二氧化碳",
        GAS_CO2_DESC: "温室气体。表明存在大量呼吸或燃烧活动。",
        GAS_ARGON_NAME: "氩气",
        GAS_ARGON_DESC: "稀有气体。常见于放射性衰变环境。",
        GAS_METHANE_NAME: "甲烷",
        GAS_METHANE_DESC: "高度易燃的有机化合物。",
        GAS_SULFUR_NAME: "二氧化硫",
        GAS_SULFUR_DESC: "有毒的火山副产品。",
        GAS_HELIUM_NAME: "氦气",
        GAS_HELIUM_DESC: "轻质稀有气体。",

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

        // Bestiary Entries
        ENEMY_GRUNT_NAME: "工蜂",
        ENEMY_GRUNT_CLASS: "虫群步兵",
        ENEMY_GRUNT_DESC: "标准生物无人机。表现出初级智能。依靠压倒性的数量突破防御。容易被轻武器消灭。",
        ENEMY_RUSHER_NAME: "突击兽",
        ENEMY_RUSHER_CLASS: "极速突袭",
        ENEMY_RUSHER_DESC: "为拉近距离而进化的快速移动变种。具有明显的橙色甲壳和镰刀状附肢。在它们进入近战范围前优先消灭。",
        ENEMY_TANK_NAME: "重甲坦克",
        ENEMY_TANK_CLASS: "重型装甲",
        ENEMY_TANK_DESC: "类似陆地甲虫的重型甲壳生物。对动能冲击有极强的抵抗力。移动缓慢，适合放风筝战术。",
        ENEMY_KAMIKAZE_NAME: "自爆者",
        ENEMY_KAMIKAZE_CLASS: "不稳定体",
        ENEMY_KAMIKAZE_DESC: "携带挥发性酸液载荷的不稳定变异体。接近时会自毁。发光的紫色囊泡表示临界质量。保持安全距离。",
        ENEMY_VIPER_NAME: "毒蛇",
        ENEMY_VIPER_CLASS: "远程支援",
        ENEMY_VIPER_DESC: "能够发射腐蚀性投射物的空中单位。在轰炸目标时保持距离。绿色生物发光标记攻击矢量。",
        ENEMY_RED_SUMMONER_NAME: "虫巢领主",
        ENEMY_RED_SUMMONER_CLASS: "顶级孵化者",
        ENEMY_RED_SUMMONER_DESC: "巨大的生物锚点。拥有能够快速孵化工蜂无人机的妊娠囊。必须被摧毁以阻止虫群扩张。",
        ENEMY_BLUE_BURST_NAME: "钴蓝收割者",
        ENEMY_BLUE_BURST_CLASS: "顶级炮兵",
        ENEMY_BLUE_BURST_DESC: "Highly evolved ranged specialist. Fires bursts of high-velocity plasma spines. Plated in dense blue chitin. Prioritize cover during its burst cycle.",
        ENEMY_PURPLE_ACID_NAME: "瘟疫使者",
        ENEMY_PURPLE_ACID_CLASS: "顶级毒素",
        ENEMY_PURPLE_ACID_DESC: "行走的生物危害。投掷有机迫击炮，制造持久的拒绝区域。紫色酸液能在几秒钟内熔化耐钢。避开影响区域。",
        ENEMY_HIVE_MOTHER_NAME: "虫巢之母",
        ENEMY_HIVE_MOTHER_CLASS: "虫巢核心",
        ENEMY_HIVE_MOTHER_DESC: "行星感染的中枢神经系统。这个巨大的静止生物结构协调所有当地虫群活动。它装甲厚重，并受到快速再生的甲壳保护。摧毁它将切断该扇区与主脑的连接。",

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

        // Weapons
        WEAPON_AR_NAME: "突击步枪",
        WEAPON_SG_NAME: "霰弹枪",
        WEAPON_SR_NAME: "狙击步枪",
        WEAPON_PISTOL_NAME: "手枪",
        WEAPON_FLAMETHROWER_NAME: "火焰喷射器",
        WEAPON_PULSE_RIFLE_NAME: "脉冲步枪",
        WEAPON_GRENADE_LAUNCHER_NAME: "榴弹发射器",
        WEAPON_GRENADE_NAME: "破片手雷",

        // Ammo
        AMMO_AR_NAME: "突击步枪弹药",
        AMMO_AR_DESC: "+60 发",
        AMMO_SG_NAME: "霰弹枪弹药",
        AMMO_SG_DESC: "+16 发",
        AMMO_SR_NAME: "狙击步枪弹药",
        AMMO_SR_DESC: "+10 发",
        AMMO_GRENADE_NAME: "破片手雷",
        AMMO_GRENADE_DESC: "+1 个",
        AMMO_PULSE_NAME: "脉冲电池",
        AMMO_PULSE_DESC: "+90 能量",
        AMMO_FLAME_NAME: "凝固汽油罐",
        AMMO_FLAME_DESC: "+200 燃料",
        AMMO_GL_NAME: "40mm 榴弹",
        AMMO_GL_DESC: "+12 发",

        // Weapon Shop Descs
        WEAPON_PULSE_DESC: "穿透能量 (10% 穿透衰减)",
        WEAPON_FLAME_DESC: "燃烧武器",
        WEAPON_GL_DESC: "重型爆破",

        // Weapon Modules
        MODULE_GEL_BARREL_NAME: "凝胶穿透扩散器",
        MODULE_GEL_BARREL_DESC: "伤害 +40%",
        MODULE_MAG_FEED_NAME: "高效堆叠供弹",
        MODULE_MAG_FEED_DESC: "弹匣容量 +100%",
        MODULE_MICRO_RUPTURER_NAME: "微震破裂器",
        MODULE_MICRO_RUPTURER_DESC: "伤害 +60%",
        MODULE_PRESSURIZED_BOLT_NAME: "加压枪机",
        MODULE_PRESSURIZED_BOLT_DESC: "每发增加 +10% 射速 (可叠加)",
        
        // Module Compatibility
        COMPAT_ONLY: "仅限：{0}",
        COMPAT_EXCLUDE: "不兼容：{0}",
        COMPAT_ALL: "兼容所有动能武器",
        COMPAT_GRENADE: "手雷",

        // Spaceship
        SHIP_STATUS: "舰船状态",
        SHIP_CLASS: "巨像级",
        SHIP_TYPE: "重型巡洋舰",
        SHIP_MODULES: "已安装模块",
        SHIP_AVAILABLE: "可用升级",
        INSTALL: "安装",
        INSTALLED: "已安装",
        RETURN_SECTOR: "返回扇区",
        STORAGE_ACCESS: "仓库权限",
        FRAGMENTS: "残片",
        SHIP_CLASS_NAME: "巨像级",
        SHIP_TYPE_NAME: "重型巡洋舰",
        VESSEL_ONLINE: "舰船状态: 在线",
        HULL_INTEGRITY: "船体完整性",
        NO_MODULES: "未安装额外模块。系统正常。",
        SYSTEM_UPGRADE: "系统升级",
        XENO_MATRIX: "异种数据矩阵",
        ENGINEERING: "工程部",
        MODULE_FAB: "模块制造",
        ALL_INSTALLED: "所有可用模块已制造并安装。",
        NO_FUNDS: "资金不足",
        RETURN_SECTOR_BTN: "返回扇区",
        INSTALL_BTN: "安装",
        CORE_DB: "核心数据库",
        ACCESS_COMPUTER: "访问终端",
        BASE_RESEARCH: "基建技术研究",
        RESEARCH_BTN: "基建研究",

        // Spaceship Modules
        SHIP_MOD_BASE_REINFORCEMENT_NAME: "基地强化模块",
        SHIP_MOD_BASE_REINFORCEMENT_DESC: "部署基地生命值 +3000",
        SHIP_MOD_CARAPACE_ANALYZER_NAME: "异种生物甲壳解析装置",
        SHIP_MOD_CARAPACE_ANALYZER_DESC: "玩家造成伤害 +20%",
        SHIP_MOD_ORBITAL_CANNON_NAME: "轨道远程支援炮",
        SHIP_MOD_ORBITAL_CANNON_DESC: "每8秒打击最近敌人 (400伤害)",
        SHIP_MOD_ATMOSPHERIC_DEFLECTOR_NAME: "大气阻力自适应偏转器",
        SHIP_MOD_ATMOSPHERIC_DEFLECTOR_DESC: "轨道投放消耗 -50%",

        // Infrastructure Research
        INFRA_TITLE: "基建技术",
        INFRA_SUB: "研究与开发",
        INFRA_ACQUIRED: "已获得技术",
        INFRA_AVAILABLE: "可用研究项目",
        INFRA_LOCKED_MSG: "研究协议锁定。需要任务成功以进行下一轮研究。",
        INFRA_MAXED_MSG: "已达到最大研究容量。",
        INFRA_SELECT_BTN: "开始研究",
        INFRA_COST: "花费",
        INFRA_BASE_HP_DESC: "基地结构完整性 +{0}",
        INFRA_TURRET_HP_DESC: "自动炮塔装甲 +{0}",
        INFRA_TURRET_L1_DMG_DESC: "标准炮塔伤害 +{0}%",
        INFRA_TURRET_GAUSS_RATE_DESC: "高斯炮射速 +{0}%",
        INFRA_TURRET_SNIPER_RANGE_DESC: "狙击炮塔射程 +{0}%",
        INFRA_TURRET_MISSILE_DMG_DESC: "导弹弹头当量 +{0}%",
        INFRA_GLOBAL_TURRET_DMG_DESC: "全局防御设施伤害 +{0}%",
        INFRA_GLOBAL_TURRET_RATE_DESC: "全局防御设施射速 +{0}%",
        INFRA_TURRET_L1_COST_DESC: "标准炮塔造价 -{0}%",

        // Orbital
        ORBITAL_TITLE: "轨道矩阵",
        CALIBRATION: "校准",
        ORBITAL_SUB: "武器系统优化树",
        CURRENT_OUTPUT: "当前输出",
        DMG_MULT: "伤害倍率",
        RATE_DIV: "射速除数",
        LAYER: "层级",
        UPGRADE_TYPE: "升级类型",
        KINETIC_AMP: "动能放大",
        CYCLING_SPD: "循环速度",
        EFFECT: "效果",
        COST: "花费",
        ACQUIRED: "已获取",
        HOVER_NODE: "悬停在节点上查看图纸",

        // Carapace
        XENO_TITLE: "异种生物学",
        ANALYSIS: "分析",
        WEAKNESS_MATRIX: "弱点识别矩阵",
        ROW_BONUS: "第 {0} 行奖励",
        ROW_BONUS_LABEL: "行奖励",
        GLOBAL_DMG: "全局伤害",
        COL_BONUS_LABEL: "列奖励",
        COL_BONUS_ARMOR: "护甲",
        TARGET_SPECIES: "目标物种",
        DMG_AMP: "伤害放大",
        ANALYSIS_COST: "分析成本",
        COMPLETE_BTN: "已完成",
        HOVER_DATA: "悬停在数据节点上查看详情",

        // Mission Success
        UPLINK_EST: "上行链路已建立",
        PROTOCOL_ZULU: "协议 10-ZULU",
        SECTOR_PACIFIED: "扇区已肃清",
        MISSION_OBJ: "任务目标",
        COMPLETE: "完成",
        RESOURCES_SECURED: "资源已保护",
        SCRAPS_TRANSFER: "分子残片传输完成",
        HOSTILES_NEUTRALIZED: "敌对目标已清除",
        BASE_INTEGRITY: "基地完整性",
        SUCCESS_DESC: "所有当地抵抗力量已被消灭。该区域对自动采矿无人机是安全的。准备轨道撤离和汇报。",
        INITIATE_ASCENT: "开始升空",
        NET_SECURE: "先锋网络 // 安全 // 200 OK",

        // Extraction
        CRITICAL_FAILURE: "严重系统故障",
        SIGNAL_LOST: "信号丢失",
        BASE_COMPROMISED: "基地被攻破",
        EMERGENCY_PROTO: "紧急协议",
        EXECUTED: "已执行",
        LOG_INTEGRITY: "基地结构完整性为 0%。自毁程序已启动。",
        LOG_POD: "指挥官逃生舱已发射。轨迹：高轨道。",
        LOG_DOCK: "巨像级对接成功。干员已回收。",
        FAILURE_DESC: "行星滩头阵地已丢失。毁灭前收集的资源已传输。该扇区仍然充满敌意。重组并选择新的着陆区。",
        RETURN_BRIDGE: "返回舰桥",
        NO_SIGNAL: "无信号 // 无信号 // 无信号",

        // Mission Failed
        MISSION_FAILED: "任务失败",
        REPORT_ID: "报告 ID",
        FINAL_SCORE: "FINAL SCORE",
        RE_DEPLOY: "重新部署",
        SAVE_INTEL: "保存情报",

        // Turret
        GAUSS_NAME: "高斯加农炮",
        GAUSS_DESC: "高DPS，射速快",
        SNIPER_NAME: "电磁狙击炮",
        SNIPER_DESC: "极远射程，高伤害",
        MISSILE_NAME: "地狱火导弹",
        MISSILE_DESC: "全图射程，追踪，范围伤害",
        DMG: "伤害",
        RNG: "射程",
        SPD: "射速",
        GLOBAL: "全图",
        CANCEL_HINT: "按 [ESC] 取消",

        // Interact
        OPEN_DEPOT: "打开补给站 [B]",
        UPGRADE_TURRET: "升级 [E]",
        BUILD_TURRET: "建造炮塔 [E]",

        // Main Menu
        IMPORT_DATA: "导入数据",
        NO_ARCHIVES: "无存档记录",
        
        // HUD & Lure
        SKIP_WAVE: "释放诱捕剂",

        // Upgrades
        UPGRADE_INFECTION: "感染液快速排散结构",
        UPGRADE_INFECTION_DESC: "护甲伤害阻挡率提升至90%，脱战回复速度提升至每秒10点。",
        UPGRADE_SPORE: "腐蚀性孢子阻隔层",
        UPGRADE_SPORE_DESC: "护甲上限提升至200点。",
        UPGRADE_IMPACT: "重压冲击再分布背板",
        UPGRADE_IMPACT_DESC: "受到的所有近战类伤害降低20% (计算护甲前)。",
        OWNED: "已拥有",

        // Messages
        WAVE_STARTED: "第 {0} 波开始",
        FRENZY_DETECTED: "警告：检测到虫群狂暴",
        BOSS_DETECTED: "警告：顶级生命体",
        ORBITAL_DROP_COST: "轨道投放消耗：-{0} 残片",
        DEFLECTOR_ACTIVE: "自适应偏转护盾已激活",
        MISSION_ASSAULT: "任务：突袭虫巢之母",
        LURE_REWARD: "诱捕奖励：+{0}",
        FINAL_WAVE: "最终波次加速",
        LURE_PENDING: "诱捕剂充能中...",
        ORBITAL_STRIKE: "轨道打击：{0}",
        ROW_UNLOCKED: "行奖励解锁：伤害 +{0}%",
        COL_UNLOCKED: "列奖励解锁：护甲 +{0}",
        HIVE_MOTHER_SHED: "虫巢之母正在蜕壳",
        HIVE_MOTHER_KILL: "虫巢之母已消灭",
        DOMINANCE_BONUS: "统治奖励：+{0}",
        GAME_SAVED: "游戏已保存",
        GAME_LOADED: "游戏已读取",
        LOAD_FAIL: "读取失败：数据损坏",
        REINFORCEMENTS: "增援抵达",
        FRENZY_BANNER: "警告：检测到虫群狂暴",
        BOSS_BANNER: "警告：高等级生物信号",
        VESSEL_STATUS: "舰船状态",
    }
};