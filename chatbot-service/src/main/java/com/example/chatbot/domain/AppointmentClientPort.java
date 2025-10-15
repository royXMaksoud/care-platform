package com.example.chatbot.domain;

/**
 * Port for appointment service integration.
 */
public interface AppointmentClientPort {
    /**
     * Fetches appointment details for a user.
     * @param userId the user ID
     * @return appointment details (stub)
     */
    String getAppointmentDetails(String userId);
}
