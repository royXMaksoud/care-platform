package com.example.chatbot.application.service;

import org.springframework.stereotype.Component;

/**
 * Context for holding the current language for localization.
 */
@Component
public class LanguageContext {
    private static final ThreadLocal<String> currentLang = new ThreadLocal<>();

    /**
     * Sets the current language.
     * @param lang language code
     */
    public void setLang(String lang) {
        currentLang.set(lang);
    }

    /**
     * Gets the current language.
     * @return language code
     */
    public String getLang() {
        String lang = currentLang.get();
        return (lang == null || lang.isEmpty()) ? "en" : lang;
    }

    /**
     * Clears the current language.
     */
    public void clear() {
        currentLang.remove();
    }
}
