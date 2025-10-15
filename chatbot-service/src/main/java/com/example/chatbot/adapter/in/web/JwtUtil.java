package com.example.chatbot.adapter.in.web;

import java.security.Principal;

/**
 * Utility class for extracting claims from JWT token.
 */
public class JwtUtil {
    /**
     * Extracts userId from JWT principal.
     * @param principal the authenticated principal
     * @return userId
     */
    public static String extractUserId(Principal principal) {
        // TODO: Implement JWT parsing to extract userId
        return "demo-user";
    }

    /**
     * Extracts language from JWT principal.
     * @param principal the authenticated principal
     * @return language
     */
    public static String extractLanguage(Principal principal) {
        // TODO: Implement JWT parsing to extract language
        return "en";
    }
}
