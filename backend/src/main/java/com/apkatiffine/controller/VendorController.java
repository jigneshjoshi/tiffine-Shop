package com.apkatiffine.controller;

import com.apkatiffine.dto.AttendanceUpdateDTO;
import com.apkatiffine.dto.StatusUpdateDTO;
import com.apkatiffine.dto.TiffinItemDTO;
import com.apkatiffine.model.Order;
import com.apkatiffine.model.TiffinAttendance;
import com.apkatiffine.model.TiffinItem;
import com.apkatiffine.service.FileStorageService;
import com.apkatiffine.service.VendorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vendor")
public class VendorController {

    @Autowired
    private VendorService vendorService;

    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping("/tiffins")
    public ResponseEntity<?> addTiffinItem(
            @RequestPart("item") TiffinItemDTO dto,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        try {
            String imageUrl = fileStorageService.storeFile(image);
            TiffinItem item = vendorService.addTiffinItem(dto, imageUrl);
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Tiffin item added successfully");
            resp.put("tiffin", item);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @GetMapping("/centers/{centerId}/tiffins")
    public ResponseEntity<List<TiffinItem>> getCenterTiffins(@PathVariable("centerId") Long centerId) {
        return ResponseEntity.ok(vendorService.getTiffinItemsByCenter(centerId));
    }

    @PutMapping("/tiffins/{id}/toggle")
    public ResponseEntity<?> toggleAvailability(@PathVariable("id") Long id) {
        try {
            TiffinItem item = vendorService.toggleAvailability(id);
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Tiffin availability updated");
            resp.put("available", item.isAvailable());
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @DeleteMapping("/tiffins/{id}")
    public ResponseEntity<?> deleteTiffinItem(@PathVariable("id") Long id) {
        try {
            vendorService.deleteTiffinItem(id);
            Map<String, String> resp = new HashMap<>();
            resp.put("message", "Tiffin item deleted");
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @GetMapping("/centers/{centerId}/orders")
    public ResponseEntity<List<Order>> getVendorOrders(@PathVariable("centerId") Long centerId) {
        return ResponseEntity.ok(vendorService.getVendorOrders(centerId));
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<?> getOrderById(@PathVariable("orderId") Long orderId) {
        try {
            Order order = vendorService.getOrderById(orderId);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PutMapping("/orders/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable("orderId") Long orderId, @RequestBody StatusUpdateDTO dto) {
        try {
            Order order = vendorService.updateOrderStatus(orderId, dto.getStatus());
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Order status updated to " + order.getOrderStatus());
            resp.put("order", order);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PutMapping("/orders/{orderId}/confirm")
    public ResponseEntity<?> confirmOrder(@PathVariable("orderId") Long orderId) {
        try {
            Order order = vendorService.confirmOrder(orderId);
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Order #" + order.getOrderNumber() + " accepted and confirmed by kitchen!");
            resp.put("order", order);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/orders/bulk-status")
    public ResponseEntity<?> bulkUpdateStatus(@RequestBody Map<String, Object> body) {
        try {
            List<Number> idsRaw = (List<Number>) body.get("orderIds");
            String status = (String) body.get("status");
            List<Long> orderIds = new java.util.ArrayList<>();
            if (idsRaw != null) {
                for (Number n : idsRaw) {
                    orderIds.add(n.longValue());
                }
            }
            List<Order> updatedList;
            if ("CONFIRMED".equalsIgnoreCase(status)) {
                updatedList = vendorService.bulkConfirmOrders(orderIds);
            } else {
                updatedList = vendorService.bulkUpdateOrderStatus(orderIds, status);
            }
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Successfully updated " + updatedList.size() + " orders to " + status);
            resp.put("orders", updatedList);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/centers/{centerId}/renew-license")
    public ResponseEntity<?> renewLicense(@PathVariable("centerId") Long centerId, @RequestBody com.apkatiffine.dto.LicenseUpdateDTO dto) {
        try {
            com.apkatiffine.model.TiffinCenter center = vendorService.renewLicense(centerId, dto);
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "License renewed successfully. Plan active until " + center.getLicenseExpiryDate());
            resp.put("center", center);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PutMapping("/orders/{orderId}/collect-cod")
    public ResponseEntity<?> markCodCollected(@PathVariable("orderId") Long orderId) {
        try {
            Order order = vendorService.markCodCollected(orderId);
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Cash collected successfully for Order #" + order.getOrderNumber());
            resp.put("order", order);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    // Daily Attendance Endpoints
    @PostMapping("/orders/attendance")
    public ResponseEntity<?> markDailyAttendance(@RequestBody AttendanceUpdateDTO dto) {
        try {
            TiffinAttendance attendance = vendorService.markDailyAttendance(dto);
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Attendance marked successfully as " + attendance.getStatus());
            resp.put("attendance", attendance);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @GetMapping("/orders/{orderId}/attendance")
    public ResponseEntity<List<TiffinAttendance>> getOrderAttendance(@PathVariable("orderId") Long orderId) {
        return ResponseEntity.ok(vendorService.getOrderAttendance(orderId));
    }

    @GetMapping("/centers/{centerId}/alerts-15day")
    public ResponseEntity<List<Order>> get15DayUnpaidAlerts(@PathVariable("centerId") Long centerId) {
        return ResponseEntity.ok(vendorService.get15DayUnpaidAlerts(centerId));
    }

    // Vendor / Kitchen Profile Management
    @GetMapping("/centers/{centerId}/profile")
    public ResponseEntity<?> getVendorProfile(@PathVariable("centerId") Long centerId) {
        try {
            com.apkatiffine.model.TiffinCenter center = vendorService.getVendorProfile(centerId);
            return ResponseEntity.ok(center);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PutMapping("/centers/{centerId}/profile")
    public ResponseEntity<?> updateVendorProfile(
            @PathVariable("centerId") Long centerId,
            @RequestBody com.apkatiffine.dto.VendorProfileDTO dto) {
        try {
            com.apkatiffine.model.TiffinCenter updated = vendorService.updateVendorProfile(centerId, dto);
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Kitchen profile updated successfully!");
            resp.put("center", updated);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/centers/{centerId}/media")
    public ResponseEntity<?> updateVendorMedia(
            @PathVariable("centerId") Long centerId,
            @RequestParam(value = "logo", required = false) MultipartFile logo,
            @RequestParam(value = "banner", required = false) MultipartFile banner) {
        try {
            String logoUrl = (logo != null && !logo.isEmpty()) ? fileStorageService.storeFile(logo) : null;
            String bannerUrl = (banner != null && !banner.isEmpty()) ? fileStorageService.storeFile(banner) : null;
            com.apkatiffine.model.TiffinCenter updated = vendorService.updateVendorMedia(centerId, logoUrl, bannerUrl);
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Kitchen media branding updated successfully!");
            resp.put("center", updated);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    // Delivery OTP Handshake Verification Endpoint
    @PostMapping("/orders/{orderId}/verify-delivery-otp")
    public ResponseEntity<?> verifyDeliveryOtp(
            @PathVariable("orderId") Long orderId,
            @RequestBody com.apkatiffine.dto.OtpVerificationDTO dto) {
        try {
            TiffinAttendance attendance = vendorService.verifyDeliveryOtp(orderId, dto);
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "OTP Verified! Today's Meal successfully delivered & attendance logged.");
            resp.put("attendance", attendance);
            resp.put("order", attendance.getOrder());
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    // Owner QR Code Image Upload Endpoint
    @PostMapping("/centers/{centerId}/qr-image")
    public ResponseEntity<?> uploadVendorQrImage(
            @PathVariable("centerId") Long centerId,
            @RequestParam("qrImage") MultipartFile qrImage) {
        try {
            String qrUrl = fileStorageService.storeFile(qrImage);
            com.apkatiffine.model.TiffinCenter updated = vendorService.updateVendorQrImage(centerId, qrUrl);
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Custom UPI QR Code uploaded successfully!");
            resp.put("qrCodeUrl", qrUrl);
            resp.put("center", updated);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    // Owner Payment Proof Verification / Approval Endpoint
    @PutMapping("/orders/{orderId}/verify-payment-proof")
    public ResponseEntity<?> verifyPaymentProof(
            @PathVariable("orderId") Long orderId,
            @RequestBody Map<String, String> body) {
        try {
            String status = body.getOrDefault("status", "VERIFIED");
            String notes = body.getOrDefault("notes", "Payment screenshot verified by owner");
            Order order = vendorService.verifyPaymentProof(orderId, status, notes);
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Payment proof successfully " + ("VERIFIED".equalsIgnoreCase(status) ? "approved and order confirmed!" : "rejected!"));
            resp.put("order", order);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }
}
