package com.travelagency.package_service.mapper;

import com.travelagency.package_service.dto.PackageData;
import com.travelagency.package_service.dto.PackageFormRequest;
import com.travelagency.package_service.exception.ApiException;
import com.travelagency.package_service.exception.ErrorCode;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Turns the raw admin form (strings or numbers, "" = empty) into a validated
 * {@link PackageData}. Field errors are returned together in
 * {@code details} as {@code { "field": "message" }}.
 */
@Component
public class PackageFormParser {

    static final int NAME_MAX = 120;
    static final int DESTINATION_MAX = 120;
    static final int IMAGE_URL_MAX = 255;
    static final int NIGHTS_MAX = 65_535;
    static final BigDecimal PRICE_MAX = new BigDecimal("99999999.99");
    static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private static final String REQUIRED = "This field is required.";

    public PackageData parse(PackageFormRequest request) {
        if (request == null) {
            throw new ApiException(ErrorCode.MISSING_FIELD, "A JSON body is required.");
        }

        Errors errors = new Errors();

        String name = requiredText(errors, "name", request.name(), NAME_MAX);
        String destination = requiredText(errors, "destination", request.destination(), DESTINATION_MAX);
        String description = optionalText(errors, "description", request.description(), Integer.MAX_VALUE);
        String imageUrl = optionalText(errors, "imageUrl", request.imageUrl(), IMAGE_URL_MAX);
        Integer nights = durationNights(errors, request.durationNights());
        BigDecimal price = price(errors, request.price());
        BigDecimal discount = discount(errors, request.discountPercentage());
        LocalDate startDate = date(errors, "startDate", request.startDate());
        LocalDate endDate = date(errors, "endDate", request.endDate());
        Boolean active = bool(errors, "active", request.active(), true);

        errors.throwIfAny();

        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new ApiException(ErrorCode.BUSINESS_RULE_VIOLATION,
                    "The end date must be on or after the start date.",
                    Map.of("endDate", "Must be on or after startDate."));
        }

        return new PackageData(name, description, destination, nights, price, startDate, endDate,
                discount, imageUrl, active);
    }

    // ---------------------------------------------------------------- fields

    private Integer durationNights(Errors errors, Object raw) {
        BigDecimal value = number(errors, "durationNights", raw, true);

        if (value == null) {
            return null;
        }

        if (value.stripTrailingZeros().scale() > 0) {
            return errors.invalid("durationNights", "Must be a whole number of nights.");
        }

        if (value.compareTo(BigDecimal.ONE) < 0 || value.compareTo(BigDecimal.valueOf(NIGHTS_MAX)) > 0) {
            return errors.invalid("durationNights", "Must be between 1 and " + NIGHTS_MAX + ".");
        }

        return value.intValueExact();
    }

    private BigDecimal price(Errors errors, Object raw) {
        BigDecimal value = number(errors, "price", raw, true);

        if (value == null) {
            return null;
        }

        if (value.signum() < 0 || value.compareTo(PRICE_MAX) > 0) {
            return errors.invalid("price", "Must be between 0 and " + PRICE_MAX.toPlainString() + ".");
        }

        if (value.stripTrailingZeros().scale() > 2) {
            return errors.invalid("price", "At most 2 decimals are allowed.");
        }

        return PriceCalculator.money(value);
    }

    private BigDecimal discount(Errors errors, Object raw) {
        BigDecimal value = number(errors, "discountPercentage", raw, false);

        if (value == null) {
            return errors.hasError("discountPercentage") ? null : PriceCalculator.money(BigDecimal.ZERO);
        }

        if (value.signum() < 0 || value.compareTo(HUNDRED) > 0) {
            return errors.invalid("discountPercentage", "Must be between 0 and 100.");
        }

        if (value.stripTrailingZeros().scale() > 2) {
            return errors.invalid("discountPercentage", "At most 2 decimals are allowed.");
        }

        return PriceCalculator.money(value);
    }

    // ---------------------------------------------------------------- scalars

    private String requiredText(Errors errors, String field, Object raw, int max) {
        String value = optionalText(errors, field, raw, max);

        if (value == null && !errors.hasError(field)) {
            errors.missing(field);
        }

        return value;
    }

    /** Trimmed text, null when absent or blank. */
    private String optionalText(Errors errors, String field, Object raw, int max) {
        String text = scalarText(errors, field, raw);

        if (text == null || text.isEmpty()) {
            return null;
        }

        if (text.length() > max) {
            return errors.invalid(field, "At most " + max + " characters.");
        }

        return text;
    }

    private BigDecimal number(Errors errors, String field, Object raw, boolean required) {
        String text = scalarText(errors, field, raw);

        if (text == null || text.isEmpty()) {
            if (required && !errors.hasError(field)) {
                errors.missing(field);
            }

            return null;
        }

        if (raw instanceof Boolean) {
            return errors.invalid(field, "Must be a number.");
        }

        try {
            return new BigDecimal(text);
        }
        catch (NumberFormatException exception) {
            return errors.invalid(field, "Must be a number.");
        }
    }

    private LocalDate date(Errors errors, String field, Object raw) {
        String text = scalarText(errors, field, raw);

        if (text == null || text.isEmpty()) {
            return null;
        }

        try {
            return LocalDate.parse(text);
        }
        catch (DateTimeParseException exception) {
            return errors.invalid(field, "Must be a date in the YYYY-MM-DD format.");
        }
    }

    private Boolean bool(Errors errors, String field, Object raw, boolean defaultValue) {
        if (raw instanceof Boolean value) {
            return value;
        }

        String text = scalarText(errors, field, raw);

        if (text == null || text.isEmpty()) {
            return defaultValue;
        }

        return switch (text.toLowerCase(Locale.ROOT)) {
            case "true", "1" -> true;
            case "false", "0" -> false;
            default -> errors.invalid(field, "Must be true or false.");
        };
    }

    /** String value of a JSON scalar, trimmed; null for JSON null; error for objects/arrays. */
    private String scalarText(Errors errors, String field, Object raw) {
        if (raw == null) {
            return null;
        }

        if (raw instanceof String || raw instanceof Number || raw instanceof Boolean) {
            String text = raw instanceof BigDecimal decimal ? decimal.toPlainString() : raw.toString();

            return text.trim();
        }

        errors.invalid(field, "Must be a single value.");

        return null;
    }

    // ---------------------------------------------------------------- errors

    /** Collects every field error before failing. */
    private static final class Errors {

        private final Map<String, Object> details = new LinkedHashMap<>();
        private boolean missingField;

        void missing(String field) {
            missingField = true;
            details.put(field, REQUIRED);
        }

        <T> T invalid(String field, String message) {
            details.putIfAbsent(field, message);

            return null;
        }

        boolean hasError(String field) {
            return details.containsKey(field);
        }

        void throwIfAny() {
            if (details.isEmpty()) {
                return;
            }

            ErrorCode code = missingField ? ErrorCode.MISSING_FIELD : ErrorCode.INVALID_FORMAT;
            String message = missingField
                    ? "Required fields are missing."
                    : "Some fields have an invalid format.";

            throw new ApiException(code, message, details);
        }
    }
}
