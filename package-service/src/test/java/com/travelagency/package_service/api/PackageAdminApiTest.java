package com.travelagency.package_service.api;

import com.travelagency.package_service.client.CatalogUnavailableException;
import com.travelagency.package_service.entity.TravelPackage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Admin API: create / update / delete / composition")
class PackageAdminApiTest extends ApiTestSupport {

    // ---------------------------------------------------------------- auth

    @ParameterizedTest(name = "{0} -> {1} {2}")
    @DisplayName("Admin endpoints need a valid, open, ADMIN session")
    @CsvSource({
            "NONE,         401, UNAUTHENTICATED",
            "NOT_A_JWT,    401, UNAUTHENTICATED",
            "WRONG_SECRET, 401, UNAUTHENTICATED",
            "NO_SESSION,   401, UNAUTHENTICATED",   // valid signature but logged out
            "EXPIRED,      401, TOKEN_EXPIRED",
            "CLIENT,       403, FORBIDDEN"
    })
    void create_withoutValidAdminToken_rejected(TokenKind kind, int status, String code) throws Exception {
        // Act + Assert
        mvc.perform(auth(post("/api/packages"), token(kind))
                        .contentType(JSON).content(formJson("X", "", "")))
                .andExpect(status().is(status))
                .andExpect(jsonPath("$.error.code").value(code));

        assertThat(packages.count()).isZero();
    }

    // ---------------------------------------------------------------- create

    @Test
    @DisplayName("POST /api/packages returns 201 with the created package")
    void create_validForm_created() throws Exception {
        // Act + Assert
        mvc.perform(post("/api/packages")
                        .header("Authorization", adminToken())
                        .contentType(JSON)
                        .content(formJson("Sahara dream", "2027-03-01", "2027-05-31")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").isNumber())
                .andExpect(jsonPath("$.data.name").value("Sahara dream"))
                .andExpect(jsonPath("$.data.durationNights").value(4))
                .andExpect(jsonPath("$.data.price").value(3000.00))
                .andExpect(jsonPath("$.data.discountPercentage").value(0.00))
                .andExpect(jsonPath("$.data.promoPrice").value(3000.00))
                .andExpect(jsonPath("$.data.imageUrl").value(""))
                .andExpect(jsonPath("$.data.active").value(true))
                .andExpect(jsonPath("$.data.composition.flights", hasSize(0)));

        assertThat(packages.count()).isEqualTo(1);
    }

    @ParameterizedTest(name = "{0}")
    @DisplayName("Invalid bodies are rejected with 400 and nothing is saved")
    @CsvSource(delimiter = '|', value = {
            "{\"name\": \"\", \"destination\": \"Fes\", \"durationNights\": \"2\", \"price\": \"abc\"} | MISSING_FIELD  | name",
            "{\"name\": \"A\", \"destination\": \"Fes\", \"durationNights\": 2, \"price\": 10, \"discountPercentage\": \"120\"} | INVALID_FORMAT | discountPercentage",
            "{\"name\": \"A\", \"destination\": \"Fes\", \"durationNights\": \"0\", \"price\": \"10\"} | INVALID_FORMAT | durationNights",
            "{\"name\": \"A\", \"destination\": \"Fes\", \"durationNights\": \"2\", \"price\": \"10\", \"startDate\": \"2027/01/01\"} | INVALID_FORMAT | startDate",
            "{}                                                                                     | MISSING_FIELD  | price"
    })
    void create_invalidBody_badRequest(String body, String code, String field) throws Exception {
        mvc.perform(post("/api/packages")
                        .header("Authorization", adminToken())
                        .contentType(JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value(code))
                .andExpect(jsonPath("$.error.details." + field).exists());

        assertThat(packages.count()).isZero();
    }

    @Test
    @DisplayName("Malformed JSON is 400 INVALID_FORMAT")
    void create_malformedJson_badRequest() throws Exception {
        mvc.perform(post("/api/packages")
                        .header("Authorization", adminToken())
                        .contentType(JSON)
                        .content("{ not json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_FORMAT"));
    }

    @Test
    @DisplayName("endDate before startDate is 422 BUSINESS_RULE_VIOLATION")
    void create_endBeforeStart_unprocessable() throws Exception {
        mvc.perform(post("/api/packages")
                        .header("Authorization", adminToken())
                        .contentType(JSON)
                        .content(formJson("Bad dates", "2027-05-01", "2027-04-01")))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.error.code").value("BUSINESS_RULE_VIOLATION"))
                .andExpect(jsonPath("$.error.details.endDate").exists());

        assertThat(packages.count()).isZero();
    }

    // ---------------------------------------------------------------- update

    @Test
    @DisplayName("Update works with POST (used by the frontend) and with PUT")
    void update_postAndPut_updated() throws Exception {
        // Arrange
        TravelPackage pkg = savePackage("Old name", "Fes", "100", "0", null, null, true);

        // Act + Assert: POST
        mvc.perform(post("/api/packages/{id}", pkg.getId())
                        .header("Authorization", adminToken())
                        .contentType(JSON)
                        .content("""
                                {"name": "New name", "description": "", "destination": "Fes",
                                 "durationNights": "2", "price": "200", "startDate": "", "endDate": "",
                                 "discountPercentage": "25", "imageUrl": "imgs/x.jpeg", "active": false}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(pkg.getId()))
                .andExpect(jsonPath("$.data.name").value("New name"))
                .andExpect(jsonPath("$.data.promoPrice").value(150.00))
                .andExpect(jsonPath("$.data.available").value(false))
                .andExpect(jsonPath("$.data.imageUrl").value("imgs/x.jpeg"));

        // Act + Assert: PUT
        mvc.perform(put("/api/packages/{id}", pkg.getId())
                        .header("Authorization", adminToken())
                        .contentType(JSON)
                        .content(formJson("Put name", "2027-01-01", "2027-01-10")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Put name"))
                .andExpect(jsonPath("$.data.startDate").value("2027-01-01"))
                .andExpect(jsonPath("$.data.active").value(true));

        // Assert: really stored
        TravelPackage stored = packages.findById(pkg.getId()).orElseThrow();
        assertThat(stored.getName()).isEqualTo("Put name");
        assertThat(stored.getEndDate()).isEqualTo(LocalDate.of(2027, 1, 10));
    }

    @Test
    @DisplayName("Update of an unknown package is 404")
    void update_unknown_notFound() throws Exception {
        mvc.perform(put("/api/packages/{id}", 999_999)
                        .header("Authorization", adminToken())
                        .contentType(JSON)
                        .content(formJson("X", "", "")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("ITEM_NOT_FOUND"));
    }

    @Test
    @DisplayName("Update needs an admin token and leaves the package unchanged otherwise")
    void update_withoutToken_unauthorized() throws Exception {
        TravelPackage pkg = savePackage("A", "Fes", "100", "0", null, null, true);

        mvc.perform(put("/api/packages/{id}", pkg.getId()).contentType(JSON).content(formJson("X", "", "")))
                .andExpect(status().isUnauthorized());

        assertThat(packages.findById(pkg.getId()).orElseThrow().getName()).isEqualTo("A");
    }

    // ---------------------------------------------------------------- delete

    @Test
    @DisplayName("Delete removes the package and its composition rows")
    void delete_existing_packageAndCompositionRemoved() throws Exception {
        // Arrange
        TravelPackage pkg = savePackage("A", "Fes", "100", "0", null, null, true);
        linkFlight(pkg.getId(), 2, 1);
        linkExcursion(pkg.getId(), 1, 1);

        // Act + Assert
        mvc.perform(delete("/api/packages/{id}", pkg.getId()).header("Authorization", adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deleted").value(true))
                .andExpect(jsonPath("$.data.id").value(pkg.getId()));

        mvc.perform(get("/api/packages/{id}", pkg.getId())).andExpect(status().isNotFound());
        assertThat(flightLinks.count()).isZero();
        assertThat(excursionLinks.count()).isZero();
    }

    @Test
    @DisplayName("Delete of an unknown package is 404, with a client token 403")
    void delete_unknownOrClient_rejected() throws Exception {
        TravelPackage pkg = savePackage("A", "Fes", "100", "0", null, null, true);

        mvc.perform(delete("/api/packages/{id}", 999_999).header("Authorization", adminToken()))
                .andExpect(status().isNotFound());

        mvc.perform(delete("/api/packages/{id}", pkg.getId()).header("Authorization", clientToken()))
                .andExpect(status().isForbidden());

        assertThat(packages.existsById(pkg.getId())).isTrue();
    }

    // ---------------------------------------------------------------- composition: flights

    @Test
    @DisplayName("Add flights (explicit and appended position), duplicate is 409, remove")
    void flights_addDuplicateRemove() throws Exception {
        // Arrange
        TravelPackage pkg = savePackage("A", "Marrakech", "100", "0", null, null, true);

        // Act + Assert: explicit position
        mvc.perform(post("/api/packages/{id}/flights", pkg.getId())
                        .header("Authorization", adminToken())
                        .contentType(JSON)
                        .content("{\"flightId\": 2, \"position\": 1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.composition.flights", hasSize(1)))
                .andExpect(jsonPath("$.data.composition.flights[0].id").value(2))
                .andExpect(jsonPath("$.data.composition.flights[0].position").value(1));

        // position omitted (and id sent as a string) -> appended at the end
        mvc.perform(post("/api/packages/{id}/flights", pkg.getId())
                        .header("Authorization", adminToken())
                        .contentType(JSON)
                        .content("{\"flightId\": \"3\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.composition.flights[1].id").value(3))
                .andExpect(jsonPath("$.data.composition.flights[1].position").value(2));

        // duplicate
        mvc.perform(post("/api/packages/{id}/flights", pkg.getId())
                        .header("Authorization", adminToken())
                        .contentType(JSON)
                        .content("{\"flightId\": 2, \"position\": 3}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("DUPLICATE"));

        // remove
        mvc.perform(delete("/api/packages/{id}/flights/{flightId}", pkg.getId(), 2)
                        .header("Authorization", adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.composition.flights", hasSize(1)))
                .andExpect(jsonPath("$.data.composition.flights[0].id").value(3));

        // remove again
        mvc.perform(delete("/api/packages/{id}/flights/{flightId}", pkg.getId(), 2)
                        .header("Authorization", adminToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("ITEM_NOT_FOUND"));
    }

    @ParameterizedTest(name = "{0} -> {1} {2}")
    @DisplayName("Adding a flight fails for bad bodies and unknown items")
    @CsvSource(delimiter = '|', value = {
            "{\"flightId\": 42}               | 404 | ITEM_NOT_FOUND",
            "{}                               | 400 | MISSING_FIELD",
            "{\"flightId\": -1}               | 400 | INVALID_FORMAT",
            "{\"flightId\": 2, \"position\": 0} | 400 | INVALID_FORMAT"
    })
    void addFlight_invalid_rejected(String body, int status, String code) throws Exception {
        // Arrange
        TravelPackage pkg = savePackage("A", "Marrakech", "100", "0", null, null, true);

        // Act + Assert
        mvc.perform(post("/api/packages/{id}/flights", pkg.getId())
                        .header("Authorization", adminToken())
                        .contentType(JSON)
                        .content(body))
                .andExpect(status().is(status))
                .andExpect(jsonPath("$.error.code").value(code));

        assertThat(flightLinks.count()).isZero();
    }

    @Test
    @DisplayName("Adding a flight to an unknown package is 404")
    void addFlight_unknownPackage_notFound() throws Exception {
        mvc.perform(post("/api/packages/{id}/flights", 999_999)
                        .header("Authorization", adminToken())
                        .contentType(JSON)
                        .content("{\"flightId\": 2}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.details.id").value(999_999));
    }

    @Test
    @DisplayName("Adding a flight while the Flight service is down is 502 SERVICE_UNAVAILABLE")
    void addFlight_flightServiceDown_badGateway() throws Exception {
        // Arrange
        TravelPackage pkg = savePackage("A", "Marrakech", "100", "0", null, null, true);
        when(flightClient.findById(anyLong())).thenThrow(new CatalogUnavailableException("down", null));

        // Act + Assert
        mvc.perform(post("/api/packages/{id}/flights", pkg.getId())
                        .header("Authorization", adminToken())
                        .contentType(JSON)
                        .content("{\"flightId\": 2}"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.error.code").value("SERVICE_UNAVAILABLE"));

        assertThat(flightLinks.count()).isZero();
    }

    // ---------------------------------------------------------------- composition: excursions

    @Test
    @DisplayName("Add an excursion, duplicate 409, unknown 404, remove, no token 401")
    void excursions_addDuplicateUnknownRemove() throws Exception {
        // Arrange
        TravelPackage pkg = savePackage("A", "Marrakech", "100", "0", null, null, true);

        // Act + Assert
        mvc.perform(post("/api/packages/{id}/excursions", pkg.getId())
                        .header("Authorization", adminToken())
                        .contentType(JSON)
                        .content("{\"excursionId\": 1, \"position\": 1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.composition.excursions[0].title").value("Marrakech medina tour"));

        mvc.perform(post("/api/packages/{id}/excursions", pkg.getId())
                        .header("Authorization", adminToken())
                        .contentType(JSON)
                        .content("{\"excursionId\": 1}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("DUPLICATE"));

        mvc.perform(post("/api/packages/{id}/excursions", pkg.getId())
                        .header("Authorization", adminToken())
                        .contentType(JSON)
                        .content("{\"excursionId\": 77}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.details.excursionId").value(77));

        mvc.perform(delete("/api/packages/{id}/excursions/{excursionId}", pkg.getId(), 1)
                        .header("Authorization", adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.composition.excursions", hasSize(0)));

        mvc.perform(post("/api/packages/{id}/excursions", pkg.getId())
                        .contentType(JSON)
                        .content("{\"excursionId\": 1}"))
                .andExpect(status().isUnauthorized());

        assertThat(excursionLinks.count()).isZero();
    }
}
