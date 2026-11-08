package com.travelagency.package_service.dto;

public record AvailabilityResponse(Long itemId, boolean available, Integer availableSeats) {
}
