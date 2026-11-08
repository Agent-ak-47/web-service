package com.travelagency.package_service.dto;

import java.util.Map;

public record ApiError(String code, String message, Map<String, Object> details) {
}
