package com.travelagency.package_service.mapper;

import com.travelagency.package_service.dto.PackageData;
import com.travelagency.package_service.dto.PackageFormRequest;
import com.travelagency.package_service.exception.ApiException;
import com.travelagency.package_service.exception.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("PackageFormParser")
class PackageFormParserTest {

    /** A valid form, exactly as the Angular admin form sends it (numbers as strings). */
    private static final Map<String, Object> VALID = Map.of(
            "name", "Marrakech escape",
            "description", "3 nights",
            "destination", "Marrakech",
            "durationNights", "3",
            "price", "2400",
            "startDate", "2027-06-01",
            "endDate", "2027-09-30",
            "discountPercentage", "",
            "imageUrl", "",
            "active", true);

    private final PackageFormParser parser = new PackageFormParser();

    // ---------------------------------------------------------------- happy paths

    @Test
    @DisplayName("Parses the strings sent by the admin form")
    void parse_adminFormStrings_returnsTypedData() {
        // Arrange
        PackageFormRequest form = formWith("name", "  Marrakech escape ");

        // Act
        PackageData data = parser.parse(form);

        // Assert
        assertThat(data.name()).isEqualTo("Marrakech escape");
        assertThat(data.durationNights()).isEqualTo(3);
        assertThat(data.price()).hasToString("2400.00");
        assertThat(data.discountPercentage()).hasToString("0.00");
        assertThat(data.startDate()).isEqualTo(LocalDate.of(2027, 6, 1));
        assertThat(data.endDate()).isEqualTo(LocalDate.of(2027, 9, 30));
        assertThat(data.imageUrl()).isNull();
        assertThat(data.active()).isTrue();
    }

    @Test
    @DisplayName("Accepts JSON numbers as well as strings")
    void parse_jsonNumbers_accepted() {
        // Arrange
        PackageFormRequest form = new PackageFormRequest(
                "Istanbul", null, "Istanbul", 5, 6200.5, null, null, 12.25, "imgs/a.jpeg", "false");

        // Act
        PackageData data = parser.parse(form);

        // Assert
        assertThat(data.durationNights()).isEqualTo(5);
        assertThat(data.price()).hasToString("6200.50");
        assertThat(data.discountPercentage()).hasToString("12.25");
        assertThat(data.description()).isNull();
        assertThat(data.startDate()).isNull();
        assertThat(data.imageUrl()).isEqualTo("imgs/a.jpeg");
        assertThat(data.active()).isFalse();
    }

    @ParameterizedTest(name = "durationNights \"{0}\" -> 3")
    @DisplayName("durationNights accepts whole numbers written in different ways")
    @ValueSource(strings = {"3", " 3 ", "3.0", "3.00"})
    void parse_wholeNumberNights_accepted(String nights) {
        assertThat(parser.parse(formWith("durationNights", nights)).durationNights()).isEqualTo(3);
    }

    @ParameterizedTest(name = "discountPercentage \"{0}\" -> {1}")
    @DisplayName("discountPercentage is optional, defaults to 0 and keeps 2 decimals")
    @CsvSource({"'', 0.00", "0, 0.00", "100, 100.00", "12.5, 12.50", "0.01, 0.01"})
    void parse_discount_normalised(String discount, String expected) {
        assertThat(parser.parse(formWith("discountPercentage", discount)).discountPercentage())
                .hasToString(expected);
    }

    @Test
    @DisplayName("A null discount defaults to 0.00")
    void parse_nullDiscount_defaultsToZero() {
        assertThat(parser.parse(formWith("discountPercentage", null)).discountPercentage()).hasToString("0.00");
    }

    @ParameterizedTest(name = "active \"{0}\" -> {1}")
    @DisplayName("active accepts booleans written as strings and defaults to true")
    @CsvSource({"true, true", "false, false", "TRUE, true", "1, true", "0, false", "'', true"})
    void parse_activeStrings_accepted(String active, boolean expected) {
        assertThat(parser.parse(formWith("active", active)).active()).isEqualTo(expected);
    }

    @Test
    @DisplayName("active defaults to true when absent")
    void parse_nullActive_defaultsToTrue() {
        assertThat(parser.parse(formWith("active", null)).active()).isTrue();
    }

    @Test
    @DisplayName("A price of 0 is allowed")
    void parse_zeroPrice_allowed() {
        assertThat(parser.parse(formWith("price", "0")).price()).hasToString("0.00");
    }

    @Test
    @DisplayName("The same start and end date is allowed")
    void parse_sameStartAndEndDate_allowed() {
        // Arrange
        Map<String, Object> values = new HashMap<>(VALID);
        values.put("startDate", "2027-06-10");
        values.put("endDate", "2027-06-10");

        // Act
        PackageData data = parser.parse(form(values));

        // Assert
        assertThat(data.endDate()).isEqualTo(data.startDate());
    }

    // ---------------------------------------------------------------- missing fields

    @Test
    @DisplayName("Every missing required field is reported together as MISSING_FIELD")
    void parse_requiredFieldsBlank_allReportedAsMissingField() {
        // Arrange
        PackageFormRequest form = new PackageFormRequest("", "", "  ", "", "", "", "", "", "", true);

        // Act + Assert
        assertThatThrownBy(() -> parser.parse(form))
                .isInstanceOfSatisfying(ApiException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo(ErrorCode.MISSING_FIELD);
                    assertThat(exception.getDetails())
                            .containsOnlyKeys("name", "destination", "durationNights", "price");
                });
    }

    @Test
    @DisplayName("A missing body is MISSING_FIELD")
    void parse_nullBody_missingField() {
        assertThatThrownBy(() -> parser.parse(null))
                .isInstanceOfSatisfying(ApiException.class,
                        exception -> assertThat(exception.getCode()).isEqualTo(ErrorCode.MISSING_FIELD));
    }

    // ---------------------------------------------------------------- invalid formats

    @ParameterizedTest(name = "durationNights \"{0}\"")
    @DisplayName("Invalid durationNights values are INVALID_FORMAT")
    @ValueSource(strings = {"2.5", "0", "-1", "abc", "65536"})
    void parse_invalidNights_invalidFormat(String nights) {
        assertInvalid("durationNights", nights);
    }

    @ParameterizedTest(name = "price \"{0}\"")
    @DisplayName("Invalid prices are INVALID_FORMAT")
    @ValueSource(strings = {"abc", "-0.01", "10.123", "100000000", "1,5"})
    void parse_invalidPrice_invalidFormat(String price) {
        assertInvalid("price", price);
    }

    @ParameterizedTest(name = "discountPercentage \"{0}\"")
    @DisplayName("Invalid discounts are INVALID_FORMAT")
    @ValueSource(strings = {"-1", "100.01", "150", "12.345", "x"})
    void parse_invalidDiscount_invalidFormat(String discount) {
        assertInvalid("discountPercentage", discount);
    }

    @ParameterizedTest(name = "{0} \"{1}\"")
    @DisplayName("Dates must be YYYY-MM-DD and real calendar days")
    @CsvSource({
            "startDate, 01/06/2027",
            "startDate, 2027-13-01",
            "startDate, 2027-02-30",
            "endDate,   tomorrow",
            "endDate,   2027-6-1"
    })
    void parse_invalidDate_invalidFormat(String field, String value) {
        assertInvalid(field, value);
    }

    @ParameterizedTest(name = "active \"{0}\"")
    @DisplayName("Unknown boolean words are INVALID_FORMAT")
    @ValueSource(strings = {"maybe", "yes", "2"})
    void parse_invalidActive_invalidFormat(String active) {
        assertInvalid("active", active);
    }

    @ParameterizedTest(name = "{0} longer than {1}")
    @DisplayName("Text fields respect the column lengths")
    @CsvSource({"name, 120", "destination, 120", "imageUrl, 255"})
    void parse_tooLongText_invalidFormat(String field, int max) {
        // the maximum itself is accepted
        parser.parse(formWith(field, "x".repeat(max)));

        assertInvalid(field, "x".repeat(max + 1));
    }

    @Test
    @DisplayName("Objects are refused as values")
    void parse_objectAsValue_invalidFormat() {
        assertInvalid("name", Map.of("x", 1));
    }

    @Test
    @DisplayName("Several invalid fields are all reported")
    void parse_severalInvalidFields_allReported() {
        // Arrange
        PackageFormRequest form = new PackageFormRequest(
                "A", "", "B", "2.5", "abc", "01/06/2027", "", "150", "x".repeat(256), "maybe");

        // Act + Assert
        assertThatThrownBy(() -> parser.parse(form))
                .isInstanceOfSatisfying(ApiException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo(ErrorCode.INVALID_FORMAT);
                    assertThat(exception.getDetails()).containsOnlyKeys(
                            "durationNights", "price", "startDate", "discountPercentage", "imageUrl", "active");
                });
    }

    // ---------------------------------------------------------------- business rule

    @Test
    @DisplayName("endDate before startDate is BUSINESS_RULE_VIOLATION")
    void parse_endBeforeStart_businessRuleViolation() {
        // Arrange
        Map<String, Object> values = new HashMap<>(VALID);
        values.put("startDate", "2027-06-10");
        values.put("endDate", "2027-06-01");

        // Act + Assert
        assertThatThrownBy(() -> parser.parse(form(values)))
                .isInstanceOfSatisfying(ApiException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo(ErrorCode.BUSINESS_RULE_VIOLATION);
                    assertThat(exception.getDetails()).containsKey("endDate");
                });
    }

    // ---------------------------------------------------------------- helpers

    private void assertInvalid(String field, Object value) {
        assertThatThrownBy(() -> parser.parse(formWith(field, value)))
                .isInstanceOfSatisfying(ApiException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo(ErrorCode.INVALID_FORMAT);
                    assertThat(exception.getDetails()).containsOnlyKeys(field);
                });
    }

    private static PackageFormRequest formWith(String field, Object value) {
        Map<String, Object> values = new HashMap<>(VALID);
        values.put(field, value);

        return form(values);
    }

    private static PackageFormRequest form(Map<String, Object> values) {
        return new PackageFormRequest(
                values.get("name"), values.get("description"), values.get("destination"),
                values.get("durationNights"), values.get("price"), values.get("startDate"),
                values.get("endDate"), values.get("discountPercentage"), values.get("imageUrl"),
                values.get("active"));
    }

    @Test
    @DisplayName("A BigDecimal value is read without scientific notation")
    void parse_bigDecimalPrice_plainString() {
        assertThat(parser.parse(formWith("price", new BigDecimal("1E+3"))).price()).hasToString("1000.00");
    }
}
