package com.travelagency.package_service.api;

import com.travelagency.package_service.client.CatalogUnavailableException;
import com.travelagency.package_service.entity.TravelPackage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.time.LocalDate;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Public API: GET /api/packages, /{id}, /{id}/availability")
class PackageQueryApiTest extends ApiTestSupport {

    // ---------------------------------------------------------------- list

    @Test
    @DisplayName("The public list hides inactive packages and returns the pagination envelope")
    void list_public_hidesInactive() throws Exception {
        // Arrange
        savePackage("Marrakech escape", "Marrakech", "2400", "10", inMonths(1), inMonths(4), true);
        savePackage("Istanbul wonders", "Istanbul", "6200", "0", inMonths(2), inMonths(5), true);
        savePackage("Old offer", "Fes", "900", "0", null, null, false);

        // Act + Assert
        mvc.perform(get("/api/packages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.data", hasSize(2)))
                .andExpect(jsonPath("$.data.page").value(1))
                .andExpect(jsonPath("$.data.size").value(20))
                .andExpect(jsonPath("$.data.total").value(2))
                .andExpect(jsonPath("$.data.totalPages").value(1))
                .andExpect(jsonPath("$.data.data[0].name").value("Marrakech escape"))
                .andExpect(jsonPath("$.data.data[0].promoPrice").value(2160.00))
                .andExpect(jsonPath("$.data.data[0].available").value(true))
                .andExpect(jsonPath("$.data.data[0].composition.flights", hasSize(0)));
    }

    @ParameterizedTest(name = "{0} token -> {1} package(s)")
    @DisplayName("Only a valid ADMIN token also sees inactive packages; bad tokens are ignored")
    @CsvSource({
            "ADMIN,        2",
            "CLIENT,       1",
            "NONE,         1",
            "NOT_A_JWT,    1",
            "EXPIRED,      1",
            "NO_SESSION,   1",
            "WRONG_SECRET, 1"
    })
    void list_tokenKind_inactiveOnlyForAdmin(TokenKind kind, int expectedTotal) throws Exception {
        // Arrange
        savePackage("Active", "Marrakech", "100", "0", null, null, true);
        savePackage("Inactive", "Fes", "100", "0", null, null, false);

        // Act + Assert
        mvc.perform(auth(get("/api/packages"), token(kind)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(expectedTotal));
    }

    @Test
    @DisplayName("In the admin list an inactive package has available=false and active=false")
    void list_admin_inactiveFlags() throws Exception {
        savePackage("Inactive", "Fes", "100", "0", null, null, false);

        mvc.perform(get("/api/packages").header("Authorization", adminToken()))
                .andExpect(jsonPath("$.data.data[0].available").value(false))
                .andExpect(jsonPath("$.data.data[0].active").value(false));
    }

    @ParameterizedTest(name = "{0}={1} -> {2} result(s)")
    @DisplayName("Filters are applied in the database")
    @CsvSource({
            "search,      MARRA,       1",   // case-insensitive, on the name
            "search,      nights,      1",   // on the name
            "search,      istan,       1",   // on the destination
            "search,      100%_,       0",   // LIKE wildcards are escaped
            "destination, ist,         1",
            "destination, zz,          0",
            "startDate,   2027,        3",
            "startDate,   2027-03,     2",
            "startDate,   2027-03-20,  1",
            "maxPrice,    900,         2",   // promoPrice of 'Marrakech escape' = 900.00
            "maxPrice,    899.99,      1",
            "minPrice,    900,         2",
            "minPrice,    6200.01,     0"
    })
    void list_filter_appliedInDatabase(String param, String value, int expectedTotal) throws Exception {
        // Arrange
        savePackage("Marrakech escape", "Marrakech", "1000", "10", LocalDate.of(2027, 3, 10), null, true);
        savePackage("Desert nights", "Merzouga", "500", "0", LocalDate.of(2027, 4, 1), null, true);
        savePackage("Wonders", "Istanbul", "6200", "0", LocalDate.of(2027, 3, 20), null, true);

        // Act + Assert
        mvc.perform(get("/api/packages").param(param, value))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(expectedTotal));
    }

    @Test
    @DisplayName("Filters can be combined")
    void list_combinedFilters_intersection() throws Exception {
        savePackage("Marrakech escape", "Marrakech", "1000", "10", LocalDate.of(2027, 3, 10), null, true);
        savePackage("Marrakech luxury", "Marrakech", "9000", "0", LocalDate.of(2027, 3, 12), null, true);

        mvc.perform(get("/api/packages").param("destination", "marrakech")
                        .param("startDate", "2027-03").param("maxPrice", "5000"))
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.data[0].name").value("Marrakech escape"));
    }

    @Test
    @DisplayName("Pagination is 1-based, ordered by id, and size is capped at 100")
    void list_pagination_oneBased() throws Exception {
        // Arrange
        savePackage("A", "X", "1", "0", null, null, true);
        savePackage("B", "X", "1", "0", null, null, true);
        savePackage("C", "X", "1", "0", null, null, true);

        // Act + Assert
        mvc.perform(get("/api/packages").param("page", "2").param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.data", hasSize(1)))
                .andExpect(jsonPath("$.data.data[0].name").value("C"))
                .andExpect(jsonPath("$.data.page").value(2))
                .andExpect(jsonPath("$.data.size").value(2))
                .andExpect(jsonPath("$.data.total").value(3))
                .andExpect(jsonPath("$.data.totalPages").value(2));

        mvc.perform(get("/api/packages").param("size", "500"))
                .andExpect(jsonPath("$.data.size").value(100));
    }

    @ParameterizedTest(name = "{0}={1} -> 400")
    @DisplayName("Invalid query parameters are INVALID_FORMAT with the parameter in details")
    @CsvSource({
            "startDate, june",
            "startDate, 2027-13",
            "page,      0",
            "size,      0",
            "page,      abc",
            "maxPrice,  cheap",
            "minPrice,  1e",
            "withComposition, maybe"
    })
    void list_invalidParameter_badRequest(String param, String value) throws Exception {
        mvc.perform(get("/api/packages").param(param, value))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_FORMAT"))
                .andExpect(jsonPath("$.error.details." + param).exists());
    }

    @Test
    @DisplayName("The composition is fetched only with withComposition=true, once per item")
    void list_withComposition_fetchedOnDemandOncePerItem() throws Exception {
        // Arrange
        TravelPackage first = savePackage("A", "Marrakech", "100", "0", null, null, true);
        TravelPackage second = savePackage("B", "Marrakech", "100", "0", null, null, true);
        linkFlight(first.getId(), 2, 1);
        linkFlight(second.getId(), 2, 1);
        linkExcursion(second.getId(), 1, 1);

        // Act + Assert: default = no composition, no HTTP call
        mvc.perform(get("/api/packages"))
                .andExpect(jsonPath("$.data.data[0].composition.flights", hasSize(0)));
        verify(flightClient, never()).findById(anyLong());

        // Act + Assert: with composition, flight 2 is shared but fetched once
        mvc.perform(get("/api/packages").param("withComposition", "true"))
                .andExpect(jsonPath("$.data.data[0].composition.flights[0].flightNumber").value("RAM205"))
                .andExpect(jsonPath("$.data.data[1].composition.flights[0].position").value(1))
                .andExpect(jsonPath("$.data.data[1].composition.excursions[0].title").value("Marrakech medina tour"));
        verify(flightClient, times(1)).findById(2L);
    }

    // ---------------------------------------------------------------- detail

    @Test
    @DisplayName("GET by id returns the full composition ordered by position and 2-decimal money")
    void getById_existing_fullComposition() throws Exception {
        // Arrange
        TravelPackage pkg = savePackage("Marrakech escape", "Marrakech", "2400", "10",
                LocalDate.of(2027, 6, 1), LocalDate.of(2027, 9, 30), true);
        linkFlight(pkg.getId(), 3, 2);
        linkFlight(pkg.getId(), 2, 1);
        linkExcursion(pkg.getId(), 1, 1);

        // Act + Assert
        mvc.perform(get("/api/packages/{id}", pkg.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(pkg.getId()))
                .andExpect(jsonPath("$.data.startDate").value("2027-06-01"))
                .andExpect(jsonPath("$.data.endDate").value("2027-09-30"))
                .andExpect(jsonPath("$.data.imageUrl").value(""))
                .andExpect(jsonPath("$.data.durationNights").value(3))
                .andExpect(jsonPath("$.data.composition.flights", hasSize(2)))
                .andExpect(jsonPath("$.data.composition.flights[0].id").value(2))
                .andExpect(jsonPath("$.data.composition.flights[1].id").value(3))
                .andExpect(jsonPath("$.data.composition.excursions[0].position").value(1))
                .andExpect(content().string(containsString("\"price\":2400.00")))
                .andExpect(content().string(containsString("\"promoPrice\":2160.00")))
                .andExpect(content().string(containsString("\"discountPercentage\":10.00")));
    }

    @Test
    @DisplayName("GET by id still answers 200 when a catalogue service is down (items skipped)")
    void getById_catalogueDown_itemsSkipped() throws Exception {
        // Arrange
        TravelPackage pkg = savePackage("A", "Marrakech", "100", "0", null, null, true);
        linkFlight(pkg.getId(), 2, 1);
        linkExcursion(pkg.getId(), 1, 1);
        linkExcursion(pkg.getId(), 99, 2);   // unknown to the excursion service
        when(flightClient.findById(anyLong())).thenThrow(new CatalogUnavailableException("down", null));

        // Act + Assert
        mvc.perform(get("/api/packages/{id}", pkg.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.composition.flights", hasSize(0)))
                .andExpect(jsonPath("$.data.composition.excursions", hasSize(1)));
    }

    @Test
    @DisplayName("An inactive package is still returned by id, with available=false")
    void getById_inactive_returnedNotAvailable() throws Exception {
        TravelPackage pkg = savePackage("Old", "Fes", "100", "0", null, null, false);

        mvc.perform(get("/api/packages/{id}", pkg.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.available").value(false))
                .andExpect(jsonPath("$.data.startDate").value(""));
    }

    @Test
    @DisplayName("Unknown package is 404 ITEM_NOT_FOUND with the id in details")
    void getById_unknown_notFound() throws Exception {
        mvc.perform(get("/api/packages/{id}", 999_999))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("ITEM_NOT_FOUND"))
                .andExpect(jsonPath("$.error.message").exists())
                .andExpect(jsonPath("$.error.details.id").value(999_999));
    }

    @Test
    @DisplayName("A non-numeric id is 400 and an unknown route is a JSON 404")
    void routing_badIdOrUnknownRoute_jsonErrors() throws Exception {
        mvc.perform(get("/api/packages/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_FORMAT"))
                .andExpect(jsonPath("$.error.details.id").exists());

        mvc.perform(get("/api/unknown/route"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("ITEM_NOT_FOUND"));
    }

    // ---------------------------------------------------------------- availability

    @Test
    @DisplayName("Availability is the minimum of the seats left in the composition")
    void availability_composition_minimumSeats() throws Exception {
        // Arrange
        TravelPackage pkg = savePackage("A", "Marrakech", "100", "0", null, inMonths(2), true);
        linkFlight(pkg.getId(), 2, 1);       // 60 seats
        linkExcursion(pkg.getId(), 1, 1);    // 12 seats

        // Act + Assert
        mvc.perform(get("/api/packages/{id}/availability", pkg.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.itemId").value(pkg.getId()))
                .andExpect(jsonPath("$.data.available").value(true))
                .andExpect(jsonPath("$.data.availableSeats").value(12));
    }

    @Test
    @DisplayName("Without composition availableSeats is null; expired or inactive is not available")
    void availability_noCompositionExpiredInactive() throws Exception {
        // Arrange
        TravelPackage empty = savePackage("Empty", "X", "100", "0", null, null, true);
        TravelPackage expired = savePackage("Expired", "X", "100", "0",
                LocalDate.now().minusMonths(3), LocalDate.now().minusDays(1), true);
        TravelPackage inactive = savePackage("Inactive", "X", "100", "0", null, null, false);

        // Act + Assert
        mvc.perform(get("/api/packages/{id}/availability", empty.getId()))
                .andExpect(jsonPath("$.data.available").value(true))
                .andExpect(jsonPath("$.data.availableSeats").doesNotExist());

        mvc.perform(get("/api/packages/{id}/availability", expired.getId()))
                .andExpect(jsonPath("$.data.available").value(false));

        mvc.perform(get("/api/packages/{id}/availability", inactive.getId()))
                .andExpect(jsonPath("$.data.available").value(false));

        mvc.perform(get("/api/packages/{id}/availability", 999_999))
                .andExpect(status().isNotFound());
    }

    // ---------------------------------------------------------------- CORS

    @Test
    @DisplayName("CORS preflight allows the Angular origin with credentials")
    void cors_frontendOrigin_allowed() throws Exception {
        mvc.perform(options("/api/packages/1")
                        .header("Origin", "http://localhost:4200")
                        .header("Access-Control-Request-Method", "DELETE")
                        .header("Access-Control-Request-Headers", "Authorization, Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:4200"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    @DisplayName("CORS preflight rejects other origins")
    void cors_otherOrigin_forbidden() throws Exception {
        mvc.perform(options("/api/packages")
                        .header("Origin", "http://evil.example")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }
}
