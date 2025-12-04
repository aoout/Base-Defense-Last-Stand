
import { UI_EN, UI_CN } from './locales/ui';
import { ITEMS_EN, ITEMS_CN } from './locales/items';
import { ENEMIES_EN, ENEMIES_CN } from './locales/enemies';
import { SYSTEMS_EN, SYSTEMS_CN } from './locales/systems';
import { LORE_EN, LORE_CN } from './locales/lore';

export const EN_LOCALE = {
    ...UI_EN,
    ...ITEMS_EN,
    ...ENEMIES_EN,
    ...SYSTEMS_EN,
    ...LORE_EN
};

export const CN_LOCALE = {
    ...UI_CN,
    ...ITEMS_CN,
    ...ENEMIES_CN,
    ...SYSTEMS_CN,
    ...LORE_CN
};

export type LocaleSchema = typeof EN_LOCALE;

export const TRANSLATIONS = {
    EN: EN_LOCALE,
    CN: CN_LOCALE
};
