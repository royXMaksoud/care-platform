package com.care.warehouse.infrastructure.client;

import feign.Response;
import feign.codec.ErrorDecoder;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Custom error decoder for Feign clients
 * Handles HTTP errors and converts them to appropriate exceptions
 */
public class FeignErrorDecoder implements ErrorDecoder {

    @Override
    public Exception decode(String methodKey, Response response) {
        HttpStatus status = HttpStatus.valueOf(response.status());
        
        switch (status) {
            case NOT_FOUND:
                return new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "Resource not found: " + methodKey);
            case UNAUTHORIZED:
                return new ResponseStatusException(HttpStatus.UNAUTHORIZED, 
                    "Unauthorized access: " + methodKey);
            case FORBIDDEN:
                return new ResponseStatusException(HttpStatus.FORBIDDEN, 
                    "Forbidden access: " + methodKey);
            case BAD_REQUEST:
                return new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Bad request: " + methodKey);
            default:
                return new ResponseStatusException(status, 
                    "Error calling " + methodKey + ": " + response.reason());
        }
    }
}

