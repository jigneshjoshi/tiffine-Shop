package com.apkatiffine.dto;

public class TiffinItemDTO {
    private Long tiffinCenterId;
    private String title;
    private String description;
    private String category; // VEG, NON_VEG, JAIN
    private String mealType; // BREAKFAST, LUNCH, DINNER, FULL_DAY
    private Double pricePerDay;
    private Double pricePerMonth;
    private String dishes;
    private String imageUrl;

    public TiffinItemDTO() {}

    public Long getTiffinCenterId() { return tiffinCenterId; }
    public void setTiffinCenterId(Long tiffinCenterId) { this.tiffinCenterId = tiffinCenterId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getMealType() { return mealType; }
    public void setMealType(String mealType) { this.mealType = mealType; }

    public Double getPricePerDay() { return pricePerDay; }
    public void setPricePerDay(Double pricePerDay) { this.pricePerDay = pricePerDay; }

    public Double getPricePerMonth() { return pricePerMonth; }
    public void setPricePerMonth(Double pricePerMonth) { this.pricePerMonth = pricePerMonth; }

    public String getDishes() { return dishes; }
    public void setDishes(String dishes) { this.dishes = dishes; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}
