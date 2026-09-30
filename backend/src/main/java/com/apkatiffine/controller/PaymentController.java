package com.apkatiffine.controller;

import com.apkatiffine.service.PaytmService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment/paytm")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class PaymentController {

    @Autowired
    private PaytmService paytmService;

    @Autowired
    private com.apkatiffine.repository.TiffinCenterRepository tiffinCenterRepository;

    @PostMapping("/initiate")
    public ResponseEntity<?> initiatePayment(@RequestBody Map<String, Object> req) {
        try {
            String orderId = (String) req.getOrDefault("orderId", "ORD_" + System.currentTimeMillis());
            Double amount = Double.parseDouble(req.get("amount").toString());
            String customerId = (String) req.get("customerId");
            String phone = (String) req.get("phone");
            
            com.apkatiffine.model.TiffinCenter center = null;
            if (req.get("centerId") != null) {
                try {
                    Long centerId = Long.parseLong(req.get("centerId").toString());
                    center = tiffinCenterRepository.findById(centerId).orElse(null);
                } catch (Exception ignored) {}
            }

            Map<String, String> paytmParams = paytmService.initiatePayment(orderId, amount, customerId, phone, center);

            String env = (center != null && center.getPaytmEnvironment() != null) ? center.getPaytmEnvironment() : "SANDBOX";

            Map<String, Object> response = new HashMap<>();
            response.put("status", "SUCCESS");
            response.put("paytmHost", paytmService.getPaytmHost(env));
            response.put("paytmParams", paytmParams);
            response.put("txnToken", "PTM_TOKEN_" + System.currentTimeMillis());
            response.put("merchantVpa", paytmParams.get("MERCHANT_VPA"));
            response.put("centerName", paytmParams.get("CENTER_NAME"));
            response.put("upiIntentUrl", paytmParams.get("UPI_INTENT_URL"));
            response.put("paytmAppUrl", paytmParams.get("PAYTM_APP_URL"));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Paytm Gateway initiation failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> paytmResponse) {
        boolean valid = paytmService.verifyPayment(paytmResponse);
        Map<String, Object> resp = new HashMap<>();
        resp.put("verified", valid);
        resp.put("status", valid ? "SUCCESS" : "FAILED");
        if (!valid) {
            resp.put("message", "Paytm payment verification failed. Real money transaction was not confirmed by Paytm Bank.");
        } else {
            resp.put("message", "Paytm payment successfully verified with Paytm Bank.");
        }
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/callback")
    public ResponseEntity<?> handleCallback(@RequestParam Map<String, String> callbackParams) {
        boolean valid = paytmService.verifyPayment(callbackParams);
        Map<String, Object> resp = new HashMap<>();
        resp.put("verified", valid);
        resp.put("orderId", callbackParams.get("ORDERID"));
        resp.put("txnId", callbackParams.get("TXNID"));
        resp.put("status", valid ? "SUCCESS" : "FAILED");
        return ResponseEntity.ok(resp);
    }
}
