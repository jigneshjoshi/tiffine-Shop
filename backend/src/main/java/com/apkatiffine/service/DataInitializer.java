package com.apkatiffine.service;

import com.apkatiffine.model.Role;
import com.apkatiffine.model.TiffinCenter;
import com.apkatiffine.model.TiffinItem;
import com.apkatiffine.model.User;
import com.apkatiffine.model.Order;
import com.apkatiffine.repository.OrderRepository;
import com.apkatiffine.repository.TiffinCenterRepository;
import com.apkatiffine.repository.TiffinItemRepository;
import com.apkatiffine.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TiffinCenterRepository tiffinCenterRepository;

    @Autowired
    private TiffinItemRepository tiffinItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) return;

        // 1. Create Admin
        User admin = new User("System Admin", "admin@apkatiffine.com", "9876543210", "admin123", Role.ADMIN);
        userRepository.save(admin);

        // 2. Create Sample Approved Vendor 1 - Maa Ki Rasoi (Laxmi Nagar, Delhi)
        User vendorUser1 = new User("Smt. Sunita Sharma", "maa@tiffine.com", "9811223344", "vendor123", Role.VENDOR);
        userRepository.save(vendorUser1);

        TiffinCenter center1 = new TiffinCenter();
        center1.setUser(vendorUser1);
        center1.setCenterName("Maa Ki Rasoi Tiffin Center");
        center1.setOwnerName("Sunita Sharma");
        center1.setPhone("9811223344");
        center1.setAddress("H.No 45, Near Metro Pillar 32, Laxmi Nagar");
        center1.setArea("Laxmi Nagar");
        center1.setCity("Delhi");
        center1.setPincode("110092");
        center1.setLatitude(28.6304);
        center1.setLongitude(77.2777);
        center1.setAadhaarNo("543210987654");
        center1.setPanNo("ABCDE1234F");
        center1.setFssaiNo("13322001000456");
        center1.setDeclarationAccepted(true);
        center1.setStatus("APPROVED");
        center1.setLicenseActive(true);
        center1.setLicenseType("1 MONTH FREE TRIAL");
        center1.setLicenseExpiryDate(java.time.LocalDateTime.now().plusMonths(1));
        center1.setAadhaarDocUrl("/uploads/sample_aadhaar1.jpg");
        center1.setPanDocUrl("/uploads/sample_pan1.jpg");
        center1.setDeclarationDocUrl("/uploads/sample_decl1.pdf");
        center1.setRating("4.9");
        center1.setTotalReviews("240");
        center1.setCustomQrEnabled(true);
        center1.setCustomUpiId("sunita.sharma@paytm");
        center1.setCustomUpiName("Maa Ki Rasoi Tiffin");
        center1.setCustomQrInstructions("Scan Sunita Sharma's official UPI QR or send payment to sunita.sharma@paytm. Mandatory: Upload screenshot.");
        center1.setPaytmGatewayEnabled(true);
        center1.setPaytmMerchantId("APKATIFFINE_MID_SANDBOX");
        center1.setPaytmMerchantKey("APKATIFFINE_MKEY_SANDBOX");
        center1.setPaytmMerchantVpa("paytm-apkatiffine@paytm");
        center1.setPaytmEnvironment("SANDBOX");
        center1.setCodEnabled(true);
        tiffinCenterRepository.save(center1);

        // Tiffins for Center 1
        TiffinItem item1 = new TiffinItem();
        item1.setTiffinCenter(center1);
        item1.setTitle("Homestyle Veg Thali Tiffin");
        item1.setDescription("Fresh homemade thali cooked in low oil. Ideal for daily lunch & dinner for students.");
        item1.setCategory("VEG");
        item1.setMealType("FULL_DAY");
        item1.setPricePerDay(80.0);
        item1.setPricePerMonth(2200.0);
        item1.setDishes("4 Butter Phulke, Arhar Dal Tadka, Seasonal Veg Sabzi, Steam Rice, Green Salad, Achar");
        item1.setImageUrl("https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600");
        item1.setAvailable(true);
        tiffinItemRepository.save(item1);

        TiffinItem item2 = new TiffinItem();
        item2.setTiffinCenter(center1);
        item2.setTitle("Special Paneer Feast Tiffin");
        item2.setDescription("Delicious Paneer Butter Masala thali with sweet dish for working professionals.");
        item2.setCategory("VEG");
        item2.setMealType("LUNCH");
        item2.setPricePerDay(110.0);
        item2.setPricePerMonth(2800.0);
        item2.setDishes("4 Butter Roti, Paneer Butter Masala, Dal Makhani, Jeera Rice, Bundi Raita, Gulab Jamun");
        item2.setImageUrl("https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600");
        item2.setAvailable(true);
        tiffinItemRepository.save(item2);

        // 3. Create Sample Approved Vendor 2 - Student Express Tiffin (Kothrud, Pune)
        User vendorUser2 = new User("Rajesh Patil", "student@tiffine.com", "9822334455", "vendor123", Role.VENDOR);
        userRepository.save(vendorUser2);

        TiffinCenter center2 = new TiffinCenter();
        center2.setUser(vendorUser2);
        center2.setCenterName("Student Express Tiffin Services");
        center2.setOwnerName("Rajesh Patil");
        center2.setPhone("9822334455");
        center2.setAddress("Flat 202, Shanti Heights, Near MIT College Road, Kothrud");
        center2.setArea("Kothrud");
        center2.setCity("Pune");
        center2.setPincode("411038");
        center2.setLatitude(18.5074);
        center2.setLongitude(73.8077);
        center2.setAadhaarNo("987654321012");
        center2.setPanNo("XYZP9876Q");
        center2.setDeclarationAccepted(true);
        center2.setStatus("APPROVED");
        center2.setLicenseActive(true);
        center2.setLicenseType("1 MONTH FREE TRIAL");
        center2.setLicenseExpiryDate(java.time.LocalDateTime.now().plusMonths(1));
        center2.setAadhaarDocUrl("/uploads/sample_aadhaar2.jpg");
        center2.setPanDocUrl("/uploads/sample_pan2.jpg");
        center2.setDeclarationDocUrl("/uploads/sample_decl2.pdf");
        center2.setRating("4.7");
        center2.setTotalReviews("185");
        center2.setCustomQrEnabled(true);
        center2.setCustomUpiId("rajesh.patil@okhdfcbank");
        center2.setCustomUpiName("Student Express Pune");
        center2.setCustomQrInstructions("Scan Rajesh Patil's QR code and attach payment screenshot for fast order confirmation.");
        center2.setPaytmGatewayEnabled(true);
        center2.setPaytmMerchantId("APKATIFFINE_MID_SANDBOX");
        center2.setPaytmMerchantKey("APKATIFFINE_MKEY_SANDBOX");
        center2.setPaytmMerchantVpa("paytm-apkatiffine@paytm");
        center2.setPaytmEnvironment("SANDBOX");
        center2.setCodEnabled(true);
        tiffinCenterRepository.save(center2);

        TiffinItem item3 = new TiffinItem();
        item3.setTiffinCenter(center2);
        item3.setTitle("High-Protein Non-Veg Tiffin");
        item3.setDescription("Freshly cooked Chicken Curry thali for gym-goers & non-veg lovers.");
        item3.setCategory("NON_VEG");
        item3.setMealType("DINNER");
        item3.setPricePerDay(140.0);
        item3.setPricePerMonth(3600.0);
        item3.setDishes("4 Chapati, Desi Chicken Curry (2 Pcs), Steamed Rice, Cucumber Salad, Onion Chutney");
        item3.setImageUrl("https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600");
        item3.setAvailable(true);
        tiffinItemRepository.save(item3);

        // 4. Create Sample Pending Vendor - Annapurna Tiffin (Mukherjee Nagar, Delhi)
        User vendorUser3 = new User("Ramesh Kumar", "annapurna@tiffine.com", "9988776655", "vendor123", Role.VENDOR);
        userRepository.save(vendorUser3);

        TiffinCenter center3 = new TiffinCenter();
        center3.setUser(vendorUser3);
        center3.setCenterName("Annapurna IAS Student Tiffin");
        center3.setOwnerName("Ramesh Kumar");
        center3.setPhone("9988776655");
        center3.setAddress("B-12, Batra Complex, Mukherjee Nagar");
        center3.setArea("Mukherjee Nagar");
        center3.setCity("Delhi");
        center3.setPincode("110009");
        center3.setAadhaarNo("112233445566");
        center3.setPanNo("MNOP5678R");
        center3.setDeclarationAccepted(true);
        center3.setStatus("PENDING");
        center3.setAadhaarDocUrl("/uploads/sample_aadhaar3.jpg");
        center3.setPanDocUrl("/uploads/sample_pan3.jpg");
        center3.setDeclarationDocUrl("/uploads/sample_decl3.pdf");
        tiffinCenterRepository.save(center3);

        // 5. Create Sample User & Initial Order
        User customer = new User("Rahul Verma", "rahul@gmail.com", "9123456789", "user123", Role.USER);
        userRepository.save(customer);

        Order initOrder = new Order();
        initOrder.setOrderNumber("ORD-984210");
        initOrder.setUser(customer);
        initOrder.setTiffinCenter(center1);
        initOrder.setTiffinItem(item1);
        initOrder.setPlanType("MONTHLY");
        initOrder.setPaymentOption("FULL_UPFRONT");
        initOrder.setPricePerDayRate(80.0);
        initOrder.setQuantity(1);
        initOrder.setStartDate(LocalDate.now());
        initOrder.setEndDate(LocalDate.now().plusDays(30));
        initOrder.setDeliveryAddress("Flat 301, Shanti Heights, Laxmi Nagar, Delhi 110092");
        initOrder.setArea("Laxmi Nagar");
        initOrder.setPincode("110092");
        initOrder.setSubtotal(2200.0);
        initOrder.setTaxAmount(110.0);
        initOrder.setTotalAmount(2310.0);
        initOrder.setPaymentMode("PAYTM_UPI");
        initOrder.setPaytmTxnId("PAYTM" + System.currentTimeMillis());
        initOrder.setPaymentStatus("PAID");
        initOrder.setOrderStatus("PREPARING");
        orderRepository.save(initOrder);

        System.out.println(">>> APKA Tiffine Center Initial Data Loaded Successfully! <<<");
    }
}
