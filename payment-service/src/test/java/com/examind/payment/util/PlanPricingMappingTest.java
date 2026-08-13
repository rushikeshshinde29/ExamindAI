package com.examind.payment.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * UNIT TEST
 * Verifies the extracted pricing mapping utility:
 * - Valid plans (PRO, BASIC, FREE) return correct price.
 * - Unknown/invalid plans throw IllegalArgumentException.
 */
public class PlanPricingMappingTest {

    @Test
    @DisplayName("Test that valid plan names return the correct price mapping")
    public void testValidPlanPricing() {
        assertEquals(999.0, PlanPricingMapping.getPriceForPlan("PRO"));
        assertEquals(999.0, PlanPricingMapping.getPriceForPlan("pro ")); // test lowercase + spacing
        
        assertEquals(499.0, PlanPricingMapping.getPriceForPlan("BASIC"));
        assertEquals(499.0, PlanPricingMapping.getPriceForPlan("basic"));
        
        assertEquals(0.0, PlanPricingMapping.getPriceForPlan("FREE"));
        assertEquals(0.0, PlanPricingMapping.getPriceForPlan("free"));
    }

    @Test
    @DisplayName("Test that unknown plan names throw IllegalArgumentException")
    public void testUnknownPlanPricingThrowsException() {
        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            PlanPricingMapping.getPriceForPlan("PREMIUM_VIP");
        });
        assertTrue(exception.getMessage().contains("Unknown plan name"));
    }

    @Test
    @DisplayName("Test that null plan name throws IllegalArgumentException")
    public void testNullPlanPricingThrowsException() {
        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            PlanPricingMapping.getPriceForPlan(null);
        });
        assertTrue(exception.getMessage().contains("Plan name cannot be null"));
    }
}
