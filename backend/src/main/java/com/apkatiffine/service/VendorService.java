package com.apkatiffine.service;

import com.apkatiffine.dto.AttendanceUpdateDTO;
import com.apkatiffine.dto.LicenseUpdateDTO;
import com.apkatiffine.dto.TiffinItemDTO;
import com.apkatiffine.model.Order;
import com.apkatiffine.model.TiffinAttendance;
import com.apkatiffine.model.TiffinCenter;
import com.apkatiffine.model.TiffinItem;
import com.apkatiffine.repository.OrderRepository;
import com.apkatiffine.repository.TiffinAttendanceRepository;
import com.apkatiffine.repository.TiffinCenterRepository;
import com.apkatiffine.repository.TiffinItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class VendorService {

    @Autowired
    private TiffinCenterRepository tiffinCenterRepository;

    @Autowired
    private TiffinItemRepository tiffinItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private TiffinAttendanceRepository attendanceRepository;

    public TiffinItem addTiffinItem(TiffinItemDTO dto, String imageUrl) {
        TiffinCenter center = tiffinCenterRepository.findById(dto.getTiffinCenterId())
                .orElseThrow(() -> new RuntimeException("Tiffin Center not found with id: " + dto.getTiffinCenterId()));

        TiffinItem item = new TiffinItem();
        item.setTiffinCenter(center);
        item.setTitle(dto.getTitle());
        item.setDescription(dto.getDescription());
        item.setCategory(dto.getCategory().toUpperCase());
        item.setDishes(dto.getDishes());
        item.setPricePerDay(dto.getPricePerDay());
        item.setPricePerMonth(dto.getPricePerMonth());

        if (imageUrl != null && !imageUrl.isEmpty()) {
            item.setImageUrl(imageUrl);
        } else {
            item.setImageUrl("/uploads/default-tiffin.jpg");
        }

        item.setAvailable(true);

        return tiffinItemRepository.save(item);
    }

    public List<TiffinItem> getTiffinItemsByCenter(Long centerId) {
        return tiffinItemRepository.findByTiffinCenterId(centerId);
    }

    public TiffinItem toggleAvailability(Long itemId) {
        TiffinItem item = tiffinItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Tiffin Item not found with id: " + itemId));
        item.setAvailable(!item.isAvailable());
        return tiffinItemRepository.save(item);
    }

    public void deleteTiffinItem(Long itemId) {
        tiffinItemRepository.deleteById(itemId);
    }

    public List<Order> getVendorOrders(Long centerId) {
        List<Order> list = orderRepository.findByTiffinCenterIdOrderByCreatedAtDesc(centerId);
        for (Order o : list) {
            if (o.getCurrentDeliveryOtp() == null || o.getCurrentDeliveryOtp().trim().isEmpty()) {
                o.setCurrentDeliveryOtp(Order.generateOtp());
                orderRepository.save(o);
            }
        }
        return list;
    }

    public Order getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
        if (order.getCurrentDeliveryOtp() == null || order.getCurrentDeliveryOtp().trim().isEmpty()) {
            order.setCurrentDeliveryOtp(Order.generateOtp());
            orderRepository.save(order);
        }
        return order;
    }

    public Order confirmOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
        order.setOrderStatus("CONFIRMED");
        return orderRepository.save(order);
    }

    public List<Order> bulkConfirmOrders(List<Long> orderIds) {
        List<Order> updatedOrders = new java.util.ArrayList<>();
        for (Long id : orderIds) {
            try {
                updatedOrders.add(confirmOrder(id));
            } catch (Exception ignored) {}
        }
        return updatedOrders;
    }

    public List<Order> bulkUpdateOrderStatus(List<Long> orderIds, String status) {
        List<Order> updatedOrders = new java.util.ArrayList<>();
        for (Long id : orderIds) {
            try {
                updatedOrders.add(updateOrderStatus(id, status));
            } catch (Exception ignored) {}
        }
        return updatedOrders;
    }

    public Order updateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
        String upperStatus = status.toUpperCase();
        order.setOrderStatus(upperStatus);
        if ("CANCELLED".equalsIgnoreCase(upperStatus)) {
            order.setCancelledBy("VENDOR (" + (order.getTiffinCenter() != null ? order.getTiffinCenter().getCenterName() : "Tiffin Kitchen") + ")");
            order.setCancelledAt(LocalDateTime.now());
            if (order.getCancellationReason() == null || order.getCancellationReason().trim().isEmpty()) {
                order.setCancellationReason("Cancelled / Unable to prepare by Tiffin Center");
            }
        }
        return orderRepository.save(order);
    }

    public TiffinCenter renewLicense(Long centerId, LicenseUpdateDTO dto) {
        TiffinCenter center = tiffinCenterRepository.findById(centerId)
                .orElseThrow(() -> new RuntimeException("Tiffin Center not found with id: " + centerId));

        int months = (dto.getExtensionMonths() != null && dto.getExtensionMonths() > 0) ? dto.getExtensionMonths() : 1;
        LocalDateTime currentExpiry = center.getLicenseExpiryDate();
        if (currentExpiry == null || currentExpiry.isBefore(LocalDateTime.now())) {
            currentExpiry = LocalDateTime.now();
        }
        center.setLicenseExpiryDate(currentExpiry.plusMonths(months));
        center.setLicenseActive(true);
        if (dto.getPaymentAmount() != null) {
            center.setLastLicensePaymentAmount(dto.getPaymentAmount());
        } else {
            center.setLastLicensePaymentAmount((months == 12) ? 2999.0 : 499.0 * months);
        }
        center.setLastLicensePaymentDate(LocalDateTime.now());
        return tiffinCenterRepository.save(center);
    }

    public Order markCodCollected(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
        order.setPaymentStatus("PAID");
        return orderRepository.save(order);
    }

    // Daily Attendance Management & 15-Day Calculation Logic
    public TiffinAttendance markDailyAttendance(AttendanceUpdateDTO dto) {
        Order order = orderRepository.findById(dto.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + dto.getOrderId()));

        LocalDate attendanceDate = dto.getDate() != null ? LocalDate.parse(dto.getDate()) : LocalDate.now();

        Optional<TiffinAttendance> existing = attendanceRepository.findByOrderIdAndAttendanceDate(order.getId(), attendanceDate);
        TiffinAttendance attendance;
        if (existing.isPresent()) {
            attendance = existing.get();
            attendance.setStatus(dto.getStatus().toUpperCase());
            attendance.setNotes(dto.getNotes());
        } else {
            attendance = new TiffinAttendance(order, attendanceDate, dto.getStatus().toUpperCase(), dto.getNotes(), order.getTiffinCenter().getOwnerName());
        }

        TiffinAttendance savedAttendance = attendanceRepository.save(attendance);

        // Recalculate order attendance statistics
        long deliveredCount = attendanceRepository.countByOrderIdAndStatus(order.getId(), "DELIVERED");
        long skippedCount = attendanceRepository.countByOrderIdAndStatus(order.getId(), "SKIPPED");

        order.setDeliveredDaysCount((int) deliveredCount);
        order.setSkippedDaysCount((int) skippedCount);

        // Calculate 15-Day Attendance Billing
        double rate = order.getPricePerDayRate() > 0 ? order.getPricePerDayRate() : (order.getTiffinItem() != null ? order.getTiffinItem().getPricePerDay() : 100.0);
        double calculatedDue = deliveredCount * rate;
        order.setDueAmount15Day(calculatedDue);

        // Trigger 15-Day Payment Alert if 15 days reached or attendance >= 15
        if ("HALF_15DAY_POSTPAID".equalsIgnoreCase(order.getPaymentOption()) && deliveredCount >= 15 && !"PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            order.set15DayPaymentPending(true);
            order.setPaymentStatus("PARTIAL_15DAY_PENDING");
        }

        orderRepository.save(order);
        return savedAttendance;
    }

    public List<TiffinAttendance> getOrderAttendance(Long orderId) {
        return attendanceRepository.findByOrderIdOrderByAttendanceDateAsc(orderId);
    }

    public List<Order> get15DayUnpaidAlerts(Long centerId) {
        List<Order> orders = orderRepository.findByTiffinCenterIdOrderByCreatedAtDesc(centerId);
        return orders.stream()
                .filter(o -> o.is15DayPaymentPending() || ("HALF_15DAY_POSTPAID".equalsIgnoreCase(o.getPaymentOption()) && o.getDeliveredDaysCount() >= 15 && !"PAID".equalsIgnoreCase(o.getPaymentStatus())))
                .collect(Collectors.toList());
    }

    public TiffinCenter getVendorProfile(Long centerId) {
        return tiffinCenterRepository.findById(centerId)
                .orElseThrow(() -> new RuntimeException("Tiffin Center not found with id: " + centerId));
    }

    public TiffinCenter updateVendorProfile(Long centerId, com.apkatiffine.dto.VendorProfileDTO dto) {
        TiffinCenter center = getVendorProfile(centerId);
        if (dto.getCenterName() != null && !dto.getCenterName().trim().isEmpty()) {
            center.setCenterName(dto.getCenterName().trim());
        }
        if (dto.getOwnerName() != null && !dto.getOwnerName().trim().isEmpty()) {
            center.setOwnerName(dto.getOwnerName().trim());
        }
        if (dto.getPhone() != null && !dto.getPhone().trim().isEmpty()) {
            center.setPhone(dto.getPhone().trim());
        }
        if (dto.getAltPhone() != null) {
            center.setAltPhone(dto.getAltPhone().trim());
        }
        if (dto.getAddress() != null) {
            center.setAddress(dto.getAddress().trim());
        }
        if (dto.getArea() != null) {
            center.setArea(dto.getArea().trim());
        }
        if (dto.getCity() != null) {
            center.setCity(dto.getCity().trim());
        }
        if (dto.getPincode() != null) {
            center.setPincode(dto.getPincode().trim());
        }
        if (dto.getDescription() != null) {
            center.setDescription(dto.getDescription().trim());
        }
        if (dto.getCuisines() != null) {
            center.setCuisines(dto.getCuisines().trim());
        }
        if (dto.getDeliveryTimings() != null) {
            center.setDeliveryTimings(dto.getDeliveryTimings().trim());
        }
        if (dto.getPureVeg() != null) {
            center.setPureVeg(dto.getPureVeg());
        }
        if (dto.getLogoUrl() != null && !dto.getLogoUrl().trim().isEmpty()) {
            center.setLogoUrl(dto.getLogoUrl().trim());
        }
        if (dto.getBannerUrl() != null && !dto.getBannerUrl().trim().isEmpty()) {
            center.setBannerUrl(dto.getBannerUrl().trim());
        }

        // Update Payment Configuration
        if (dto.getCustomQrEnabled() != null) {
            center.setCustomQrEnabled(dto.getCustomQrEnabled());
        }
        if (dto.getCustomQrCodeUrl() != null) {
            center.setCustomQrCodeUrl(dto.getCustomQrCodeUrl().trim());
        }
        if (dto.getCustomUpiId() != null) {
            center.setCustomUpiId(dto.getCustomUpiId().trim());
        }
        if (dto.getCustomUpiName() != null) {
            center.setCustomUpiName(dto.getCustomUpiName().trim());
        }
        if (dto.getCustomQrInstructions() != null) {
            center.setCustomQrInstructions(dto.getCustomQrInstructions().trim());
        }
        if (dto.getPaytmGatewayEnabled() != null) {
            center.setPaytmGatewayEnabled(dto.getPaytmGatewayEnabled());
        }
        if (dto.getPaytmMerchantId() != null) {
            center.setPaytmMerchantId(dto.getPaytmMerchantId().trim());
        }
        if (dto.getPaytmMerchantKey() != null) {
            center.setPaytmMerchantKey(dto.getPaytmMerchantKey().trim());
        }
        if (dto.getPaytmMerchantVpa() != null) {
            center.setPaytmMerchantVpa(dto.getPaytmMerchantVpa().trim());
        }
        if (dto.getPaytmEnvironment() != null) {
            center.setPaytmEnvironment(dto.getPaytmEnvironment().trim().toUpperCase());
        }
        if (dto.getCodEnabled() != null) {
            center.setCodEnabled(dto.getCodEnabled());
        }

        return tiffinCenterRepository.save(center);
    }

    public TiffinCenter updateVendorMedia(Long centerId, String logoUrl, String bannerUrl) {
        TiffinCenter center = getVendorProfile(centerId);
        if (logoUrl != null && !logoUrl.trim().isEmpty()) {
            center.setLogoUrl(logoUrl.trim());
        }
        if (bannerUrl != null && !bannerUrl.trim().isEmpty()) {
            center.setBannerUrl(bannerUrl.trim());
        }
        return tiffinCenterRepository.save(center);
    }

    public TiffinCenter updateVendorQrImage(Long centerId, String qrImageUrl) {
        TiffinCenter center = getVendorProfile(centerId);
        if (qrImageUrl != null && !qrImageUrl.trim().isEmpty()) {
            center.setCustomQrCodeUrl(qrImageUrl.trim());
        }
        return tiffinCenterRepository.save(center);
    }

    public Order verifyPaymentProof(Long orderId, String status, String notes) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        String upperStatus = (status != null) ? status.trim().toUpperCase() : "VERIFIED";
        if ("VERIFIED".equalsIgnoreCase(upperStatus) || "APPROVE".equalsIgnoreCase(upperStatus) || "APPROVED".equalsIgnoreCase(upperStatus)) {
            order.setPaymentProofStatus("VERIFIED");
            order.setPaymentStatus("PAID");
            order.setOrderStatus("CONFIRMED");
            order.setPaymentProofVerifiedAt(LocalDateTime.now());
            order.setPaymentProofNotes(notes != null && !notes.trim().isEmpty() ? notes.trim() : "Payment screenshot verified by kitchen owner.");
        } else {
            order.setPaymentProofStatus("REJECTED");
            order.setPaymentStatus("PAYMENT_REJECTED");
            order.setPaymentProofVerifiedAt(LocalDateTime.now());
            order.setPaymentProofNotes(notes != null && !notes.trim().isEmpty() ? notes.trim() : "Payment screenshot could not be verified. Please contact tiffin center.");
        }

        return orderRepository.save(order);
    }

    // OTP Handshake Delivery Verification
    public TiffinAttendance verifyDeliveryOtp(Long orderId, com.apkatiffine.dto.OtpVerificationDTO dto) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        if ("CANCELLED".equalsIgnoreCase(order.getOrderStatus())) {
            throw new RuntimeException("Cannot verify delivery: This order has been cancelled.");
        }

        String submittedOtp = dto.getOtp() != null ? dto.getOtp().trim() : "";
        String expectedOtp = order.getCurrentDeliveryOtp();

        if (expectedOtp == null || expectedOtp.trim().isEmpty()) {
            expectedOtp = Order.generateOtp();
            order.setCurrentDeliveryOtp(expectedOtp);
        }

        if (!expectedOtp.equalsIgnoreCase(submittedOtp)) {
            throw new RuntimeException("Invalid Delivery OTP: The OTP provided (" + submittedOtp + ") does not match the Customer's active delivery code. Please check Customer Dashboard.");
        }

        LocalDate attendanceDate = (dto.getDate() != null && !dto.getDate().trim().isEmpty()) ? LocalDate.parse(dto.getDate()) : LocalDate.now();

        Optional<TiffinAttendance> existing = attendanceRepository.findByOrderIdAndAttendanceDate(order.getId(), attendanceDate);
        TiffinAttendance attendance;
        String noteText = (dto.getNotes() != null && !dto.getNotes().trim().isEmpty())
                ? dto.getNotes().trim()
                : "Meal delivered successfully via Customer OTP Handshake (" + submittedOtp + ")";

        if (existing.isPresent()) {
            attendance = existing.get();
            attendance.setStatus("DELIVERED");
            attendance.setNotes(noteText);
            attendance.setDeliveryOtp(submittedOtp);
            attendance.setOtpVerified(true);
            attendance.setDeliveredAt(LocalDateTime.now());
            attendance.setMarkedBy("OTP HANDSHAKE (Vendor & Customer)");
        } else {
            attendance = new TiffinAttendance(order, attendanceDate, "DELIVERED", noteText, "OTP HANDSHAKE (Vendor & Customer)", submittedOtp, true);
        }

        TiffinAttendance savedAttendance = attendanceRepository.save(attendance);

        // Update Order State & generate fresh OTP for upcoming day
        order.setTodayOtpVerified(true);
        order.setLastDeliveredDate(attendanceDate);
        order.setCurrentDeliveryOtp(Order.generateOtp());

        long deliveredCount = attendanceRepository.countByOrderIdAndStatus(order.getId(), "DELIVERED");
        long skippedCount = attendanceRepository.countByOrderIdAndStatus(order.getId(), "SKIPPED");
        order.setDeliveredDaysCount((int) deliveredCount);
        order.setSkippedDaysCount((int) skippedCount);

        double rate = order.getPricePerDayRate() > 0 ? order.getPricePerDayRate() : (order.getTiffinItem() != null ? order.getTiffinItem().getPricePerDay() : 100.0);
        order.setDueAmount15Day(deliveredCount * rate);

        int totalPlanDays = 1;
        if ("MONTHLY".equalsIgnoreCase(order.getPlanType()) || "30_DAYS".equalsIgnoreCase(order.getPlanType())) {
            totalPlanDays = 30;
        } else if ("15_DAYS".equalsIgnoreCase(order.getPlanType()) || "15DAYS".equalsIgnoreCase(order.getPlanType())) {
            totalPlanDays = 15;
        }

        if (deliveredCount >= totalPlanDays || "1_DAY".equalsIgnoreCase(order.getPlanType()) || "DAILY".equalsIgnoreCase(order.getPlanType())) {
            order.setOrderStatus("DELIVERED");
        } else {
            order.setOrderStatus("CONFIRMED");
        }

        if ("HALF_15DAY_POSTPAID".equalsIgnoreCase(order.getPaymentOption()) && deliveredCount >= 15 && !"PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            order.set15DayPaymentPending(true);
            order.setPaymentStatus("PARTIAL_15DAY_PENDING");
        }

        orderRepository.save(order);
        return savedAttendance;
    }
}
