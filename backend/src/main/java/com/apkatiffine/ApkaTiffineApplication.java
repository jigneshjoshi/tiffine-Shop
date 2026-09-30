package com.apkatiffine;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@SpringBootApplication
@RestController
public class ApkaTiffineApplication {
    public static void main(String[] args) {
        SpringApplication.run(ApkaTiffineApplication.class, args);
    }

    @GetMapping("/")
    public Map<String, String> home() {
        return Map.of(
            "status", "UP",
            "message", "Apka Tiffine Center API is running successfully!",
            "version", "1.0.0"
        );
    }
}

