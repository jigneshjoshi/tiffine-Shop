package com.apkatiffine.controller;

import com.apkatiffine.dto.LicenseUpdateDTO;
import com.apkatiffine.dto.StatusUpdateDTO;
import com.apkatiffine.model.Order;
import com.apkatiffine.model.TiffinCenter;
import com.apkatiffine.model.User;
import com.apkatiffine.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/centers")
    public ResponseEntity<List<TiffinCenter>> getAllCenters(@RequestParam(value = "status", required = false) String status) {
        if (status != null && !status.trim().isEmpty()) {
            return ResponseEntity.ok(adminService.getCentersByStatus(status.toUpperCase()));
        }
        return ResponseEntity.ok(adminService.getAllTiffinCenters());
    }

    @PutMapping("/centers/{id}/status")
    public ResponseEntity<?> updateCenterStatus(@PathVariable("id") Long id, @RequestBody StatusUpdateDTO dto) {
        try {
            TiffinCenter center = adminService.updateCenterStatus(id, dto.getStatus());
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Tiffin Center status updated to " + center.getStatus());
            resp.put("center", center);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PutMapping("/centers/{id}/license")
    public ResponseEntity<?> updateCenterLicense(@PathVariable("id") Long id, @RequestBody LicenseUpdateDTO dto) {
        try {
            TiffinCenter center = adminService.updateCenterLicense(id, dto);
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "License updated successfully for " + center.getCenterName());
            resp.put("center", center);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @GetMapping("/invoices")
    public ResponseEntity<List<Order>> getAllInvoices() {
        return ResponseEntity.ok(adminService.getAllInvoices());
    }

    @GetMapping("/monitoring")
    public ResponseEntity<Map<String, Object>> getShopMonitoringMetrics() {
        return ResponseEntity.ok(adminService.getShopMonitoringMetrics());
    }

    @PutMapping("/vendors/{userId}/credential")
    public ResponseEntity<?> updateVendorCredential(@PathVariable("userId") Long userId, @RequestBody StatusUpdateDTO dto) {
        try {
            User user = adminService.updateVendorCredential(userId, dto.getPassword());
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Vendor password updated successfully");
            resp.put("userId", user.getId());
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @DeleteMapping("/centers/{id}")
    public ResponseEntity<?> deleteCenter(@PathVariable("id") Long id) {
        try {
            adminService.deleteTiffinCenter(id);
            Map<String, String> resp = new HashMap<>();
            resp.put("message", "Tiffin Center deleted successfully");
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }
}
