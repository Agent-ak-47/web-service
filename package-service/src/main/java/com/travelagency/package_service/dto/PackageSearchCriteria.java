package com.travelagency.package_service.dto;

import java.math.BigDecimal;

/** Query parameters of GET /api/packages (raw values, checked by the service). */
public record PackageSearchCriteria(
        String search,
        String destination,
        String startDate,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        int page,
        int size,
        boolean withComposition) {
}
