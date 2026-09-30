package com.apkatiffine.service;

import com.apkatiffine.model.Order;
import com.apkatiffine.model.TiffinCenter;
import com.apkatiffine.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import javax.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    /**
     * Send Order Confirmation & Payment Receipt Email to Customer
     */
    public void sendOrderConfirmationEmail(Order order) {
        if (order == null || order.getUser() == null || order.getUser().getEmail() == null) return;

        String recipient = order.getUser().getEmail();
        String subject = "🍱 APKA Tiffine Center - Order #" + order.getOrderNumber() + " Confirmed!";

        String content = "<h2>Order Confirmed & Paid!</h2>"
                + "<p>Dear <strong>" + order.getUser().getName() + "</strong>,</p>"
                + "<p>Thank you for subscribing on <strong>APKA Tiffine Center</strong>. Your tiffin order has been received by the vendor.</p>"
                + "<div style='background:#f8fafc; padding:15px; border-radius:10px; font-family:sans-serif;'>"
                + "<p><strong>Order Ref:</strong> " + order.getOrderNumber() + "</p>"
                + "<p><strong>Tiffin Item:</strong> " + (order.getTiffinItem() != null ? order.getTiffinItem().getTitle() : "Tiffin Package") + "</p>"
                + "<p><strong>Plan Type:</strong> " + order.getPlanType() + " (" + order.getPaymentOption() + ")</p>"
                + "<p><strong>Total Amount:</strong> ₹" + order.getTotalAmount() + " (Inc. 5% GST)</p>"
                + "<p><strong>Delivery Address:</strong> " + order.getDeliveryAddress() + "</p>"
                + "<p><strong>Paytm Txn ID:</strong> " + (order.getPaytmTxnId() != null ? order.getPaytmTxnId() : "N/A") + "</p>"
                + "</div>"
                + "<br/><p>Fresh homemade tiffins will be delivered daily to your room/PG address!</p>"
                + "<p>Best regards,<br/><strong>APKA Tiffine Center Team</strong></p>";

        sendHtmlEmail(recipient, subject, content);
    }

    /**
     * Send New Order Notification Email to Vendor
     */
    public void sendVendorNewOrderAlert(Order order) {
        if (order == null || order.getTiffinCenter() == null || order.getTiffinCenter().getUser() == null) return;

        String vendorEmail = order.getTiffinCenter().getUser().getEmail();
        String subject = "🔔 NEW ORDER RECEIVED: #" + order.getOrderNumber() + " - APKA Tiffine";

        String content = "<h2>New Order Alert!</h2>"
                + "<p>Hello <strong>" + order.getTiffinCenter().getOwnerName() + "</strong>,</p>"
                + "<p>You have received a new order for your tiffin center <strong>" + order.getTiffinCenter().getCenterName() + "</strong>.</p>"
                + "<div style='background:#fff7ed; padding:15px; border-radius:10px; font-family:sans-serif; border:1px solid #ffedd5;'>"
                + "<p><strong>Customer Name:</strong> " + order.getUser().getName() + " (" + order.getUser().getPhone() + ")</p>"
                + "<p><strong>Package Title:</strong> " + (order.getTiffinItem() != null ? order.getTiffinItem().getTitle() : "Tiffin Meal") + "</p>"
                + "<p><strong>Total Amount Earned:</strong> ₹" + order.getTotalAmount() + "</p>"
                + "<p><strong>Exact Delivery Address:</strong> " + order.getDeliveryAddress() + "</p>"
                + "</div>"
                + "<br/><p>Please open your <strong>Vendor Dashboard</strong> to mark daily attendance and dispatch meals.</p>";

        sendHtmlEmail(vendorEmail, subject, content);
    }

    /**
     * Send Password Reset OTP Email
     */
    public void sendPasswordResetEmail(String userEmail, String resetToken) {
        String subject = "🔐 APKA Tiffine Center - Password Reset Code";
        String content = "<h2>Password Reset Request</h2>"
                + "<p>We received a request to reset your password on APKA Tiffine Center.</p>"
                + "<p>Your Secret Password Reset Code is:</p>"
                + "<div style='background:#f1f5f9; padding:15px; border-radius:10px; font-size:24px; font-weight:bold; letter-spacing:4px; text-align:center; color:#4f46e5;'>"
                + resetToken
                + "</div>"
                + "<p>Enter this code on the password reset page to set your new password. Code is valid for 15 minutes.</p>";

        sendHtmlEmail(userEmail, subject, content);
    }

    /**
     * Send Vendor Approval Notification Email
     */
    public void sendVendorApprovalEmail(TiffinCenter center) {
        if (center == null || center.getUser() == null) return;

        String vendorEmail = center.getUser().getEmail();
        String subject = "🎉 CONGRATULATIONS! Your Tiffin Center " + center.getCenterName() + " is APPROVED!";

        String content = "<h2>Congratulations! Your Shop is Live!</h2>"
                + "<p>Dear <strong>" + center.getOwnerName() + "</strong>,</p>"
                + "<p>Great news! Your Tiffin Center <strong>" + center.getCenterName() + "</strong> has been verified and approved by the Super Admin.</p>"
                + "<p>Your 1-Month Free Trial Business Listing is now ACTIVE. Students & working professionals in " + center.getArea() + " can now find and subscribe to your tiffin packages!</p>"
                + "<br/><p>Log in to your <strong>Vendor Portal</strong> to start receiving customer orders.</p>";

        sendHtmlEmail(vendorEmail, subject, content);
    }

    /**
     * Helper to dispatch HTML email via JavaMailSender with exception handling
     */
    private void sendHtmlEmail(String recipient, String subject, String body) {
        try {
            if (mailSender == null) {
                System.out.println(">>> [MOCK EMAIL DISPATCH] To: " + recipient + " | Subject: " + subject + " <<<");
                return;
            }
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom("notifications@apkatiffine.com");
            helper.setTo(recipient);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(message);
            System.out.println(">>> [EMAIL SENT SUCCESSFULLY] To: " + recipient + " | Subject: " + subject + " <<<");
        } catch (Exception e) {
            System.err.println(">>> [SMTP Mail Dispatch Note] Could not deliver email to " + recipient + " via SMTP server (running in fallback mock mode): " + e.getMessage());
        }
    }
}
