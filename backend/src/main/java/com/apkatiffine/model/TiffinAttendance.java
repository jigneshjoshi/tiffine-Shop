package com.apkatiffine.model;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tiffin_attendance", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"order_id", "attendanceDate"})
})
public class TiffinAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false)
    private LocalDate attendanceDate;

    @Column(nullable = false)
    private String status; // DELIVERED, SKIPPED, ABSENT, NOT_DELIVERED

    private String notes;

    private String markedBy;

    private String deliveryOtp;
    private boolean otpVerified = false;
    private LocalDateTime deliveredAt;

    private LocalDateTime createdAt = LocalDateTime.now();

    public TiffinAttendance() {}

    public TiffinAttendance(Order order, LocalDate attendanceDate, String status, String notes, String markedBy) {
        this.order = order;
        this.attendanceDate = attendanceDate;
        this.status = status;
        this.notes = notes;
        this.markedBy = markedBy;
        this.createdAt = LocalDateTime.now();
    }

    public TiffinAttendance(Order order, LocalDate attendanceDate, String status, String notes, String markedBy, String deliveryOtp, boolean otpVerified) {
        this.order = order;
        this.attendanceDate = attendanceDate;
        this.status = status;
        this.notes = notes;
        this.markedBy = markedBy;
        this.deliveryOtp = deliveryOtp;
        this.otpVerified = otpVerified;
        this.deliveredAt = otpVerified ? LocalDateTime.now() : null;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }

    public LocalDate getAttendanceDate() { return attendanceDate; }
    public void setAttendanceDate(LocalDate attendanceDate) { this.attendanceDate = attendanceDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getMarkedBy() { return markedBy; }
    public void setMarkedBy(String markedBy) { this.markedBy = markedBy; }

    public String getDeliveryOtp() { return deliveryOtp; }
    public void setDeliveryOtp(String deliveryOtp) { this.deliveryOtp = deliveryOtp; }

    public boolean isOtpVerified() { return otpVerified; }
    public void setOtpVerified(boolean otpVerified) { this.otpVerified = otpVerified; }

    public LocalDateTime getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(LocalDateTime deliveredAt) { this.deliveredAt = deliveredAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
