package com.travelagency.package_service.dto;

import java.math.BigDecimal;

/** Package JSON, same shape as the frontend KzPackage (+ active for the admin form). */
public record PackageResponse(
        Long id,
        String name,
        String description,
        String destination,
        Integer durationNights,
        BigDecimal price,
        String startDate,
        String endDate,
        BigDecimal discountPercentage,
        BigDecimal promoPrice,
        String imageUrl,
        boolean available,
        boolean active,
        CompositionResponse composition) {
}
