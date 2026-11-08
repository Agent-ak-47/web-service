package com.travelagency.package_service.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Validated and typed version of PackageFormRequest. */
public record PackageData(
        String name,
        String description,
        String destination,
        int durationNights,
        BigDecimal price,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal discountPercentage,
        String imageUrl,
        boolean active) {
}
