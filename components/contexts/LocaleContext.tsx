
import React, { createContext, useContext, useMemo } from 'react';
import { TRANSLATIONS } from '../../data/locales';

type TranslationParams = Record<string, string | number>;
export type Translator = (key: string, params?: TranslationParams) => string;

interface LocaleContextProps {
    t: Translator;
    language: 'EN' | 'CN';
}

const LocaleContext = createContext<LocaleContextProps | undefined>(undefined);

export const LocaleProvider: React.FC<{ language: 'EN' | 'CN'; children: React.ReactNode }> = ({ language, children }) => {
    const t = useMemo(() => {
        return (key: string, params?: TranslationParams) => {
            // @ts-ignore
            const dict = TRANSLATIONS[language] || TRANSLATIONS.EN;
            // @ts-ignore
            let str = dict[key];
            if (str === undefined) {
                // @ts-ignore
                str = TRANSLATIONS.EN[key] || key;
            }

            if (params) {
                Object.entries(params).forEach(([k, v]) => {
                    str = str.replace(`{${k}}`, String(v));
                });
            }
            return str;
        };
    }, [language]);

    return (
        <LocaleContext.Provider value={{ t, language }}>
            {children}
        </LocaleContext.Provider>
    );
};

export const useLocale = () => {
    const context = useContext(LocaleContext);
    if (!context) {
        throw new Error('useLocale must be used within a LocaleProvider');
    }
    return context;
};
