package com.example.chatbot.domain;

import java.time.LocalDateTime;

/**
 * Domain entity representing a chat message.
 */
public class ChatMessage {
    private Long id;
    private String userId;
    private String language;
    private String content;
    private LocalDateTime timestamp;

    // Constructors, getters, and setters
    public ChatMessage() {}

    public ChatMessage(Long id, String userId, String language, String content, LocalDateTime timestamp) {
        this.id = id;
        this.userId = userId;
        this.language = language;
        this.content = content;
        this.timestamp = timestamp;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
