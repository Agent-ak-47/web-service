package com.travelagency.package_service.exception;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Business exception turned into {@code { "error": { code, message, details } }}
 * by {@link GlobalExceptionHandler}.
 */
public class ApiException extends RuntimeException {

    private final ErrorCode code;
    private final Map<String, Object> details;

    public ApiException(ErrorCode code, String message) {
        this(code, message, Map.of());
    }

    public ApiException(ErrorCode code, String message, Map<String, ?> details) {
        super(message);
        this.code = code;
        this.details = details == null ? Map.of() : Collections.unmodifiableMap(new LinkedHashMap<>(details));
    }

    public ErrorCode getCode() {
        return code;
    }

    public Map<String, Object> getDetails() {
        return details;
    }

    public static ApiException packageNotFound(long id) {
        return new ApiException(ErrorCode.ITEM_NOT_FOUND, "Package not found.", Map.of("id", id));
    }
}
