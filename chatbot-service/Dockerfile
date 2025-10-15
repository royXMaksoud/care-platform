# Use official OpenJDK image
FROM eclipse-temurin:17-jre

# Set working directory
WORKDIR /app

# Copy built jar
COPY target/chatbot-service-0.0.1-SNAPSHOT.jar app.jar

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
