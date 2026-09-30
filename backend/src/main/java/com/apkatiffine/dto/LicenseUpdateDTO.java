package com.apkatiffine.dto;

public class LicenseUpdateDTO {
    private Boolean active;
    private String licenseType;
    private Integer extensionMonths;
    private Double paymentAmount;
    private String paytmTxnId;

    public LicenseUpdateDTO() {}

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public String getLicenseType() { return licenseType; }
    public void setLicenseType(String licenseType) { this.licenseType = licenseType; }

    public Integer getExtensionMonths() { return extensionMonths; }
    public void setExtensionMonths(Integer extensionMonths) { this.extensionMonths = extensionMonths; }

    public Double getPaymentAmount() { return paymentAmount; }
    public void setPaymentAmount(Double paymentAmount) { this.paymentAmount = paymentAmount; }

    public String getPaytmTxnId() { return paytmTxnId; }
    public void setPaytmTxnId(String paytmTxnId) { this.paytmTxnId = paytmTxnId; }
}
