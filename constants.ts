
// Re-export data modules for easier import in some legacy components if needed, 
// though we will update most to direct imports.
export * from './data/locales';
export * from './data/registry';
export * from './data/world';

// Default Canvas Resolution (Fallback if window not available)
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 900;

// Default World Dimensions (Long and Narrow for Survival/Exploration)
export const WORLD_WIDTH = 1200;
export const WORLD_HEIGHT = 3200; 

// Campaign World Dimensions (Massive Square)
export const CAMPAIGN_WIDTH = 3600;
export const CAMPAIGN_HEIGHT = 3600;

export const INVENTORY_SIZE = 30;
export const MAX_SAVE_SLOTS = 7;
export const MAX_PINNED_SLOTS = 3;
