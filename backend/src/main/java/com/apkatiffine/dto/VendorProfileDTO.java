package com.apkatiffine.dto;

public class VendorProfileDTO {
    private String centerName;
    private String ownerName;
    private String phone;
    private String altPhone;
    private String address;
    private String area;
    private String city;
    private String pincode;
    private String description;
    private String cuisines;
    private String deliveryTimings;
    private Boolean pureVeg;
    private String logoUrl;
    private String bannerUrl;

    // Payment Settings
    private Boolean customQrEnabled;
    private String customQrCodeUrl;
    private String customUpiId;
    private String customUpiName;
    private String customQrInstructions;
    
    private Boolean paytmGatewayEnabled;
    private String paytmMerchantId;
    private String paytmMerchantKey;
    private String paytmMerchantVpa;
    private String paytmEnvironment;

    private Boolean codEnabled;

    public VendorProfileDTO() {}

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

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCuisines() { return cuisines; }
    public void setCuisines(String cuisines) { this.cuisines = cuisines; }

    public String getDeliveryTimings() { return deliveryTimings; }
    public void setDeliveryTimings(String deliveryTimings) { this.deliveryTimings = deliveryTimings; }

    public Boolean getPureVeg() { return pureVeg; }
    public void setPureVeg(Boolean pureVeg) { this.pureVeg = pureVeg; }

    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public String getBannerUrl() { return bannerUrl; }
    public void setBannerUrl(String bannerUrl) { this.bannerUrl = bannerUrl; }

    public Boolean getCustomQrEnabled() { return customQrEnabled; }
    public void setCustomQrEnabled(Boolean customQrEnabled) { this.customQrEnabled = customQrEnabled; }

    public String getCustomQrCodeUrl() { return customQrCodeUrl; }
    public void setCustomQrCodeUrl(String customQrCodeUrl) { this.customQrCodeUrl = customQrCodeUrl; }

    public String getCustomUpiId() { return customUpiId; }
    public void setCustomUpiId(String customUpiId) { this.customUpiId = customUpiId; }

    public String getCustomUpiName() { return customUpiName; }
    public void setCustomUpiName(String customUpiName) { this.customUpiName = customUpiName; }

    public String getCustomQrInstructions() { return customQrInstructions; }
    public void setCustomQrInstructions(String customQrInstructions) { this.customQrInstructions = customQrInstructions; }

    public Boolean getPaytmGatewayEnabled() { return paytmGatewayEnabled; }
    public void setPaytmGatewayEnabled(Boolean paytmGatewayEnabled) { this.paytmGatewayEnabled = paytmGatewayEnabled; }

    public String getPaytmMerchantId() { return paytmMerchantId; }
    public void setPaytmMerchantId(String paytmMerchantId) { this.paytmMerchantId = paytmMerchantId; }

    public String getPaytmMerchantKey() { return paytmMerchantKey; }
    public void setPaytmMerchantKey(String paytmMerchantKey) { this.paytmMerchantKey = paytmMerchantKey; }

    public String getPaytmMerchantVpa() { return paytmMerchantVpa; }
    public void setPaytmMerchantVpa(String paytmMerchantVpa) { this.paytmMerchantVpa = paytmMerchantVpa; }

    public String getPaytmEnvironment() { return paytmEnvironment; }
    public void setPaytmEnvironment(String paytmEnvironment) { this.paytmEnvironment = paytmEnvironment; }

    public Boolean getCodEnabled() { return codEnabled; }
    public void setCodEnabled(Boolean codEnabled) { this.codEnabled = codEnabled; }
}
