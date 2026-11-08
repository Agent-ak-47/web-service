package com.travelagency.package_service.exception;

import org.springframework.http.HttpStatus;

/**
 * Error codes shared by every service of the project, with their HTTP status.
 */
public enum ErrorCode {
    MISSING_FIELD(HttpStatus.BAD_REQUEST),
    INVALID_FORMAT(HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(HttpStatus.UNAUTHORIZED),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED),
    FORBIDDEN(HttpStatus.FORBIDDEN),
    ITEM_NOT_FOUND(HttpStatus.NOT_FOUND),
    DUPLICATE(HttpStatus.CONFLICT),
    INSUFFICIENT_AVAILABILITY(HttpStatus.CONFLICT),
    BUSINESS_RULE_VIOLATION(HttpStatus.UNPROCESSABLE_CONTENT),
    SERVICE_UNAVAILABLE(HttpStatus.BAD_GATEWAY),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR);

    private final HttpStatus status;

    ErrorCode(HttpStatus status) {
        this.status = status;
    }

    public HttpStatus status() {
        return status;
    }
}
