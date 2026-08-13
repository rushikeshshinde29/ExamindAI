package com.examind.payment.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

/**
 * UNIT TEST
 * Verifies that JwtTokenProvider generates valid tokens, correctly validates them, 
 * extracts email claims, and rejects expired or invalid tokens.
 */
public class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private final String secret = "9a67479c46d5c6439c3e986a7d5b88219c67479c46d5c6439c3e986a7d5b8821";

    @BeforeEach
    public void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        // Inject private jwtSecret field
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", secret);
    }

    @Test
    @DisplayName("Test that valid JWT token is successfully generated, validated, and parsed")
    public void testValidTokenFlow() {
        String email = "student@examind.com";

        // Generate
        String token = jwtTokenProvider.generateToken(email);
        assertNotNull(token);
        assertFalse(token.isEmpty());

        // Validate
        boolean isValid = jwtTokenProvider.validateToken(token);
        assertTrue(isValid);

        // Parse/Extract
        String extractedEmail = jwtTokenProvider.getEmailFromJWT(token);
        assertEquals(email, extractedEmail);
    }

    @Test
    @DisplayName("Test that validation fails for an expired token generated via test helper")
    public void testExpiredTokenValidationFails() {
        String email = "student@examind.com";
        
        // Generate expired token via test helper to keep production clean
        String expiredToken = JwtTokenTestHelper.generateExpiredToken(email, secret);
        assertNotNull(expiredToken);

        // Validate should return false
        boolean isValid = jwtTokenProvider.validateToken(expiredToken);
        assertFalse(isValid, "Expired token validation should return false");
    }

    @Test
    @DisplayName("Test that validation fails for an invalid or tempered token")
    public void testInvalidTokenValidationFails() {
        String invalidToken = "invalid.token.signature";

        boolean isValid = jwtTokenProvider.validateToken(invalidToken);
        assertFalse(isValid, "Invalid token validation should return false");
    }
}
