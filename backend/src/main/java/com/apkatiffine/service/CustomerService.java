package com.apkatiffine.service;

import com.apkatiffine.dto.OrderRequestDTO;
import com.apkatiffine.dto.AttendanceUpdateDTO;
import com.apkatiffine.model.Order;
import com.apkatiffine.model.TiffinAttendance;
import com.apkatiffine.model.TiffinCenter;
import com.apkatiffine.model.TiffinItem;
import com.apkatiffine.model.User;
import com.apkatiffine.repository.OrderRepository;
import com.apkatiffine.repository.TiffinAttendanceRepository;
import com.apkatiffine.repository.TiffinCenterRepository;
import com.apkatiffine.repository.TiffinItemRepository;
import com.apkatiffine.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    @Autowired
    private TiffinCenterRepository tiffinCenterRepository;

    @Autowired
    private TiffinItemRepository tiffinItemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private TiffinAttendanceRepository attendanceRepository;

    @Autowired
    private PaytmService paytmService;

    @Autowired
    private EmailService emailService;

    public List<TiffinCenter> searchCenters(String area, String city) {
        List<TiffinCenter> rawCenters;
        if (area != null && !area.trim().isEmpty()) {
            rawCenters = tiffinCenterRepository.findByAreaContainingIgnoreCaseAndStatus(area.trim(), "APPROVED");
        } else if (city != null && !city.trim().isEmpty()) {
            rawCenters = tiffinCenterRepository.findByCityContainingIgnoreCaseAndStatus(city.trim(), "APPROVED");
        } else {
            rawCenters = tiffinCenterRepository.findByStatus("APPROVED");
        }

        LocalDateTime now = LocalDateTime.now();
        return rawCenters.stream()
                .filter(c -> c.isLicenseActive() && c.getLicenseExpiryDate() != null && c.getLicenseExpiryDate().isAfter(now))
                .collect(Collectors.toList());
    }

    public List<TiffinItem> getCenterItems(Long centerId) {
        return tiffinItemRepository.findByTiffinCenterIdAndAvailableTrue(centerId);
    }

    public TiffinItem getTiffinItemById(Long itemId) {
        return tiffinItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Tiffin Item not found"));
    }

    public Order placeOrder(OrderRequestDTO dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        TiffinCenter center = tiffinCenterRepository.findById(dto.getTiffinCenterId())
                .orElseThrow(() -> new RuntimeException("Tiffin Center not found"));
        TiffinItem item = tiffinItemRepository.findById(dto.getTiffinItemId())
                .orElseThrow(() -> new RuntimeException("Tiffin Item not found"));

        String pMode = dto.getPaymentMode() != null ? dto.getPaymentMode().toUpperCase() : "PAYTM_UPI";
        String pOption = dto.getPaymentOption() != null ? dto.getPaymentOption() : "FULL_UPFRONT";
        String txnId = dto.getPaytmTxnId();

        // 1. If paying via Custom QR Code (Direct UPI) -> Screenshot upload is MANDATORY
        if ("CUSTOM_QR".equalsIgnoreCase(pMode) || "QR_CODE".equalsIgnoreCase(pMode) || "OWNER_QR".equalsIgnoreCase(pMode)) {
            pMode = "CUSTOM_QR";
            if (dto.getPaymentScreenshotUrl() == null || dto.getPaymentScreenshotUrl().trim().isEmpty()) {
                throw new RuntimeException("Payment proof screenshot is mandatory when paying via Tiffin Owner QR Code. Please attach the payment screenshot before confirming your order.");
            }
        } else if (!"COD".equalsIgnoreCase(pMode)) {
            // 2. Real-Money Paytm Gateway Verification Check
            if (txnId == null || txnId.trim().isEmpty()) {
                throw new RuntimeException("Payment Verification Error: Missing Paytm Gateway Transaction ID.");
            }

            Map<String, String> paytmVerificationMap = new HashMap<>();
            paytmVerificationMap.put("TXNID", txnId);
            paytmVerificationMap.put("STATUS", "TXN_SUCCESS");
            paytmVerificationMap.put("ORDERID", "ORD_" + System.currentTimeMillis());

            String centerMerchantKey = (center.getPaytmMerchantKey() != null && !center.getPaytmMerchantKey().trim().isEmpty())
                    ? center.getPaytmMerchantKey().trim() : null;

            boolean isVerified = paytmService.verifyPayment(paytmVerificationMap, centerMerchantKey);
            if (!isVerified) {
                throw new RuntimeException("Order Confirmation Failed: Paytm Bank did not verify real money payment for Transaction ID: " + txnId);
            }
        }

        Order order = new Order();
        order.setOrderNumber("ORD-" + (System.currentTimeMillis() % 1000000));
        order.setUser(user);
        order.setTiffinCenter(center);
        order.setTiffinItem(item);
        order.setPlanType(dto.getPlanType());
        order.setPaymentOption(pOption);
        order.setQuantity(dto.getQuantity() > 0 ? dto.getQuantity() : 1);

        LocalDate now = LocalDate.now();
        order.setStartDate(now);
        String plan = dto.getPlanType() != null ? dto.getPlanType().toUpperCase() : "DAILY";

        if ("MONTHLY".equals(plan) || "30_DAYS".equals(plan)) {
            order.setPlanType("MONTHLY");
            order.setEndDate(now.plusDays(30));
        } else if ("15_DAYS".equals(plan) || "15DAYS".equals(plan) || "15DAY".equals(plan)) {
            order.setPlanType("15_DAYS");
            order.setEndDate(now.plusDays(15));
        } else {
            order.setPlanType("1_DAY");
            order.setEndDate(now);
        }

        order.setDeliveryAddress(dto.getDeliveryAddress());
        order.setArea(dto.getArea());
        order.setPincode(dto.getPincode());

        order.setPricePerDayRate(item.getPricePerDay());
        order.setDeliveredDaysCount(0);
        order.setSkippedDaysCount(0);
        order.setDueAmount15Day(0.0);
        order.set15DayPaymentPending(false);

        // Billing Calculation based on plan (1 Day, 15 Days, Monthly)
        Double basePrice;
        if ("MONTHLY".equals(order.getPlanType())) {
            if ("HALF_15DAY_POSTPAID".equalsIgnoreCase(pOption)) {
                // 15-Day split payment upfront
                basePrice = item.getPricePerDay() * 15;
            } else {
                // Discounted full monthly upfront price
                basePrice = item.getPricePerMonth();
            }
        } else if ("15_DAYS".equals(order.getPlanType())) {
            // 15 days pack is half of monthly price (or 15 days x daily rate)
            basePrice = Math.round((item.getPricePerMonth() / 2.0) * 100.0) / 100.0;
            if (basePrice <= 0) {
                basePrice = item.getPricePerDay() * 15;
            }
        } else {
            // 1 Day single order
            basePrice = item.getPricePerDay();
        }

        Double subtotal = basePrice * order.getQuantity();
        Double gstAmount = Math.round(subtotal * 0.05 * 100.0) / 100.0;
        Double finalTotal = Math.round((subtotal + gstAmount) * 100.0) / 100.0;

        order.setSubtotal(subtotal);
        order.setTaxAmount(gstAmount);
        order.setTotalAmount(dto.getTotalAmount() != null && dto.getTotalAmount() > 0 ? dto.getTotalAmount() : finalTotal);

        order.setPaymentMode(pMode);

        if ("CUSTOM_QR".equalsIgnoreCase(pMode)) {
            order.setPaymentScreenshotUrl(dto.getPaymentScreenshotUrl());
            order.setPaymentReferenceNumber(dto.getPaymentReferenceNumber() != null && !dto.getPaymentReferenceNumber().trim().isEmpty()
                    ? dto.getPaymentReferenceNumber().trim() : ("UPI-REF-" + System.currentTimeMillis()));
            order.setPaytmTxnId(order.getPaymentReferenceNumber());
            order.setPaymentStatus("PENDING_VERIFICATION");
            order.setPaymentProofStatus("AWAITING_VERIFICATION");
        } else if ("COD".equalsIgnoreCase(pMode)) {
            order.setPaytmTxnId("COD-" + System.currentTimeMillis());
            order.setPaymentStatus("PENDING_COD");
            order.setPaymentProofStatus("NOT_APPLICABLE");
        } else {
            order.setPaytmTxnId(txnId != null && !txnId.trim().isEmpty() ? txnId : ("PTM-" + System.currentTimeMillis()));
            order.setPaymentStatus("PAID");
            order.setPaymentProofStatus("VERIFIED");
        }
        order.setOrderStatus("PENDING_CONFIRMATION");

        Order savedOrder = orderRepository.save(order);

        // Trigger Email Notifications (Customer Confirmation & Vendor Alert)
        try {
            emailService.sendOrderConfirmationEmail(savedOrder);
            emailService.sendVendorNewOrderAlert(savedOrder);
        } catch (Exception e) {
            System.err.println("Email dispatch error: " + e.getMessage());
        }

        return savedOrder;
    }

    public List<Order> getUserOrders(Long userId) {
        List<Order> list = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
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
            order = orderRepository.save(order);
        }
        return order;
    }

    public List<TiffinAttendance> getOrderAttendance(Long orderId) {
        return attendanceRepository.findByOrderIdOrderByAttendanceDateAsc(orderId);
    }

    // Customer Daily Attendance & Tiffin Skip with 3-Hour Cutoff Validation & Mandatory Reason
    public TiffinAttendance customerMarkAttendance(AttendanceUpdateDTO dto) {
        Order order = orderRepository.findById(dto.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + dto.getOrderId()));

        LocalDate attendanceDate = dto.getDate() != null ? LocalDate.parse(dto.getDate()) : LocalDate.now();
        LocalDate today = LocalDate.now();

        if (attendanceDate.isBefore(today)) {
            throw new RuntimeException("Cannot modify attendance or skip tiffins for past dates.");
        }

        // 3-Hour Timing Cutoff Rule for Same-Day Changes
        // Lunch Delivery window: 12:00 PM - 1:00 PM (Cut-off is 9:00 AM)
        // Dinner Delivery window: 7:00 PM - 8:30 PM (Cut-off is 4:00 PM / 16:00)
        if (attendanceDate.isEqual(today)) {
            java.time.LocalTime currentTime = java.time.LocalTime.now();
            String mealType = order.getTiffinItem() != null ? order.getTiffinItem().getMealType() : "FULL_DAY";

            if ("LUNCH".equalsIgnoreCase(mealType)) {
                if (currentTime.isAfter(java.time.LocalTime.of(9, 0))) {
                    throw new RuntimeException("Cancellation Closed: Same-day Lunch cancellation is only permitted up to 3 hours before delivery (must cancel before 9:00 AM). Delivery starts at 12:00 PM.");
                }
            } else if ("DINNER".equalsIgnoreCase(mealType)) {
                if (currentTime.isAfter(java.time.LocalTime.of(16, 0))) {
                    throw new RuntimeException("Cancellation Closed: Same-day Dinner cancellation is only permitted up to 3 hours before delivery (must cancel before 4:00 PM). Delivery starts at 7:00 PM.");
                }
            } else { // FULL_DAY
                if (currentTime.isAfter(java.time.LocalTime.of(16, 0))) {
                    throw new RuntimeException("Cancellation Closed: Today's meal cancellation window is now closed (Lunch cutoff was 9:00 AM, Dinner cutoff was 4:00 PM).");
                }
            }
        }

        String status = (dto.getStatus() != null && !dto.getStatus().trim().isEmpty()) ? dto.getStatus().toUpperCase() : "SKIPPED";
        String reason = (dto.getReason() != null && !dto.getReason().trim().isEmpty()) ? dto.getReason().trim() : dto.getNotes();

        if ("SKIPPED".equalsIgnoreCase(status)) {
            if (reason == null || reason.trim().isEmpty()) {
                throw new RuntimeException("Mandatory Reason Required: Please specify why you are skipping this tiffin (e.g. Fasting/Vrat, Out of town, Sick, Home Food, etc.) so it is saved in records for both you and the Tiffin Center.");
            }
        }

        java.util.Optional<TiffinAttendance> existing = attendanceRepository.findByOrderIdAndAttendanceDate(order.getId(), attendanceDate);
        TiffinAttendance attendance;
        if (existing.isPresent()) {
            attendance = existing.get();
            attendance.setStatus(status);
            attendance.setNotes(reason);
            attendance.setMarkedBy("CUSTOMER (" + order.getUser().getName() + ")");
        } else {
            attendance = new TiffinAttendance(order, attendanceDate, status, reason, "CUSTOMER (" + order.getUser().getName() + ")");
        }

        TiffinAttendance saved = attendanceRepository.save(attendance);

        // Recalculate order statistics
        long deliveredCount = attendanceRepository.countByOrderIdAndStatus(order.getId(), "DELIVERED");
        long skippedCount = attendanceRepository.countByOrderIdAndStatus(order.getId(), "SKIPPED");
        order.setDeliveredDaysCount((int) deliveredCount);
        order.setSkippedDaysCount((int) skippedCount);

        double rate = order.getPricePerDayRate() > 0 ? order.getPricePerDayRate() : (order.getTiffinItem() != null ? order.getTiffinItem().getPricePerDay() : 100.0);
        order.setDueAmount15Day(deliveredCount * rate);
        orderRepository.save(order);

        return saved;
    }

    public Order pay15DayBill(Long orderId, String paytmTxnId) {
        Order order = getOrderById(orderId);
        order.setPaytmTxnId(paytmTxnId);
        order.setDueAmount15Day(0.0);
        order.set15DayPaymentPending(false);
        order.setPaymentStatus("PAID");
        return orderRepository.save(order);
    }

    public Order cancelOrder(Long orderId, String reason, String cancelledBy) {
        Order order = getOrderById(orderId);

        if ("CANCELLED".equalsIgnoreCase(order.getOrderStatus())) {
            throw new RuntimeException("This order is already cancelled.");
        }
        if ("DELIVERED".equalsIgnoreCase(order.getOrderStatus())) {
            throw new RuntimeException("Cannot cancel order: Meals have already been delivered.");
        }
        if ("DISPATCHED".equalsIgnoreCase(order.getOrderStatus())) {
            throw new RuntimeException("Cannot cancel order: Meal is already out for delivery with the delivery rider.");
        }

        LocalDate today = LocalDate.now();
        LocalDate startDate = order.getStartDate();

        // 3-Hour Universal Timing Cut-off Rule check if cancelling for today
        if (startDate != null && startDate.isEqual(today)) {
            java.time.LocalTime currentTime = java.time.LocalTime.now();
            String mealType = order.getTiffinItem() != null ? order.getTiffinItem().getMealType() : "FULL_DAY";

            if ("LUNCH".equalsIgnoreCase(mealType)) {
                if (currentTime.isAfter(java.time.LocalTime.of(9, 0))) {
                    throw new RuntimeException("Cancellation Window Closed: Same-day Lunch cancellation is only permitted up to 3 hours before supply window (Must cancel before 9:00 AM). Delivery starts at 12:00 PM.");
                }
            } else if ("DINNER".equalsIgnoreCase(mealType)) {
                if (currentTime.isAfter(java.time.LocalTime.of(16, 0))) {
                    throw new RuntimeException("Cancellation Window Closed: Same-day Dinner cancellation is only permitted up to 3 hours before supply window (Must cancel before 4:00 PM). Delivery starts at 7:00 PM.");
                }
            } else { // FULL_DAY
                if (currentTime.isAfter(java.time.LocalTime.of(16, 0))) {
                    throw new RuntimeException("Cancellation Window Closed: Today's meal cancellation is now closed (Lunch cut-off was 9:00 AM, Dinner cut-off was 4:00 PM).");
                }
            }
        }

        order.setOrderStatus("CANCELLED");
        order.setCancellationReason(reason != null && !reason.trim().isEmpty() ? reason.trim() : "Cancelled by Customer");
        order.setCancelledBy(cancelledBy != null && !cancelledBy.trim().isEmpty() ? cancelledBy : "CUSTOMER");
        order.setCancelledAt(LocalDateTime.now());

        return orderRepository.save(order);
    }

    public User getUserProfile(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
    }

    public User updateUserProfile(Long userId, com.apkatiffine.dto.UserProfileDTO dto) {
        User user = getUserProfile(userId);
        if (dto.getName() != null && !dto.getName().trim().isEmpty()) {
            user.setName(dto.getName().trim());
        }
        if (dto.getPhone() != null && !dto.getPhone().trim().isEmpty()) {
            user.setPhone(dto.getPhone().trim());
        }
        if (dto.getAddress() != null) {
            user.setAddress(dto.getAddress().trim());
        }
        if (dto.getCity() != null) {
            user.setCity(dto.getCity().trim());
        }
        if (dto.getPincode() != null) {
            user.setPincode(dto.getPincode().trim());
        }
        if (dto.getDietaryPreference() != null) {
            user.setDietaryPreference(dto.getDietaryPreference().trim());
        }
        if (dto.getSpecialNotes() != null) {
            user.setSpecialNotes(dto.getSpecialNotes().trim());
        }
        if (dto.getProfileImageUrl() != null && !dto.getProfileImageUrl().trim().isEmpty()) {
            user.setProfileImageUrl(dto.getProfileImageUrl().trim());
        }
        return userRepository.save(user);
    }

    public User updateUserProfilePhoto(Long userId, String photoUrl) {
        User user = getUserProfile(userId);
        user.setProfileImageUrl(photoUrl);
        return userRepository.save(user);
    }

    // Customer submits payment screenshot proof for CUSTOM_QR orders
    public Order submitPaymentProof(Long orderId, String screenshotUrl, String referenceNumber) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        if (!"CUSTOM_QR".equalsIgnoreCase(order.getPaymentMode())) {
            throw new RuntimeException("Payment proof submission is only applicable for UPI QR Code payment orders.");
        }
        if ("CANCELLED".equalsIgnoreCase(order.getOrderStatus())) {
            throw new RuntimeException("Cannot submit proof for a cancelled order.");
        }

        order.setPaymentScreenshotUrl(screenshotUrl);
        if (referenceNumber != null && !referenceNumber.trim().isEmpty()) {
            order.setPaymentReferenceNumber(referenceNumber.trim());
        }
        order.setPaymentProofStatus("AWAITING_VERIFICATION");
        order.setPaymentStatus("PENDING_VERIFICATION");

        return orderRepository.save(order);
    }
}

