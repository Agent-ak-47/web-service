package com.travelagency.package_service.mapper;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Money helpers: every amount is a BigDecimal with 2 decimals. */
public final class PriceCalculator {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private PriceCalculator() {
    }

    /** promoPrice = price * (100 - discountPercentage) / 100, rounded HALF_UP to 2 decimals. */
    public static BigDecimal promoPrice(BigDecimal price, BigDecimal discountPercentage) {
        BigDecimal safePrice = price == null ? BigDecimal.ZERO : price;
        BigDecimal discount = discountPercentage == null ? BigDecimal.ZERO : discountPercentage;

        return safePrice.multiply(HUNDRED.subtract(discount))
                .divide(HUNDRED, 2, RoundingMode.HALF_UP);
    }

    public static BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }
}
