package com.apkatiffine.model;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tiffin_items")
public class TiffinItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tiffin_center_id", nullable = false)
    private TiffinCenter tiffinCenter;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private String category; // VEG, NON_VEG, JAIN

    @Column(nullable = false)
    private String mealType; // BREAKFAST, LUNCH, DINNER, FULL_DAY

    @Column(nullable = false)
    private Double pricePerDay;

    @Column(nullable = false)
    private Double pricePerMonth;

    @Column(length = 1000)
    private String dishes; // e.g. "4 Butter Roti, Paneer Butter Masala, Dal Tadka, Jeera Rice, Salad, Gulab Jamun"

    private String imageUrl;

    private boolean available = true;

    private LocalDateTime createdAt = LocalDateTime.now();

    public TiffinItem() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public TiffinCenter getTiffinCenter() { return tiffinCenter; }
    public void setTiffinCenter(TiffinCenter tiffinCenter) { this.tiffinCenter = tiffinCenter; }

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

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
