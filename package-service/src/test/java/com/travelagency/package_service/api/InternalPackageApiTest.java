package com.travelagency.package_service.api;

import com.travelagency.package_service.entity.TravelPackage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Internal API: /api/internal/packages/{id}/reserve|release")
class InternalPackageApiTest extends ApiTestSupport {

    private static final String RESERVE = "/api/internal/packages/{id}/reserve";
    private static final String RELEASE = "/api/internal/packages/{id}/release";

    @Test
    @DisplayName("Reserve succeeds without a user token when enough seats are left")
    void reserve_enoughSeats_ok() throws Exception {
        // Arrange
        TravelPackage pkg = savePackage("A", "Marrakech", "100", "0", null, inMonths(3), true);
        linkFlight(pkg.getId(), 2, 1);       // 60 seats
        linkExcursion(pkg.getId(), 1, 1);    // 12 seats

        // Act + Assert
        mvc.perform(post(RESERVE, pkg.getId())
                        .contentType(JSON)
                        .content("{\"quantity\": 12, \"reservationId\": \"123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.itemId").value(pkg.getId()))
                .andExpect(jsonPath("$.data.quantity").value(12))
                .andExpect(jsonPath("$.data.reservationId").value("123"))
                .andExpect(jsonPath("$.data.reserved").value(true));
    }

    @Test
    @DisplayName("Without composition only the package itself is checked; a numeric reservationId is echoed")
    void reserve_noComposition_ok() throws Exception {
        TravelPackage pkg = savePackage("A", "Marrakech", "100", "0", null, null, true);

        mvc.perform(post(RESERVE, pkg.getId())
                        .contentType(JSON)
                        .content("{\"quantity\": 50, \"reservationId\": 7}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reservationId").value(7));
    }

    @Test
    @DisplayName("More than the seats left is 409 with requested/available in details")
    void reserve_notEnoughSeats_conflict() throws Exception {
        // Arrange
        TravelPackage pkg = savePackage("A", "Marrakech", "100", "0", null, null, true);
        linkExcursion(pkg.getId(), 1, 1);    // 12 seats

        // Act + Assert
        mvc.perform(post(RESERVE, pkg.getId())
                        .contentType(JSON)
                        .content("{\"quantity\": 13, \"reservationId\": \"9\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("INSUFFICIENT_AVAILABILITY"))
                .andExpect(jsonPath("$.error.details.requested").value(13))
                .andExpect(jsonPath("$.error.details.available").value(12));
    }

    @ParameterizedTest(name = "active={0}, endDate in {1} day(s)")
    @DisplayName("Inactive or expired packages cannot be reserved (409, available=0)")
    @CsvSource({"false, 30", "true, -1"})
    void reserve_inactiveOrExpired_conflict(boolean active, int endInDays) throws Exception {
        // Arrange
        TravelPackage pkg = savePackage("A", "X", "100", "0",
                LocalDate.now().minusMonths(2), LocalDate.now().plusDays(endInDays), active);

        // Act + Assert
        mvc.perform(post(RESERVE, pkg.getId())
                        .contentType(JSON)
                        .content("{\"quantity\": 1, \"reservationId\": \"1\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("INSUFFICIENT_AVAILABILITY"))
                .andExpect(jsonPath("$.error.details.available").value(0));
    }

    @ParameterizedTest(name = "{0}")
    @DisplayName("Unknown package is 404 for reserve and release")
    @ValueSource(strings = {RESERVE, RELEASE})
    void stock_unknownPackage_notFound(String path) throws Exception {
        mvc.perform(post(path, 999_999)
                        .contentType(JSON)
                        .content("{\"quantity\": 1, \"reservationId\": \"1\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("ITEM_NOT_FOUND"));
    }

    @ParameterizedTest(name = "{0} -> {1}")
    @DisplayName("The quantity is validated")
    @CsvSource(delimiter = '|', value = {
            "{\"reservationId\": \"1\"}  | MISSING_FIELD",
            "{\"quantity\": 0}           | INVALID_FORMAT",
            "{\"quantity\": -3}          | INVALID_FORMAT",
            "{\"quantity\": \"abc\"}     | INVALID_FORMAT"
    })
    void reserve_invalidQuantity_badRequest(String body, String code) throws Exception {
        // Arrange
        TravelPackage pkg = savePackage("A", "X", "100", "0", null, null, true);

        // Act + Assert
        mvc.perform(post(RESERVE, pkg.getId()).contentType(JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value(code));
    }

    @Test
    @DisplayName("Release answers 200 even for an inactive package")
    void release_existing_ok() throws Exception {
        TravelPackage pkg = savePackage("A", "X", "100", "0", null, null, false);

        mvc.perform(post(RELEASE, pkg.getId())
                        .contentType(JSON)
                        .content("{\"quantity\": 2, \"reservationId\": \"123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.itemId").value(pkg.getId()))
                .andExpect(jsonPath("$.data.quantity").value(2))
                .andExpect(jsonPath("$.data.reservationId").value("123"))
                .andExpect(jsonPath("$.data.released").value(true));
    }
}
