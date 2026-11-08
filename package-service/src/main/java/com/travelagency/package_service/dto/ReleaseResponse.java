package com.travelagency.package_service.dto;

public record ReleaseResponse(Long itemId, int quantity, Object reservationId, boolean released) {
}
