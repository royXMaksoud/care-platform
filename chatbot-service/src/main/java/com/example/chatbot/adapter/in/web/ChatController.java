package com.example.chatbot.adapter.in.web;

import com.example.chatbot.application.port.in.ChatInteractionUseCase;
import com.example.chatbot.domain.ChatMessage;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.servlet.http.HttpServletRequest;
import com.example.chatbot.application.service.LanguageContext;

import java.security.Principal;
import java.time.LocalDateTime;

/**
 * REST controller for chat interactions.
 */
@RestController
@RequestMapping("/chat")
public class ChatController {
    private final ChatInteractionUseCase chatInteractionUseCase;
    private final LanguageContext languageContext;

    /**
     * Constructor for ChatController.
     * @param chatInteractionUseCase use case for chat interaction
     * @param languageContext context for current language
     */
    @Autowired
    public ChatController(ChatInteractionUseCase chatInteractionUseCase, LanguageContext languageContext) {
        this.chatInteractionUseCase = chatInteractionUseCase;
        this.languageContext = languageContext;
    }

    /**
     * Handles POST /chat requests.
     * Extracts userId and language from JWT token.
     * @param chatRequest the chat request DTO
     * @param principal the authenticated principal
     * @return chat response DTO
     */
    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest chatRequest,
                                            @AuthenticationPrincipal Principal principal,
                                            HttpServletRequest request) {
        // Extract userId and language from JWT token or Accept-Language header
        String userId = JwtUtil.extractUserId(principal);
        String language = JwtUtil.extractLanguage(principal);
        if (language == null || language.isEmpty() || !(language.equalsIgnoreCase("ar") || language.equalsIgnoreCase("en"))) {
            // Fallback to Accept-Language header or English
            String acceptLang = request.getHeader("Accept-Language");
            if (acceptLang != null && acceptLang.toLowerCase().startsWith("ar")) {
                language = "ar";
            } else {
                language = "en";
            }
        }
        languageContext.setLang(language);
        ChatMessage chatMessage = new ChatMessage(null, userId, language, chatRequest.getMessage(), LocalDateTime.now());
        String reply = chatInteractionUseCase.interact(chatMessage);
        languageContext.clear();
        return ResponseEntity.ok(new ChatResponse(reply));
    }
}
