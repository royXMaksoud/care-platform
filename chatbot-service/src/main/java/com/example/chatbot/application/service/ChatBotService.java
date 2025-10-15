package com.example.chatbot.application.service;

import com.example.chatbot.application.port.in.ChatInteractionUseCase;
import com.example.chatbot.application.port.out.SaveChatMessagePort;
import com.example.chatbot.domain.ChatMessage;
import com.example.chatbot.domain.BotIntent;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;
import java.util.Locale;
import com.example.chatbot.domain.AppointmentClientPort;
import com.example.chatbot.domain.FundClientPort;
import com.example.chatbot.domain.ExternalUserDataSourcePort;

/**
 * Service handling chat interactions and saving messages.
 */
@Service
public class ChatBotService implements ChatInteractionUseCase {
    private final SaveChatMessagePort saveChatMessagePort;
    private final LanguageContext languageContext;
    private final MessageSource messageSource;
    private final AppointmentClientPort appointmentClientPort;
    private final FundClientPort fundClientPort;
    private final ExternalUserDataSourcePort externalUserDataSourcePort;

    /**
     * Constructor for ChatBotService.
     * @param saveChatMessagePort port for saving chat messages
     * @param languageContext context for current language
     * @param messageSource Spring message source for i18n
     */
    /**
     * Constructor for ChatBotService.
     * @param saveChatMessagePort port for saving chat messages
     * @param languageContext context for current language
     * @param messageSource Spring message source for i18n
     * @param appointmentClientPort port for appointment service
     * @param fundClientPort port for fund service
     * @param externalUserDataSourcePort port for user data source
     */
    public ChatBotService(
            SaveChatMessagePort saveChatMessagePort,
            LanguageContext languageContext,
            MessageSource messageSource,
            AppointmentClientPort appointmentClientPort,
            FundClientPort fundClientPort,
            ExternalUserDataSourcePort externalUserDataSourcePort) {
        this.saveChatMessagePort = saveChatMessagePort;
        this.languageContext = languageContext;
        this.messageSource = messageSource;
        this.appointmentClientPort = appointmentClientPort;
        this.fundClientPort = fundClientPort;
        this.externalUserDataSourcePort = externalUserDataSourcePort;
    }

    /**
     * Saves the chat message and returns a localized response.
     * @param chatMessage the chat message
     * @return localized thank you message
     */
    /**
     * Detects intent from message content.
     * @param content message content
     * @return detected BotIntent
     */
    private BotIntent detectIntent(String content) {
        if (content == null) return BotIntent.UNKNOWN;
        String msg = content.trim().toLowerCase();
        if (msg.contains("موعد")) return BotIntent.APPOINTMENT_QUERY;
        if (msg.contains("رصيد")) return BotIntent.BALANCE_QUERY;
        if (msg.contains("شكرا")) return BotIntent.GREETING;
        return BotIntent.UNKNOWN;
    }

    /**
     * Saves the chat message and returns a localized response based on intent.
     * @param chatMessage the chat message
     * @return localized response
     */
    @Override
    public String interact(ChatMessage chatMessage) {
        saveChatMessagePort.save(chatMessage);
        String lang = languageContext.getLang();
        Locale locale = (lang != null && lang.equalsIgnoreCase("ar")) ? new Locale("ar") : Locale.ENGLISH;
        BotIntent intent = detectIntent(chatMessage.getContent());
        String userId = chatMessage.getUserId();
        switch (intent) {
            case GREETING:
                return messageSource.getMessage("thank.you", null, locale);
            case APPOINTMENT_QUERY:
                // Call appointment service port
                String appointmentDetails = appointmentClientPort.getAppointmentDetails(userId);
                return messageSource.getMessage("intent.appointment", new Object[]{appointmentDetails}, locale);
            case BALANCE_QUERY:
                // Call fund service port
                String balanceDetails = fundClientPort.getBalanceDetails(userId);
                return messageSource.getMessage("intent.balance", new Object[]{balanceDetails}, locale);
            default:
                return messageSource.getMessage("thank.you", null, locale);
        }
    }
}
