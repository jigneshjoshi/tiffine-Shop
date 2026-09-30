package com.apkatiffine.dto;

public class OrderRequestDTO {
    private Long userId;
    private Long tiffinCenterId;
    private Long tiffinItemId;
    private String planType; // DAILY, MONTHLY
    private String paymentOption; // FULL_UPFRONT, HALF_15DAY_POSTPAID
    private int quantity;
    private String deliveryAddress;
    private String area;
    private String pincode;
    private Double totalAmount;
    private String paymentMode; // PAYTM, PAYTM_UPI, CUSTOM_QR, COD, CARD
    private String paytmTxnId;
    private String paymentScreenshotUrl;
    private String paymentReferenceNumber;

    public OrderRequestDTO() {}

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getTiffinCenterId() { return tiffinCenterId; }
    public void setTiffinCenterId(Long tiffinCenterId) { this.tiffinCenterId = tiffinCenterId; }

    public Long getTiffinItemId() { return tiffinItemId; }
    public void setTiffinItemId(Long tiffinItemId) { this.tiffinItemId = tiffinItemId; }

    public String getPlanType() { return planType; }
    public void setPlanType(String planType) { this.planType = planType; }

    public String getPaymentOption() { return paymentOption; }
    public void setPaymentOption(String paymentOption) { this.paymentOption = paymentOption; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }

    public String getPaymentMode() { return paymentMode; }
    public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }

    public String getPaytmTxnId() { return paytmTxnId; }
    public void setPaytmTxnId(String paytmTxnId) { this.paytmTxnId = paytmTxnId; }

    public String getPaymentScreenshotUrl() { return paymentScreenshotUrl; }
    public void setPaymentScreenshotUrl(String paymentScreenshotUrl) { this.paymentScreenshotUrl = paymentScreenshotUrl; }

    public String getPaymentReferenceNumber() { return paymentReferenceNumber; }
    public void setPaymentReferenceNumber(String paymentReferenceNumber) { this.paymentReferenceNumber = paymentReferenceNumber; }
}
