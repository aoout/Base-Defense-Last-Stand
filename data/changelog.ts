
export interface ChangelogEntry {
    version: string;
    date: string;
    title?: string;
    titleCN?: string;
    changes: string[];
    changesCN?: string[];
}

export const CURRENT_VERSION = "1.0.4";

export const CHANGELOG: ChangelogEntry[] = [
    {
        version: "1.0.4",
        date: "2248.07.10",
        title: "FORTRESS & MUTATION",
        titleCN: "堡垒与变异",
        changes: [
            "BALANCE: Strategic fortification protocols enacted. All Turret structures receive +50% Base HP.",
            "VISUAL: Apex Strains (Bosses) have evolved. Complete visual redesign for Hive Lord, Cobalt Reaper, and Plague Bringer.",
            "UI: Added 'Low Ammo' critical warning indicators to HUD.",
            "VISUAL: Enhanced Boss Health Bar with organic gradient textures."
        ],
        changesCN: [
            "平衡：战略防御协议生效。所有炮塔的基础生命值提升 50%。",
            "视觉：顶级变种（Boss）发生进化。虫巢领主、钴蓝收割者和瘟疫使者获得全新的异形外观。",
            "界面：HUD 新增“低弹药”暴击警告提示。",
            "视觉：优化了 Boss 血条样式，使其更具生物质感。"
        ]
    },
    {
        version: "1.0.3",
        date: "2248.07.05",
        title: "TURRET MECHANICS & BALANCE",
        titleCN: "炮塔机制与平衡调整",
        changes: [
            "REWORK: 'Gauss Repeater' now features a spool-up mechanic. Fire rate increases by 1% per shot (Max +200%). Base rate lowered to 240ms.",
            "REWORK: 'Railgun Turret' now fires a piercing beam (8% damage decay per target). Damage set to 190, Rate to 780ms.",
            "BALANCE: 'Hydra Missile' damage increased to 220, rate adjusted to 1230ms. Added Area of Effect description.",
            "DOCS: Updated in-game descriptions to reflect these mechanical changes."
        ],
        changesCN: [
            "重制：“高斯机炮”新增预热机制。每次射击增加1%攻速（上限+200%）。基础射速调整为240ms。",
            "重制：“轨道炮塔”现在发射穿透光束（每穿透一个目标衰减8%伤害）。伤害调整为190，射速780ms。",
            "平衡：“九头蛇导弹”伤害提升至220，射速调整为1230ms。描述中明确了范围爆炸效果。",
            "文档：更新了游戏内的描述文本以反映这些机制变化。"
        ]
    },
    {
        version: "1.0.2",
        date: "2248.06.30",
        title: "BIOLOGICAL EVOLUTION UPDATE",
        titleCN: "生物进化更新",
        changes: [
            "NEW UNIT: 'Pustule' added to Campaign Mode. Spawns enemies and explodes on contact.",
            "REWORK: 'Tank' visual overhaul and new Reactive Shell mechanic (Damage Reduction + Regen).",
            "REWORK: 'Rusher' now possesses a Dash ability to close gaps quickly.",
            "BALANCE: Adjusted Exploration Mode spawn rates and environmental stat scaling.",
            "FIX: Resolved collision issues in Campaign Mode map boundaries.",
            "SYSTEM: Default language set to Chinese."
        ],
        changesCN: [
            "新单位：战役模式新增“脓包”。定期生成敌人，接触时造成伤害。",
            "重制：“巨壳重躯”外观升级，新增“反应甲壳”机制（减伤 + 自动回复）。",
            "重制：“掠流虫”现在拥有冲刺能力，可快速接近目标。",
            "平衡：调整了探索模式的刷怪公式及环境属性修正算法。",
            "修复：解决了战役模式下地图边缘的碰撞和寻路问题。",
            "系统：默认语言更改为中文。"
        ]
    },
    {
        version: "1.0.1",
        date: "2248.06.25",
        title: "ENGINEERING & VISUAL OVERHAUL",
        titleCN: "工程与视觉重制",
        changes: [
            "UI: Complete visual overhaul of Weapon Assembly (Tech Chips) and Turret Upgrade interfaces.",
            "UI: Added real-time 3D model previews and dynamic stat calculations to Turret menus.",
            "GAMEPLAY: 'Dual Protocol' Simulation (Snake + Tetris) installed in Ship Computer.",
            "GAMEPLAY: Significantly buffed Turret HP values for late-game viability.",
            "AUDIO: Added distinct sound effects for Turret Construction and Upgrades.",
            "SYS: Major refactor of Spaceship Architecture (Modularized Managers).",
            "FIX: Resolved issue where Galaxy Index scans did not refresh sector names immediately.",
            "FIX: Corrected hardcoded values for 'Impact Plate' and 'Spore Barrier' upgrades."
        ],
        changesCN: [
            "界面：武器装配（科技芯片）和炮塔升级界面的全面视觉重制。",
            "界面：为炮塔菜单添加了实时3D模型预览和动态属性计算。",
            "玩法：飞船电脑安装了“双重协议”模拟（贪吃蛇 + 俄罗斯方块）。",
            "玩法：大幅提升了炮塔生命值，增强后期生存能力。",
            "音频：添加了炮塔建造和升级的专属音效。",
            "系统：飞船架构底层重构（模块化管理器）。",
            "修复：解决了星系索引扫描后扇区名称不立即刷新的问题。",
            "修复：修正了“冲击挂板”和“孢子屏障”升级数值硬编码的问题。"
        ]
    },
    {
        version: "1.0.0",
        date: "2248.06.20",
        title: "FULL RELEASE",
        titleCN: "正式发布",
        changes: [
            "LORE: Comprehensive rewrite of Item and Upgrade names to align with 'Bio-Mechanical' world building.",
            "UI: Enhanced Death/Failure screen with detailed atmospheric logs.",
            "SYSTEM: Fixed UI synchronization latency for Ammo and Wave counters.",
            "CONTENT: Expanded Ship Computer database (Flight, Ops, Kernel) with accurate mechanics data.",
            "EXTRA: Added 'PROTO_SIM' (Snake) mini-game to Ship Computer with one-time resource reward."
        ],
        changesCN: [
            "设定：全面重写物品和升级的名称与描述，深度契合“生物机械”世界观。",
            "界面：增强了死亡/失败屏幕，添加了详细的氛围日志。",
            "系统：修复了弹药和波次计数器的 UI 同步延迟问题。",
            "内容：扩展了飞船电脑数据库（航行、行动、内核），提供了准确的游戏机制数据。",
            "彩蛋：在飞船电脑中添加了“原型模拟”（贪吃蛇）小游戏，首次游玩可获得资源奖励。"
        ]
    },
    {
        version: "0.9.8",
        date: "2248.06.15",
        title: "AUDIO-VISUAL & PERFORMANCE UPDATE",
        titleCN: "视听体验与性能更新",
        changes: [
            "AUDIO: Implemented Generative BGM Engine with dynamic intensity scaling.",
            "AUDIO: Added Spatial Audio (3D Panning) and separated SFX/Music mixing buses.",
            "AUDIO: Overhauled weapon SFX (Reloads, Impacts) and added specific Turret sounds.",
            "PERF: Added Sprite Rasterization system for high-performance rendering.",
            "PERF: Added Resolution Scaling and Shadow Toggle settings.",
            "GAMEPLAY: Orbital Cannon and Sniper Turret (Long-Range Cannon) now deal AOE damage.",
            "AI: Optimized Viper behavior to stop firing when targets are out of range.",
            "FIX: Resolved UI locking issues in Shop and Upgrade menus."
        ],
        changesCN: [
            "音频：实装生成式背景音乐引擎，强度随战斗动态变化。",
            "音频：添加空间音频（3D声像）并分离了音效/音乐混音通道。",
            "音频：重制武器音效（换弹、命中）并添加了炮塔专属声音。",
            "性能：添加精灵栅格化系统，大幅提升渲染性能。",
            "性能：添加分辨率缩放和阴影开关设置。",
            "玩法：轨道炮和狙击塔（现更名为远射炮）现在造成范围伤害。",
            "AI：优化飞蛇行为，目标超出射程时停止射击。",
            "修复：解决了商店和升级菜单中的界面锁定问题。"
        ]
    },
    {
        version: "0.9.7",
        date: "2248.06.10",
        title: "ENGINE OPTIMIZATION & REFACTOR",
        titleCN: "引擎优化与重构",
        changes: [
            "CORE: Implemented Fixed Time Step game loop for deterministic physics.",
            "CORE: Centralized Physics System for unified collision handling.",
            "CORE: Refactored Enemy AI into modular Strategy patterns.",
            "AUDIO: Converted Audio System to Data-Driven architecture.",
            "PERF: Implemented Transient UI Updates for zero-overhead HUD.",
            "PERF: Added Asset Caching for entity rendering.",
            "UX: Added Input Rebinding system.",
            "SYS: Added Save Data Migration service."
        ],
        changesCN: [
            "核心：实现固定时间步长游戏循环，确保物理确定性。",
            "核心：集中化物理系统，统一碰撞处理。",
            "核心：将敌人AI重构为模块化策略模式。",
            "音频：将音频系统转换为数据驱动架构。",
            "性能：实现瞬态UI更新，消除HUD渲染开销。",
            "性能：添加实体渲染资产缓存。",
            "体验：添加按键绑定重设系统。",
            "系统：添加存档数据迁移服务。"
        ]
    },
    {
        version: "0.9.6",
        date: "2248.06.05",
        title: "SYSTEM ARCHITECTURE UPDATE",
        titleCN: "系统架构更新",
        changes: [
            "CORE: Major refactor of GameService into modular Managers.",
            "CORE: Implemented EventBus for decoupled communication.",
            "SYS: Added StatManager for centralized modifier calculations.",
            "OPT: Improved Spatial Hashing for collision detection.",
            "FIX: Resolved state synchronization issues."
        ],
        changesCN: [
            "核心：将 GameService 重构为模块化管理器。",
            "核心：实现了用于解耦通信的 EventBus。",
            "系统：添加了 StatManager 用于集中修饰符计算。",
            "优化：改进了用于碰撞检测的空间哈希算法。",
            "修复：解决了状态同步问题。"
        ]
    },
    {
        version: "0.9.5",
        date: "2248.06.01",
        title: "GALAXY INDEX",
        titleCN: "星系索引",
        changes: [
            "NEW: Added Galaxy Index Navigation System to Exploration Map.",
            "NEW: Difficulty presets (Low, Medium, High) for sector generation.",
            "NEW: Custom 'Index Definition' allows manual gene strength configuration.",
            "UI: Added Navigation Button to Sector Map interface."
        ],
        changesCN: [
            "新增：探索星图添加了星系索引导航系统。",
            "新增：星区生成的难度预设（低、中、高）。",
            "新增：自定义“索引定义”允许手动配置基因强度。",
            "界面：星图界面添加了导航按钮。"
        ]
    },
    {
        version: "0.9.4",
        date: "2248.05.28",
        title: "LOW-SPEC OPTIMIZATION",
        titleCN: "低配机型优化",
        changes: [
            "OPT: Added Resolution Scaling (50%, 75%, 100%) for massive FPS gains on older GPUs.",
            "OPT: Added Shadow Toggle to reduce draw calls.",
            "UI: Moved 'Damage Numbers' toggle to Main Menu settings for easier access.",
            "FIX: Resolved rendering module conflicts causing crashes on startup.",
            "FIX: Optimized base drawing routines."
        ],
        changesCN: [
            "优化：添加渲染分辨率选项 (50%, 75%, 100%)，大幅提升旧显卡帧率。",
            "优化：添加阴影开关以减少绘制调用。",
            "界面：将“伤害数字”开关移至主菜单设置，便于访问。",
            "修复：解决了导致启动崩溃的渲染模块冲突。",
            "修复：优化了基地绘制例程。"
        ]
    },
    {
        version: "0.9.3",
        date: "2248.05.25",
        title: "SYSTEM UI OVERHAUL",
        titleCN: "系统界面重构",
        changes: [
            "UI: Unified design language across all spaceship modules (Orbital, Bio, Tech, Xeno).",
            "UI: Added real-time 3D model previews to Carapace Analyzer and Bio-Sequencing.",
            "UX: Optimized layout for Orbital Upgrade tree to fit without scrolling.",
            "UX: Added detailed statistical breakdowns for Infrastructure and Orbital modules.",
            "FIX: Resolved reactivity issues in Bio-Sequencing active buff display."
        ],
        changesCN: [
            "界面：统一了所有飞船模块（轨道、生物、科技、异种）的设计语言。",
            "界面：为异种分析仪和生物序列添加了实时3D模型预览。",
            "体验：优化了轨道升级树布局，无需滚动即可完整显示。",
            "体验：为基础设施和轨道模块添加了详细的统计数据细分。",
            "修复：解决了生物序列激活增益显示的响应性问题。"
        ]
    },
    {
        version: "0.9.2",
        date: "2248.05.22",
        title: "PERFORMANCE OPTIMIZATION",
        titleCN: "性能优化",
        changes: [
            "NEW: Performance Mode setting (Quality / Balanced / Low Quality).",
            "NEW: Dynamic Level of Detail (LOD) system for high enemy counts.",
            "NEW: System Changelog interface.",
            "FIX: Settings are now persisted across sessions.",
            "FIX: Corrected localization keys for graphics settings."
        ],
        changesCN: [
            "新增：性能模式设置 (高质量 / 平衡 / 低质量)。",
            "新增：针对高数量敌人的动态细节层次 (LOD) 系统。",
            "新增：系统更新日志界面。",
            "修复：设置现在会在会话之间保存。",
            "修复：修正了图形设置的本地化键值。"
        ]
    },
    {
        version: "0.9.1",
        date: "2248.05.20",
        title: "PERSISTENCE UPDATE",
        titleCN: "持久化更新",
        changes: [
            "SYS: Implemented unified settings save system.",
            "FIX: Audio context auto-resume on interaction.",
            "BAL: Adjusted Sniper Rifle fire rate (1500ms -> 1100ms)."
        ],
        changesCN: [
            "系统：实现了统一的设置保存系统。",
            "修复：交互时自动恢复音频上下文。",
            "平衡：调整了狙击步枪的射速 (1500ms -> 1100ms)。"
        ]
    },
    {
        version: "0.9.0",
        date: "2248.05.15",
        title: "VANGUARD INITIATIVE LAUNCH",
        titleCN: "先锋计划启动",
        changes: [
            "CORE: Survival & Exploration Modes enabled.",
            "CORE: Procedural Planet Generation v1.0.",
            "WPN: Weapon Module Assembly System online.",
            "BIO: Apex Strains (Red, Blue, Purple, Hive Mother) released."
        ],
        changesCN: [
            "核心：生存模式与探索模式已启用。",
            "核心：程序化星球生成 v1.0。",
            "武器：武器模块装配系统上线。",
            "生物：顶级变种 (红/蓝/紫/母体) 已释放。"
        ]
    }
];
