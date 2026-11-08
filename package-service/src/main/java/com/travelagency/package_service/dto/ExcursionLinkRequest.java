package com.travelagency.package_service.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ExcursionLinkRequest(
        @NotNull(message = "excursionId is required.") @Positive(message = "excursionId must be a positive integer.") Long excursionId,
        @Positive(message = "position must be a positive integer.") Integer position) {
}
