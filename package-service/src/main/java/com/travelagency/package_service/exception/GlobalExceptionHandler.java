package com.travelagency.package_service.exception;

import com.travelagency.package_service.dto.ApiErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/** Turns every error into {@code { "error": { code, message, details } }}. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final Set<String> MISSING_CODES = Set.of("NotNull", "NotBlank", "NotEmpty");

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiErrorResponse> handleApi(ApiException exception) {
        return error(exception.getCode(), exception.getMessage(), exception.getDetails());
    }

    /** @Valid on a request body (MethodArgumentNotValidException extends BindException). */
    @ExceptionHandler(BindException.class)
    public ResponseEntity<ApiErrorResponse> handleBind(BindException exception) {
        Map<String, Object> details = new LinkedHashMap<>();
        boolean missing = false;

        for (FieldError fieldError : exception.getFieldErrors()) {
            details.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage());
            missing |= fieldError.getCode() != null && MISSING_CODES.contains(fieldError.getCode());
        }

        return missing
                ? error(ErrorCode.MISSING_FIELD, "Required fields are missing.", details)
                : error(ErrorCode.INVALID_FORMAT, "Some fields have an invalid format.", details);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodValidation(HandlerMethodValidationException exception) {
        Map<String, Object> details = new LinkedHashMap<>();
        exception.getParameterValidationResults().forEach(result -> details.put(
                String.valueOf(result.getMethodParameter().getParameterName()),
                result.getResolvableErrors().isEmpty() ? "Invalid value."
                        : result.getResolvableErrors().getFirst().getDefaultMessage()));

        return error(ErrorCode.INVALID_FORMAT, "Some parameters are invalid.", details);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleUnreadable(HttpMessageNotReadableException exception) {
        return error(ErrorCode.INVALID_FORMAT, "The request body is missing or is not valid JSON.", Map.of());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException exception) {
        String expected = exception.getRequiredType() == null
                ? "another type"
                : exception.getRequiredType().getSimpleName().toLowerCase();

        return error(ErrorCode.INVALID_FORMAT, "Invalid value for " + exception.getName() + ".",
                Map.of(exception.getName(), "Must be a valid " + expected + "."));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiErrorResponse> handleMissingParam(MissingServletRequestParameterException exception) {
        return error(ErrorCode.MISSING_FIELD, "Missing parameter " + exception.getParameterName() + ".",
                Map.of(exception.getParameterName(), "This parameter is required."));
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ApiErrorResponse> handleMissingHeader(MissingRequestHeaderException exception) {
        return error(ErrorCode.MISSING_FIELD, "Missing header " + exception.getHeaderName() + ".", Map.of());
    }

    @ExceptionHandler({NoResourceFoundException.class, NoHandlerFoundException.class})
    public ResponseEntity<ApiErrorResponse> handleNoRoute(Exception exception) {
        return error(ErrorCode.ITEM_NOT_FOUND, "Route not found.", Map.of());
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiErrorResponse> handleMethod(HttpRequestMethodNotSupportedException exception) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(ApiErrorResponse.of(ErrorCode.INVALID_FORMAT.name(),
                        "Method " + exception.getMethod() + " is not supported on this route.", Map.of()));
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiErrorResponse> handleMediaType(HttpMediaTypeNotSupportedException exception) {
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                .body(ApiErrorResponse.of(ErrorCode.INVALID_FORMAT.name(),
                        "Content-Type must be application/json.", Map.of()));
    }

    /** A database constraint (CHECK, FK...) that the validation did not catch. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleIntegrity(DataIntegrityViolationException exception) {
        log.warn("Database constraint violated: {}", exception.getMostSpecificCause().getMessage());

        return error(ErrorCode.BUSINESS_RULE_VIOLATION, "The data breaks a database rule.", Map.of());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception exception) {
        log.error("Unexpected error", exception);

        return error(ErrorCode.INTERNAL_ERROR, "An unexpected error occurred.", Map.of());
    }

    private static ResponseEntity<ApiErrorResponse> error(ErrorCode code, String message, Map<String, Object> details) {
        return ResponseEntity.status(code.status()).body(ApiErrorResponse.of(code.name(), message, details));
    }
}
