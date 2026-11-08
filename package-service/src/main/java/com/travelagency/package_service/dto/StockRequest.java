package com.travelagency.package_service.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** Body sent by the Reservation / Payment services to reserve or release a package. */
public record StockRequest(
        @NotNull(message = "quantity is required.") @Positive(message = "quantity must be a positive integer.") Integer quantity,
        Object reservationId) {
}
