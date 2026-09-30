package com.apkatiffine.service;

import com.apkatiffine.dto.LicenseUpdateDTO;
import com.apkatiffine.model.Order;
import com.apkatiffine.model.TiffinCenter;
import com.apkatiffine.model.User;
import com.apkatiffine.repository.OrderRepository;
import com.apkatiffine.repository.TiffinCenterRepository;
import com.apkatiffine.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class AdminService {

    @Autowired
    private TiffinCenterRepository tiffinCenterRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    public List<TiffinCenter> getAllTiffinCenters() {
        return tiffinCenterRepository.findAll();
    }

    public List<TiffinCenter> getCentersByStatus(String status) {
        return tiffinCenterRepository.findByStatus(status);
    }

    @Autowired
    private EmailService emailService;

    public TiffinCenter updateCenterStatus(Long centerId, String status) {
        TiffinCenter center = tiffinCenterRepository.findById(centerId)
                .orElseThrow(() -> new RuntimeException("Tiffin Center not found with id: " + centerId));
        center.setStatus(status.toUpperCase());
        TiffinCenter saved = tiffinCenterRepository.save(center);

        if ("APPROVED".equalsIgnoreCase(status)) {
            try {
                emailService.sendVendorApprovalEmail(saved);
            } catch (Exception e) {
                System.err.println("Approval email dispatch error: " + e.getMessage());
            }
        }
        return saved;
    }

    public TiffinCenter updateCenterLicense(Long centerId, LicenseUpdateDTO dto) {
        TiffinCenter center = tiffinCenterRepository.findById(centerId)
                .orElseThrow(() -> new RuntimeException("Tiffin Center not found with id: " + centerId));
        
        if (dto.getActive() != null) {
            center.setLicenseActive(dto.getActive());
        }
        if (dto.getLicenseType() != null && !dto.getLicenseType().trim().isEmpty()) {
            center.setLicenseType(dto.getLicenseType().trim());
        }
        if (dto.getExtensionMonths() != null && dto.getExtensionMonths() > 0) {
            LocalDateTime currentExpiry = center.getLicenseExpiryDate();
            if (currentExpiry == null || currentExpiry.isBefore(LocalDateTime.now())) {
                currentExpiry = LocalDateTime.now();
            }
            center.setLicenseExpiryDate(currentExpiry.plusMonths(dto.getExtensionMonths()));
            center.setLicenseActive(true);
        }
        if (dto.getPaymentAmount() != null) {
            center.setLastLicensePaymentAmount(dto.getPaymentAmount());
            center.setLastLicensePaymentDate(LocalDateTime.now());
        }
        return tiffinCenterRepository.save(center);
    }

    public List<Order> getAllInvoices() {
        return orderRepository.findAll();
    }

    public Map<String, Object> getShopMonitoringMetrics() {
        List<TiffinCenter> centers = tiffinCenterRepository.findAll();
        List<Order> orders = orderRepository.findAll();

        double totalRevenue = orders.stream().mapToDouble(Order::getTotalAmount).sum();
        long totalOrders = orders.size();

        long activeCentersCount = centers.stream()
                .filter(c -> "APPROVED".equalsIgnoreCase(c.getStatus()) && c.isLicenseActive() && c.getLicenseExpiryDate() != null && c.getLicenseExpiryDate().isAfter(LocalDateTime.now()))
                .count();

        long expiredCentersCount = centers.stream()
                .filter(c -> c.getLicenseExpiryDate() != null && c.getLicenseExpiryDate().isBefore(LocalDateTime.now()))
                .count();

        List<Map<String, Object>> centerStats = new ArrayList<>();
        for (TiffinCenter center : centers) {
            List<Order> centerOrders = orderRepository.findByTiffinCenterId(center.getId());
            double centerRevenue = centerOrders.stream().mapToDouble(Order::getTotalAmount).sum();

            Map<String, Object> stat = new HashMap<>();
            stat.put("centerId", center.getId());
            stat.put("centerName", center.getCenterName());
            stat.put("ownerName", center.getOwnerName());
            stat.put("phone", center.getPhone());
            stat.put("city", center.getCity());
            stat.put("status", center.getStatus());
            stat.put("licenseActive", center.isLicenseActive());
            stat.put("licenseType", center.getLicenseType());
            stat.put("licenseExpiryDate", center.getLicenseExpiryDate());
            stat.put("isExpired", center.getLicenseExpiryDate() == null || center.getLicenseExpiryDate().isBefore(LocalDateTime.now()));
            stat.put("totalOrdersCount", centerOrders.size());
            stat.put("totalRevenueEarned", centerRevenue);
            stat.put("lastPaymentAmount", center.getLastLicensePaymentAmount());
            stat.put("lastPaymentDate", center.getLastLicensePaymentDate());
            centerStats.add(stat);
        }

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalPlatformRevenue", totalRevenue);
        metrics.put("totalOrdersPlaced", totalOrders);
        metrics.put("totalTiffinCenters", centers.size());
        metrics.put("activeCentersCount", activeCentersCount);
        metrics.put("expiredCentersCount", expiredCentersCount);
        metrics.put("centerStats", centerStats);

        return metrics;
    }

    public User updateVendorCredential(Long userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        if (newPassword != null && !newPassword.trim().isEmpty()) {
            user.setPassword(newPassword.trim());
        }
        return userRepository.save(user);
    }

    public void deleteTiffinCenter(Long centerId) {
        TiffinCenter center = tiffinCenterRepository.findById(centerId)
                .orElseThrow(() -> new RuntimeException("Tiffin Center not found with id: " + centerId));
        User user = center.getUser();
        tiffinCenterRepository.delete(center);
        if (user != null) {
            userRepository.delete(user);
        }
    }
}
