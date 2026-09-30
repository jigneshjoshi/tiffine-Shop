package com.apkatiffine.controller;

import com.apkatiffine.dto.LoginRequest;
import com.apkatiffine.dto.LoginResponse;
import com.apkatiffine.dto.UserRegisterDTO;
import com.apkatiffine.dto.VendorRegisterDTO;
import com.apkatiffine.model.TiffinCenter;
import com.apkatiffine.model.User;
import com.apkatiffine.service.AuthService;
import com.apkatiffine.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/register-user")
    public ResponseEntity<?> registerUser(@RequestBody UserRegisterDTO dto) {
        try {
            User user = authService.registerUser(dto);
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "User registered successfully");
            resp.put("user", user);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/register-vendor")
    public ResponseEntity<?> registerVendor(
            @RequestPart("vendor") VendorRegisterDTO dto,
            @RequestPart(value = "aadhaarDoc", required = false) MultipartFile aadhaarDoc,
            @RequestPart(value = "panDoc", required = false) MultipartFile panDoc,
            @RequestPart(value = "fssaiDoc", required = false) MultipartFile fssaiDoc,
            @RequestPart(value = "declarationDoc", required = false) MultipartFile declarationDoc) {
        try {
            String aadhaarUrl = fileStorageService.storeFile(aadhaarDoc);
            String panUrl = fileStorageService.storeFile(panDoc);
            String fssaiUrl = fileStorageService.storeFile(fssaiDoc);
            String declarationUrl = fileStorageService.storeFile(declarationDoc);

            TiffinCenter center = authService.registerVendor(dto, aadhaarUrl, panUrl, fssaiUrl, declarationUrl);

            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Tiffin Center registration submitted successfully! Awaiting Admin approval.");
            resp.put("tiffinCenter", center);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> payload) {
        try {
            String email = payload.get("email");
            if (email == null || email.trim().isEmpty()) {
                throw new RuntimeException("Please enter a valid email address.");
            }
            String msg = authService.requestPasswordReset(email.trim());
            Map<String, String> resp = new HashMap<>();
            resp.put("message", msg);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> payload) {
        try {
            String email = payload.get("email");
            String code = payload.get("code");
            String newPassword = payload.get("newPassword");

            if (email == null || code == null || newPassword == null) {
                throw new RuntimeException("Email, reset code, and new password are required.");
            }

            String msg = authService.resetPasswordWithCode(email, code, newPassword);
            Map<String, String> resp = new HashMap<>();
            resp.put("message", msg);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }
}
