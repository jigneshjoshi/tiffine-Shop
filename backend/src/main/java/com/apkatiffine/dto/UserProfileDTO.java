package com.apkatiffine.dto;

public class UserProfileDTO {
    private String name;
    private String phone;
    private String address;
    private String city;
    private String pincode;
    private String dietaryPreference;
    private String specialNotes;
    private String profileImageUrl;

    public UserProfileDTO() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

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

    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }
}
