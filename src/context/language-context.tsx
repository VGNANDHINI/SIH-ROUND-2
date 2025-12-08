
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import ta from '@/locales/ta.json';
import te from '@/locales/te.json';
import bn from '@/locales/bn.json';

type Translations = {
    [key: string]: string;
};

const translations: { [key: string]: Translations } = {
    en,
    hi,
    ta,
    te,
    bn,
};

interface LanguageContextType {
    language: string;
    setLanguage: (language: string) => void;
    t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState('en');

    useEffect(() => {
        const savedLanguage = localStorage.getItem('jalsaathi-lang');
        if (savedLanguage && translations[savedLanguage]) {
            setLanguageState(savedLanguage);
        }
    }, []);

    const setLanguage = (lang: string) => {
        if (translations[lang]) {
            localStorage.setItem('jalsaathi-lang', lang);
            setLanguageState(lang);
        }
    };

    const t = (key: string): string => {
        return translations[language]?.[key] || translations['en'][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
