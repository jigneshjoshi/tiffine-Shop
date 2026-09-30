package com.apkatiffine.dto;

public class AttendanceUpdateDTO {
    private Long orderId;
    private String date; // YYYY-MM-DD
    private String status; // DELIVERED, SKIPPED, ABSENT, REQUESTED
    private String notes;
    private String reason;

    public AttendanceUpdateDTO() {}

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
