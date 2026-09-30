package com.apkatiffine.dto;

public class OtpVerificationDTO {
    private String otp;
    private String notes;
    private String date;

    public OtpVerificationDTO() {}

    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
}
