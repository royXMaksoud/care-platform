package com.example.chatbot.domain;

/**
 * Port for fund transfer service integration.
 */
public interface FundClientPort {
    /**
     * Fetches balance details for a user.
     * @param userId the user ID
     * @return balance details (stub)
     */
    String getBalanceDetails(String userId);
}
