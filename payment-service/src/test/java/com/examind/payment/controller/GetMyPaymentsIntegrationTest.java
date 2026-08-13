package com.examind.payment.controller;

import com.examind.payment.entity.Payment;
import com.examind.payment.repository.PaymentRepository;
import com.examind.payment.security.JwtTokenProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * INTEGRATION TEST
 * Verifies User Data Isolation for payment history:
 * - Inserts payment records for User A (ID 1001) and User B (ID 1002) in the test DB.
 * - Mocks monolith response to return User A's profile.
 * - Hits GET /payments/my using User A's token.
 * - Asserts that ONLY User A's payment record is returned, and User B's record does not leak.
 * - Cleans up the database records after test completion.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class GetMyPaymentsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private RestTemplate restTemplate;

    private Payment paymentA;
    private Payment paymentB;

    @BeforeEach
    public void setUp() {
        // Clear DB just in case
        paymentRepository.deleteAll();

        // 1. Setup payment record for User A (ID 1001)
        paymentA = new Payment();
        paymentA.setUserId(1001L);
        paymentA.setRazorpayOrderId("order_A123");
        paymentA.setRazorpayPaymentId("pay_A123");
        paymentA.setAmount(999.0);
        paymentA.setCurrency("INR");
        paymentA.setStatus("paid");
        paymentA.setPlan("pro");
        paymentA.setUpgradeStatus("COMPLETED");
        paymentRepository.save(paymentA);

        // 2. Setup payment record for User B (ID 1002)
        paymentB = new Payment();
        paymentB.setUserId(1002L);
        paymentB.setRazorpayOrderId("order_B567");
        paymentB.setRazorpayPaymentId("pay_B567");
        paymentB.setAmount(499.0);
        paymentB.setCurrency("INR");
        paymentB.setStatus("paid");
        paymentB.setPlan("basic");
        paymentB.setUpgradeStatus("COMPLETED");
        paymentRepository.save(paymentB);
    }

    @AfterEach
    public void tearDown() {
        // Clean up test data to prevent database pollution
        paymentRepository.deleteAll();
    }

    @Test
    @DisplayName("Verify that User A retrieves only User A's payment records (Data Isolation)")
    public void testGetMyPaymentsIsolation() throws Exception {
        // Generate JWT token for User A
        String emailA = "usera@example.com";
        String token = jwtTokenProvider.generateToken(emailA);

        // Mock RestTemplate response for monolith /auth/me call
        Map<String, Object> userProfile = new HashMap<>();
        userProfile.put("id", 1001);
        userProfile.put("name", "User A");
        userProfile.put("email", emailA);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("user", userProfile);

        ResponseEntity<Map> mockResponse = new ResponseEntity<>(responseBody, HttpStatus.OK);

        Mockito.when(restTemplate.exchange(
                Mockito.contains("/auth/me"),
                Mockito.eq(HttpMethod.GET),
                Mockito.any(HttpEntity.class),
                Mockito.eq(Map.class)
        )).thenReturn(mockResponse);

        // Call endpoint and assert isolation
        mockMvc.perform(get("/payments/my")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].userId").value(1001))
                .andExpect(jsonPath("$.data[0].amount").value(999.0))
                .andExpect(jsonPath("$.data[0].plan").value("pro"));
    }
}
