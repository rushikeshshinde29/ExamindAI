package com.examind.payment.util;

public class PlanPricingMapping {
    public static double getPriceForPlan(String planName) {
        if (planName == null) {
            throw new IllegalArgumentException("Plan name cannot be null");
        }
        return switch (planName.toUpperCase().trim()) {
            case "PRO" -> 999.0;
            case "BASIC" -> 499.0;
            case "FREE" -> 0.0;
            default -> throw new IllegalArgumentException("Unknown plan name: " + planName);
        };
    }
}
