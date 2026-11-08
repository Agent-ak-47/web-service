package com.travelagency.package_service.mapper;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("PriceCalculator")
class PriceCalculatorTest {

    @ParameterizedTest(name = "{0} at {1}% -> {2}")
    @DisplayName("promoPrice = price * (100 - discount) / 100, HALF_UP to 2 decimals")
    @CsvSource({
            "2400.00, 10.00, 2160.00",   // seed package 1
            "6200.00, 0,     6200.00",   // no discount keeps the price
            "99.99,   12.5,  87.49",     // 87.49125 -> 87.49
            "0.05,    50,    0.03",      // 0.025 -> 0.03 (HALF_UP)
            "19.99,   15,    16.99",     // 16.9915 -> 16.99
            "0.10,    33.33, 0.07",      // 0.066667 -> 0.07
            "500,     100,   0.00"       // full discount is free
    })
    void promoPrice_appliesDiscount_roundedHalfUp(String price, String discount, String expected) {
        // Act
        BigDecimal promo = PriceCalculator.promoPrice(new BigDecimal(price), new BigDecimal(discount));

        // Assert
        assertThat(promo).hasToString(expected);
    }

    @Test
    @DisplayName("A null discount is treated as 0 and a null price as 0")
    void promoPrice_nullValues_treatedAsZero() {
        assertThat(PriceCalculator.promoPrice(new BigDecimal("10"), null)).hasToString("10.00");
        assertThat(PriceCalculator.promoPrice(null, new BigDecimal("10"))).hasToString("0.00");
    }

    @ParameterizedTest(name = "{0} -> {1}")
    @DisplayName("money() always returns 2 decimals")
    @CsvSource({"10, 10.00", "10.5, 10.50", "10.005, 10.01", "0, 0.00"})
    void money_anyValue_hasTwoDecimals(String value, String expected) {
        assertThat(PriceCalculator.money(new BigDecimal(value))).hasToString(expected);
    }

    @Test
    @DisplayName("money(null) is 0.00")
    void money_null_isZero() {
        assertThat(PriceCalculator.money(null)).hasToString("0.00");
    }
}
