package com.example.chatbot.domain;

/**
 * Port for external user data source integration.
 */
public interface ExternalUserDataSourcePort {
    /**
     * Fetches user data from external source.
     * @param userId the user ID
     * @return user data (stub)
     */
    String getUserData(String userId);
}
