package com.apkatiffine.dto;

public class StatusUpdateDTO {
    private String status;
    private String password; // optional for admin credential update

    public StatusUpdateDTO() {}

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
