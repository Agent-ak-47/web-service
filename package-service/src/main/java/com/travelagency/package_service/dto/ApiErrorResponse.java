package com.travelagency.package_service.dto;

import java.util.Map;

/** Error envelope: { "error": { code, message, details } } */
public record ApiErrorResponse(ApiError error) {

    public static ApiErrorResponse of(String code, String message, Map<String, Object> details) {
        return new ApiErrorResponse(new ApiError(code, message, details == null ? Map.of() : details));
    }
}
