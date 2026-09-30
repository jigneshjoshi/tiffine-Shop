package com.apkatiffine.dto;

import com.apkatiffine.model.Role;

public class LoginResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private Role role;
    private Long tiffinCenterId;
    private String tiffinCenterStatus;
    private String profileImageUrl;
    private String address;
    private String city;
    private String pincode;
    private String dietaryPreference;
    private String specialNotes;
    private String message;

    public LoginResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public Long getTiffinCenterId() { return tiffinCenterId; }
    public void setTiffinCenterId(Long tiffinCenterId) { this.tiffinCenterId = tiffinCenterId; }

    public String getTiffinCenterStatus() { return tiffinCenterStatus; }
    public void setTiffinCenterStatus(String tiffinCenterStatus) { this.tiffinCenterStatus = tiffinCenterStatus; }

    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public String getDietaryPreference() { return dietaryPreference; }
    public void setDietaryPreference(String dietaryPreference) { this.dietaryPreference = dietaryPreference; }

    public String getSpecialNotes() { return specialNotes; }
    public void setSpecialNotes(String specialNotes) { this.specialNotes = specialNotes; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
