package com.apkatiffine.service;

import com.apkatiffine.dto.LoginRequest;
import com.apkatiffine.dto.LoginResponse;
import com.apkatiffine.dto.UserRegisterDTO;
import com.apkatiffine.dto.VendorRegisterDTO;
import com.apkatiffine.model.Role;
import com.apkatiffine.model.TiffinCenter;
import com.apkatiffine.model.User;
import com.apkatiffine.repository.TiffinCenterRepository;
import com.apkatiffine.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TiffinCenterRepository tiffinCenterRepository;

    public LoginResponse login(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (!userOpt.isPresent()) {
            throw new RuntimeException("Invalid email or password");
        }
        User user = userOpt.get();
        if (!user.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }
        if (!user.isEnabled()) {
            throw new RuntimeException("Account is disabled by system administrator.");
        }

        LoginResponse response = new LoginResponse();
        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        response.setRole(user.getRole());
        response.setProfileImageUrl(user.getProfileImageUrl());
        response.setAddress(user.getAddress());
        response.setCity(user.getCity());
        response.setPincode(user.getPincode());
        response.setDietaryPreference(user.getDietaryPreference());
        response.setSpecialNotes(user.getSpecialNotes());
        response.setMessage("Login Successful");

        if (user.getRole() == Role.VENDOR) {
            Optional<TiffinCenter> centerOpt = tiffinCenterRepository.findByUserId(user.getId());
            if (centerOpt.isPresent()) {
                TiffinCenter center = centerOpt.get();
                response.setTiffinCenterId(center.getId());
                response.setTiffinCenterStatus(center.getStatus());
            }
        }

        return response;
    }

    public User registerUser(UserRegisterDTO dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email is already registered");
        }

        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setPassword(dto.getPassword());
        user.setRole(Role.USER);
        user.setEnabled(true);

        return userRepository.save(user);
    }

    public TiffinCenter registerVendor(VendorRegisterDTO dto, String aadhaarUrl, String panUrl, String fssaiUrl, String declarationUrl) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email is already registered");
        }

        // Create User account for Vendor
        User user = new User();
        user.setName(dto.getOwnerName());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setPassword(dto.getPassword());
        user.setRole(Role.VENDOR);
        user.setEnabled(true);
        user = userRepository.save(user);

        // Create Tiffin Center record
        TiffinCenter center = new TiffinCenter();
        center.setUser(user);
        center.setCenterName(dto.getCenterName());
        center.setOwnerName(dto.getOwnerName());
        center.setPhone(dto.getPhone());
        center.setAltPhone(dto.getAltPhone());
        center.setAddress(dto.getAddress());
        center.setArea(dto.getArea());
        center.setCity(dto.getCity());
        center.setPincode(dto.getPincode());
        center.setLatitude(dto.getLatitude());
        center.setLongitude(dto.getLongitude());
        center.setAadhaarNo(dto.getAadhaarNo());
        center.setPanNo(dto.getPanNo());
        center.setFssaiNo(dto.getFssaiNo());
        center.setDeclarationAccepted(dto.isDeclarationAccepted());

        center.setAadhaarDocUrl(aadhaarUrl);
        center.setPanDocUrl(panUrl);
        center.setFssaiDocUrl(fssaiUrl);
        center.setDeclarationDocUrl(declarationUrl);

        center.setStatus("PENDING"); // Pending document verification by Admin

        return tiffinCenterRepository.save(center);
    }

    @Autowired
    private EmailService emailService;

    // In-memory OTP cache for password reset
    private final java.util.Map<String, String> resetCodeCache = new java.util.concurrent.ConcurrentHashMap<>();

    public String requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No user found with email: " + email));

        String code = String.valueOf((int) ((Math.random() * 900000) + 100000));
        resetCodeCache.put(email.toLowerCase().trim(), code);

        try {
            emailService.sendPasswordResetEmail(user.getEmail(), code);
        } catch (Exception e) {
            System.err.println("Password reset email dispatch error: " + e.getMessage());
        }

        return "Password reset code sent to " + email;
    }

    public String resetPasswordWithCode(String email, String code, String newPassword) {
        String cachedCode = resetCodeCache.get(email.toLowerCase().trim());
        if (cachedCode == null || !cachedCode.equals(code.trim())) {
            throw new RuntimeException("Invalid or expired password reset code.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found."));

        user.setPassword(newPassword.trim());
        userRepository.save(user);
        resetCodeCache.remove(email.toLowerCase().trim());

        return "Password updated successfully! You can now log in with your new password.";
    }
}
