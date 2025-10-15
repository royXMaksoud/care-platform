package com.example.chatbot.application.port.in;

import com.example.chatbot.domain.ChatMessage;

/**
 * Inbound port for chat interaction use case.
 */
public interface ChatInteractionUseCase {
    /**
     * Handles a chat message and returns a response.
     * @param chatMessage the chat message
     * @return the chatbot's response
     */
    String interact(ChatMessage chatMessage);
}
