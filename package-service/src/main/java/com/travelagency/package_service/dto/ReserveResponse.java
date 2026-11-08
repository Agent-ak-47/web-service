package com.travelagency.package_service.dto;

public record ReserveResponse(Long itemId, int quantity, Object reservationId, boolean reserved) {
}
