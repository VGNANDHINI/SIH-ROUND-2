
'use client';
import React, { createContext, useState, useEffect, ReactNode } from 'react';

// Use require for server-side compatibility and to avoid async issues with imports
const translations: Record<string, Record<string, string>> = {
    en: require('@/locales/en.json'),
    hi: require('@/locales/hi.json'),
    ta: require('@/locales/ta.json'),
    te: require('@/locales/te.json'),
    bn: require('@/locales/bn.json'),
};

interface LanguageContextType {
    language: string;
    setLanguage: (language: string) => void;
    t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<string>('en');
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const savedLanguage = localStorage.getItem('jalsaathi-lang');
        if (savedLanguage && translations[savedLanguage]) {
            setLanguageState(savedLanguage);
            document.documentElement.lang = savedLanguage;
        }
        setIsInitialized(true);
    }, []);

    const setLanguage = (lang: string) => {
        if (translations[lang]) {
            localStorage.setItem('jalsaathi-lang', lang);
            setLanguageState(lang);
            document.documentElement.lang = lang;
        }
    };

    const t = (key: string): string => {
        return translations[language]?.[key] || translations['en']?.[key] || key;
    };
    
    // Prevent rendering children until the language has been determined from localStorage
    if (!isInitialized) {
        return null;
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
