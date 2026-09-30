package com.apkatiffine.model;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tiffin_center_id", nullable = false)
    private TiffinCenter tiffinCenter;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tiffin_item_id", nullable = false)
    private TiffinItem tiffinItem;

    @Column(nullable = false)
    private String planType; // DAILY, MONTHLY

    @Column(nullable = false)
    private String paymentOption = "FULL_UPFRONT"; // FULL_UPFRONT, HALF_15DAY_POSTPAID

    private int quantity = 1;

    private LocalDate startDate;
    private LocalDate endDate;

    @Column(nullable = false, length = 1000)
    private String deliveryAddress;

    private String area;
    private String pincode;

    @Column(nullable = false)
    private Double subtotal;

    @Column(nullable = false)
    private Double taxAmount; // GST 5%

    @Column(nullable = false)
    private Double totalAmount;

    private Double pricePerDayRate = 0.0;
    private int deliveredDaysCount = 0;
    private int skippedDaysCount = 0;
    private Double dueAmount15Day = 0.0;
    private boolean is15DayPaymentPending = false;

    @Column(nullable = false)
    private String paymentMode; // PAYTM, PAYTM_UPI, CUSTOM_QR, COD, CARD

    private String paytmTxnId;

    // Custom QR & Manual Payment Proof Verification Fields
    private String paymentScreenshotUrl;
    private String paymentReferenceNumber; // Customer UTR / Txn reference number
    private String paymentProofStatus = "NOT_APPLICABLE"; // NOT_APPLICABLE, AWAITING_VERIFICATION, VERIFIED, REJECTED
    private String paymentProofNotes;
    private LocalDateTime paymentProofVerifiedAt;

    @Column(nullable = false)
    private String paymentStatus = "PAID"; // PENDING, PAID, PENDING_VERIFICATION, PAYMENT_REJECTED, PENDING_COD, PARTIAL_15DAY_PENDING

    @Column(nullable = false)
    private String orderStatus = "PENDING_CONFIRMATION"; // PENDING_CONFIRMATION, CONFIRMED, PREPARING, DISPATCHED, DELIVERED, CANCELLED

    private String cancellationReason;

    private String cancelledBy;
    private LocalDateTime cancelledAt;

    private String currentDeliveryOtp;
    private boolean todayOtpVerified = false;
    private LocalDate lastDeliveredDate;

    private LocalDateTime createdAt = LocalDateTime.now();

    public Order() {
        this.currentDeliveryOtp = generateOtp();
    }

    public static String generateOtp() {
        return String.format("%04d", 1000 + new java.util.Random().nextInt(9000));
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public TiffinCenter getTiffinCenter() { return tiffinCenter; }
    public void setTiffinCenter(TiffinCenter tiffinCenter) { this.tiffinCenter = tiffinCenter; }

    public TiffinItem getTiffinItem() { return tiffinItem; }
    public void setTiffinItem(TiffinItem tiffinItem) { this.tiffinItem = tiffinItem; }

    public String getPlanType() { return planType; }
    public void setPlanType(String planType) { this.planType = planType; }

    public String getPaymentOption() { return paymentOption; }
    public void setPaymentOption(String paymentOption) { this.paymentOption = paymentOption; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }

    public Double getTaxAmount() { return taxAmount; }
    public void setTaxAmount(Double taxAmount) { this.taxAmount = taxAmount; }

    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }

    public Double getPricePerDayRate() { return pricePerDayRate; }
    public void setPricePerDayRate(Double pricePerDayRate) { this.pricePerDayRate = pricePerDayRate; }

    public int getDeliveredDaysCount() { return deliveredDaysCount; }
    public void setDeliveredDaysCount(int deliveredDaysCount) { this.deliveredDaysCount = deliveredDaysCount; }

    public int getSkippedDaysCount() { return skippedDaysCount; }
    public void setSkippedDaysCount(int skippedDaysCount) { this.skippedDaysCount = skippedDaysCount; }

    public Double getDueAmount15Day() { return dueAmount15Day; }
    public void setDueAmount15Day(Double dueAmount15Day) { this.dueAmount15Day = dueAmount15Day; }

    public boolean is15DayPaymentPending() { return is15DayPaymentPending; }
    public void set15DayPaymentPending(boolean is15DayPaymentPending) { this.is15DayPaymentPending = is15DayPaymentPending; }

    public String getPaymentMode() { return paymentMode; }
    public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }

    public String getPaytmTxnId() { return paytmTxnId; }
    public void setPaytmTxnId(String paytmTxnId) { this.paytmTxnId = paytmTxnId; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public String getCancelledBy() { return cancelledBy; }
    public void setCancelledBy(String cancelledBy) { this.cancelledBy = cancelledBy; }

    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getCurrentDeliveryOtp() { return currentDeliveryOtp; }
    public void setCurrentDeliveryOtp(String currentDeliveryOtp) { this.currentDeliveryOtp = currentDeliveryOtp; }

    public boolean isTodayOtpVerified() { return todayOtpVerified; }
    public void setTodayOtpVerified(boolean todayOtpVerified) { this.todayOtpVerified = todayOtpVerified; }

    public LocalDate getLastDeliveredDate() { return lastDeliveredDate; }
    public void setLastDeliveredDate(LocalDate lastDeliveredDate) { this.lastDeliveredDate = lastDeliveredDate; }

    public String getPaymentScreenshotUrl() { return paymentScreenshotUrl; }
    public void setPaymentScreenshotUrl(String paymentScreenshotUrl) { this.paymentScreenshotUrl = paymentScreenshotUrl; }

    public String getPaymentReferenceNumber() { return paymentReferenceNumber; }
    public void setPaymentReferenceNumber(String paymentReferenceNumber) { this.paymentReferenceNumber = paymentReferenceNumber; }

    public String getPaymentProofStatus() { return paymentProofStatus; }
    public void setPaymentProofStatus(String paymentProofStatus) { this.paymentProofStatus = paymentProofStatus; }

    public String getPaymentProofNotes() { return paymentProofNotes; }
    public void setPaymentProofNotes(String paymentProofNotes) { this.paymentProofNotes = paymentProofNotes; }

    public LocalDateTime getPaymentProofVerifiedAt() { return paymentProofVerifiedAt; }
    public void setPaymentProofVerifiedAt(LocalDateTime paymentProofVerifiedAt) { this.paymentProofVerifiedAt = paymentProofVerifiedAt; }
}
