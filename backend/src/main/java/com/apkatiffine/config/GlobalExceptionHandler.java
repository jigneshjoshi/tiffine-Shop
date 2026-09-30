package com.apkatiffine.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAllExceptions(Exception ex) {
        ex.printStackTrace();
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("status", 500);
        errorDetails.put("error", ex.getClass().getSimpleName());
        errorDetails.put("message", ex.getMessage());
        if (ex.getCause() != null) {
            errorDetails.put("cause", ex.getCause().getMessage());
        }
        return new ResponseEntity<>(errorDetails, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
