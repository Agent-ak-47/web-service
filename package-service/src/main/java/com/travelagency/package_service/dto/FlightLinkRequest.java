package com.travelagency.package_service.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record FlightLinkRequest(
        @NotNull(message = "flightId is required.") @Positive(message = "flightId must be a positive integer.") Long flightId,
        @Positive(message = "position must be a positive integer.") Integer position) {
}
