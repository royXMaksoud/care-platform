# chatbot-service

This is a Java 17 Spring Boot microservice following Clean Architecture principles.

## Features
- Domain entity: ChatMessage
- Inbound Port: ChatInteractionUseCase
- Outbound Port: SaveChatMessagePort
- Service: ChatBotService
- JPA entity and repository for ChatMessage
- REST Controller: POST /chat
- DTOs: ChatRequest, ChatResponse
- Basic JWT authentication (extracts userId and language from token)

## How to build
Run:
```
mvn clean install
```

## How to run
Run:
```
mvn spring-boot:run
```

## API
- POST `/chat` - Send a chat message and receive a fixed response.

## Auth
- Requires JWT token in Authorization header.
