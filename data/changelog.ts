
export interface ChangelogEntry {
    version: string;
    date: string;
    title?: string;
    titleCN?: string;
    changes: string[];
    changesCN?: string[];
}

export const CURRENT_VERSION = "0.9.2";

export const CHANGELOG: ChangelogEntry[] = [
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
