package com.apkatiffine.dto;

public class VendorRegisterDTO {
    private String centerName;
    private String ownerName;
    private String email;
    private String phone;
    private String altPhone;
    private String password;
    private String address;
    private String area;
    private String city;
    private String pincode;
    private Double latitude;
    private Double longitude;
    private String aadhaarNo;
    private String panNo;
    private String fssaiNo;
    private boolean declarationAccepted;

    public VendorRegisterDTO() {}

    public String getCenterName() { return centerName; }
    public void setCenterName(String centerName) { this.centerName = centerName; }

    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAltPhone() { return altPhone; }
    public void setAltPhone(String altPhone) { this.altPhone = altPhone; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

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
}
