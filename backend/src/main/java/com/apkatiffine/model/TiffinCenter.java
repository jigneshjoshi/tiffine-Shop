package com.apkatiffine.model;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tiffin_centers")
public class TiffinCenter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String centerName;

    @Column(nullable = false)
    private String ownerName;

    @Column(nullable = false)
    private String phone;

    private String altPhone;

    @Column(nullable = false, length = 1000)
    private String address;

    @Column(nullable = false)
    private String area;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String pincode;

    private Double latitude;
    private Double longitude;

    @Column(nullable = false)
    private String aadhaarNo;

    @Column(nullable = false)
    private String panNo;

    private String fssaiNo; // Optional

    private boolean declarationAccepted;

    private String aadhaarDocUrl;
    private String panDocUrl;
    private String fssaiDocUrl;
    private String declarationDocUrl;

    private String rating = "4.8";
    private String totalReviews = "120";

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED, DISABLED

    // Subscription & License Fields (Default 1 Month Free Trial)
    private boolean licenseActive = true;
    private String licenseType = "1 MONTH FREE TRIAL";
    private LocalDateTime licenseExpiryDate = LocalDateTime.now().plusMonths(1);
    private Double lastLicensePaymentAmount = 0.0;
    private LocalDateTime lastLicensePaymentDate;

    private String logoUrl;
    private String bannerUrl;
    @Column(length = 2000)
    private String description;
    private String cuisines = "North Indian, Gujarati, Homestyle";
    private String deliveryTimings = "Lunch: 12:00 PM - 2:00 PM | Dinner: 7:00 PM - 9:30 PM";
    private boolean pureVeg = true;

    // Payment Gateway & Custom QR Configuration Fields
    private boolean customQrEnabled = true;
    private String customQrCodeUrl;
    private String customUpiId;
    private String customUpiName;
    @Column(length = 1000)
    private String customQrInstructions = "Scan Owner UPI QR code, complete payment on GPay/PhonePe/Paytm, and upload payment screenshot proof.";
    
    private boolean paytmGatewayEnabled = true;
    private String paytmMerchantId;
    private String paytmMerchantKey;
    private String paytmMerchantVpa;
    private String paytmEnvironment = "SANDBOX"; // SANDBOX, PRODUCTION

    private boolean codEnabled = true;

    private LocalDateTime createdAt = LocalDateTime.now();

    public TiffinCenter() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getCenterName() { return centerName; }
    public void setCenterName(String centerName) { this.centerName = centerName; }

    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAltPhone() { return altPhone; }
    public void setAltPhone(String altPhone) { this.altPhone = altPhone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getAadhaarNo() { return aadhaarNo; }
    public void setAadhaarNo(String aadhaarNo) { this.aadhaarNo = aadhaarNo; }

    public String getPanNo() { return panNo; }
    public void setPanNo(String panNo) { this.panNo = panNo; }

    public String getFssaiNo() { return fssaiNo; }
    public void setFssaiNo(String fssaiNo) { this.fssaiNo = fssaiNo; }

    public boolean isDeclarationAccepted() { return declarationAccepted; }
    public void setDeclarationAccepted(boolean declarationAccepted) { this.declarationAccepted = declarationAccepted; }

    public String getAadhaarDocUrl() { return aadhaarDocUrl; }
    public void setAadhaarDocUrl(String aadhaarDocUrl) { this.aadhaarDocUrl = aadhaarDocUrl; }

    public String getPanDocUrl() { return panDocUrl; }
    public void setPanDocUrl(String panDocUrl) { this.panDocUrl = panDocUrl; }

    public String getFssaiDocUrl() { return fssaiDocUrl; }
    public void setFssaiDocUrl(String fssaiDocUrl) { this.fssaiDocUrl = fssaiDocUrl; }

    public String getDeclarationDocUrl() { return declarationDocUrl; }
    public void setDeclarationDocUrl(String declarationDocUrl) { this.declarationDocUrl = declarationDocUrl; }

    public String getRating() { return rating; }
    public void setRating(String rating) { this.rating = rating; }

    public String getTotalReviews() { return totalReviews; }
    public void setTotalReviews(String totalReviews) { this.totalReviews = totalReviews; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isLicenseActive() { return licenseActive; }
    public void setLicenseActive(boolean licenseActive) { this.licenseActive = licenseActive; }

    public String getLicenseType() { return licenseType; }
    public void setLicenseType(String licenseType) { this.licenseType = licenseType; }

    public LocalDateTime getLicenseExpiryDate() { return licenseExpiryDate; }
    public void setLicenseExpiryDate(LocalDateTime licenseExpiryDate) { this.licenseExpiryDate = licenseExpiryDate; }

    public Double getLastLicensePaymentAmount() { return lastLicensePaymentAmount; }
    public void setLastLicensePaymentAmount(Double lastLicensePaymentAmount) { this.lastLicensePaymentAmount = lastLicensePaymentAmount; }

    public LocalDateTime getLastLicensePaymentDate() { return lastLicensePaymentDate; }
    public void setLastLicensePaymentDate(LocalDateTime lastLicensePaymentDate) { this.lastLicensePaymentDate = lastLicensePaymentDate; }

    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public String getBannerUrl() { return bannerUrl; }
    public void setBannerUrl(String bannerUrl) { this.bannerUrl = bannerUrl; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCuisines() { return cuisines; }
    public void setCuisines(String cuisines) { this.cuisines = cuisines; }

    public String getDeliveryTimings() { return deliveryTimings; }
    public void setDeliveryTimings(String deliveryTimings) { this.deliveryTimings = deliveryTimings; }

    public boolean isPureVeg() { return pureVeg; }
    public void setPureVeg(boolean pureVeg) { this.pureVeg = pureVeg; }

    public boolean isCustomQrEnabled() { return customQrEnabled; }
    public void setCustomQrEnabled(boolean customQrEnabled) { this.customQrEnabled = customQrEnabled; }

    public String getCustomQrCodeUrl() { return customQrCodeUrl; }
    public void setCustomQrCodeUrl(String customQrCodeUrl) { this.customQrCodeUrl = customQrCodeUrl; }

    public String getCustomUpiId() { return customUpiId; }
    public void setCustomUpiId(String customUpiId) { this.customUpiId = customUpiId; }

    public String getCustomUpiName() { return customUpiName; }
    public void setCustomUpiName(String customUpiName) { this.customUpiName = customUpiName; }

    public String getCustomQrInstructions() { return customQrInstructions; }
    public void setCustomQrInstructions(String customQrInstructions) { this.customQrInstructions = customQrInstructions; }

    public boolean isPaytmGatewayEnabled() { return paytmGatewayEnabled; }
    public void setPaytmGatewayEnabled(boolean paytmGatewayEnabled) { this.paytmGatewayEnabled = paytmGatewayEnabled; }

    public String getPaytmMerchantId() { return paytmMerchantId; }
    public void setPaytmMerchantId(String paytmMerchantId) { this.paytmMerchantId = paytmMerchantId; }

    public String getPaytmMerchantKey() { return paytmMerchantKey; }
    public void setPaytmMerchantKey(String paytmMerchantKey) { this.paytmMerchantKey = paytmMerchantKey; }

    public String getPaytmMerchantVpa() { return paytmMerchantVpa; }
    public void setPaytmMerchantVpa(String paytmMerchantVpa) { this.paytmMerchantVpa = paytmMerchantVpa; }

    public String getPaytmEnvironment() { return paytmEnvironment; }
    public void setPaytmEnvironment(String paytmEnvironment) { this.paytmEnvironment = paytmEnvironment; }

    public boolean isCodEnabled() { return codEnabled; }
    public void setCodEnabled(boolean codEnabled) { this.codEnabled = codEnabled; }
}
