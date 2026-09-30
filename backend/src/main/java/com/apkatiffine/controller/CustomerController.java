package com.apkatiffine.controller;

import com.apkatiffine.dto.OrderRequestDTO;
import com.apkatiffine.model.Order;
import com.apkatiffine.model.TiffinAttendance;
import com.apkatiffine.model.TiffinCenter;
import com.apkatiffine.model.TiffinItem;
import com.apkatiffine.service.CustomerService;
import com.apkatiffine.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer")
@CrossOrigin(origins = "*")
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    @Autowired
    private FileStorageService fileStorageService;

    @GetMapping("/centers")
    public ResponseEntity<List<TiffinCenter>> searchCenters(
            @RequestParam(value = "area", required = false) String area,
            @RequestParam(value = "city", required = false) String city) {
        return ResponseEntity.ok(customerService.searchCenters(area, city));
    }

    @GetMapping("/centers/{centerId}/tiffins")
    public ResponseEntity<List<TiffinItem>> getCenterItems(@PathVariable("centerId") Long centerId) {
        return ResponseEntity.ok(customerService.getCenterItems(centerId));
    }

    @GetMapping("/tiffins/{itemId}")
    public ResponseEntity<?> getTiffinDetails(@PathVariable("itemId") Long itemId) {
        try {
            TiffinItem item = customerService.getTiffinItemById(itemId);
            return ResponseEntity.ok(item);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/orders")
    public ResponseEntity<?> placeOrder(@RequestBody OrderRequestDTO dto) {
        try {
            Order order = customerService.placeOrder(dto);
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Order placed successfully!");
            resp.put("order", order);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @GetMapping("/users/{userId}/orders")
    public ResponseEntity<List<Order>> getUserOrders(@PathVariable("userId") Long userId) {
        return ResponseEntity.ok(customerService.getUserOrders(userId));
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<?> getOrderById(@PathVariable("orderId") Long orderId) {
        try {
            Order order = customerService.getOrderById(orderId);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @GetMapping("/orders/{orderId}/attendance")
    public ResponseEntity<List<TiffinAttendance>> getOrderAttendance(@PathVariable("orderId") Long orderId) {
        return ResponseEntity.ok(customerService.getOrderAttendance(orderId));
    }

    @PostMapping("/orders/attendance")
    public ResponseEntity<?> customerMarkAttendance(@RequestBody com.apkatiffine.dto.AttendanceUpdateDTO dto) {
        try {
            TiffinAttendance att = customerService.customerMarkAttendance(dto);
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Attendance updated successfully!");
            resp.put("attendance", att);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/orders/{orderId}/pay-15day")
    public ResponseEntity<?> pay15DayBill(@PathVariable("orderId") Long orderId, @RequestBody Map<String, String> body) {
        try {
            String paytmTxnId = body.getOrDefault("paytmTxnId", "PTM15DAY_" + System.currentTimeMillis());
            Order order = customerService.pay15DayBill(orderId, paytmTxnId);
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "15-Day Attendance Bill Paid Successfully via Paytm");
            resp.put("order", order);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PutMapping("/orders/{orderId}/cancel")
    public ResponseEntity<?> cancelOrder(
            @PathVariable("orderId") Long orderId,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String reason = body != null ? body.get("reason") : "Customer cancelled order";
            String cancelledBy = body != null ? body.get("cancelledBy") : "CUSTOMER";
            Order order = customerService.cancelOrder(orderId, reason, cancelledBy);
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Order #" + order.getOrderNumber() + " has been successfully cancelled.");
            resp.put("order", order);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    // Profile Management Endpoints
    @GetMapping("/profile/{userId}")
    public ResponseEntity<?> getUserProfile(@PathVariable("userId") Long userId) {
        try {
            com.apkatiffine.model.User user = customerService.getUserProfile(userId);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PutMapping("/profile/{userId}")
    public ResponseEntity<?> updateUserProfile(
            @PathVariable("userId") Long userId,
            @RequestBody com.apkatiffine.dto.UserProfileDTO dto) {
        try {
            com.apkatiffine.model.User updated = customerService.updateUserProfile(userId, dto);
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Profile updated successfully!");
            resp.put("user", updated);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/profile/{userId}/photo")
    public ResponseEntity<?> uploadProfilePhoto(
            @PathVariable("userId") Long userId,
            @RequestParam("photo") org.springframework.web.multipart.MultipartFile photo) {
        try {
            String photoUrl = fileStorageService.storeFile(photo);
            com.apkatiffine.model.User user = customerService.updateUserProfilePhoto(userId, photoUrl);
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Profile photo uploaded successfully!");
            resp.put("profileImageUrl", photoUrl);
            resp.put("user", user);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @GetMapping("/orders/{orderId}/daily-otp")
    public ResponseEntity<?> getOrderDailyOtp(@PathVariable("orderId") Long orderId) {
        try {
            Order order = customerService.getOrderById(orderId);
            Map<String, Object> resp = new HashMap<>();
            resp.put("orderId", order.getId());
            resp.put("orderNumber", order.getOrderNumber());
            resp.put("currentDeliveryOtp", order.getCurrentDeliveryOtp());
            resp.put("todayOtpVerified", order.isTodayOtpVerified());
            resp.put("lastDeliveredDate", order.getLastDeliveredDate());
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/orders/{orderId}/submit-payment-proof")
    public ResponseEntity<?> submitPaymentProof(
            @PathVariable("orderId") Long orderId,
            @RequestBody Map<String, String> body) {
        try {
            String screenshotUrl = body.getOrDefault("screenshotUrl", "");
            String referenceNumber = body.getOrDefault("referenceNumber", "");
            if (screenshotUrl == null || screenshotUrl.trim().isEmpty()) {
                Map<String, String> err = new HashMap<>();
                err.put("error", "Payment screenshot URL is required. Please upload your payment proof first.");
                return ResponseEntity.badRequest().body(err);
            }
            Order order = customerService.submitPaymentProof(orderId, screenshotUrl.trim(), referenceNumber != null ? referenceNumber.trim() : "");
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Payment proof submitted! The kitchen owner will verify your screenshot shortly.");
            resp.put("order", order);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    // Step 1: Upload the screenshot to get a URL (multipart)
    @PostMapping("/upload-payment-proof")
    public ResponseEntity<?> uploadPaymentProofImage(
            @RequestParam("screenshot") org.springframework.web.multipart.MultipartFile screenshot) {
        try {
            if (screenshot == null || screenshot.isEmpty()) {
                Map<String, String> err = new HashMap<>();
                err.put("error", "No image file provided. Please choose a valid payment screenshot.");
                return ResponseEntity.badRequest().body(err);
            }
            String proofUrl = fileStorageService.storeFile(screenshot);
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Payment screenshot uploaded successfully!");
            resp.put("screenshotUrl", proofUrl);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }
}


