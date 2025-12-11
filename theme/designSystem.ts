
export const DS = {
    colors: {
        primary: 'cyan',
        secondary: 'blue',
        accent: 'emerald',
        danger: 'red',
        warning: 'yellow',
        purple: 'purple',
        slate: 'slate',
    },
    text: {
        header: "font-display font-black tracking-widest uppercase",
        label: "font-mono text-[10px] font-bold tracking-[0.2em] uppercase",
        body: "font-sans text-xs leading-relaxed text-slate-400",
        value: "font-mono font-bold tracking-tighter",
    },
    layout: {
        panel: "bg-slate-900/90 border border-slate-700 backdrop-blur-md shadow-xl",
        overlay: "bg-black/80 backdrop-blur-sm",
    },
    effects: {
        glow: (color: string) => `shadow-[0_0_15px_rgba(var(--color-${color}-500),0.3)]`,
        scanline: "bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_3px,3px_100%]",
    }
};

export type Variant = 'cyan' | 'red' | 'yellow' | 'emerald' | 'purple' | 'blue' | 'slate';

export const getThemeClasses = (variant: Variant, active: boolean = false) => {
    const base = {
        cyan: { border: 'border-cyan-500', text: 'text-cyan-400', bg: 'bg-cyan-900/20', hover: 'hover:bg-cyan-900/40', glow: 'shadow-cyan-500/20' },
        red: { border: 'border-red-500', text: 'text-red-400', bg: 'bg-red-900/20', hover: 'hover:bg-red-900/40', glow: 'shadow-red-500/20' },
        yellow: { border: 'border-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-900/20', hover: 'hover:bg-yellow-900/40', glow: 'shadow-yellow-500/20' },
        emerald: { border: 'border-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-900/20', hover: 'hover:bg-emerald-900/40', glow: 'shadow-emerald-500/20' },
        purple: { border: 'border-purple-500', text: 'text-purple-400', bg: 'bg-purple-900/20', hover: 'hover:bg-purple-900/40', glow: 'shadow-purple-500/20' },
        blue: { border: 'border-blue-500', text: 'text-blue-400', bg: 'bg-blue-900/20', hover: 'hover:bg-blue-900/40', glow: 'shadow-blue-500/20' },
        slate: { border: 'border-slate-600', text: 'text-slate-300', bg: 'bg-slate-800/50', hover: 'hover:bg-slate-700', glow: 'shadow-none' },
    }[variant];

    if (active) {
        return `${base.border} ${base.text} ${base.bg} shadow-[0_0_15px_rgba(0,0,0,0.3)]`;
    }
    return `border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-600 hover:bg-slate-800/50`;
};
