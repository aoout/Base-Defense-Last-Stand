
export interface ChangelogEntry {
    version: string;
    date: string;
    title?: string;
    titleCN?: string;
    changes: string[];
    changesCN?: string[];
}

export const CURRENT_VERSION = "0.9.8";

export const CHANGELOG: ChangelogEntry[] = [
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
