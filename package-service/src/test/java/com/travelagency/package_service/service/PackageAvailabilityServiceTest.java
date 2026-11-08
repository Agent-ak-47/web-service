package com.travelagency.package_service.service;

import com.travelagency.package_service.dto.AvailabilityResponse;
import com.travelagency.package_service.dto.CompositionResponse;
import com.travelagency.package_service.dto.ReleaseResponse;
import com.travelagency.package_service.dto.ReserveResponse;
import com.travelagency.package_service.dto.StockRequest;
import com.travelagency.package_service.entity.TravelPackage;
import com.travelagency.package_service.exception.ApiException;
import com.travelagency.package_service.exception.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("PackageAvailabilityService")
class PackageAvailabilityServiceTest {

    private static final long ID = 7L;

    @Mock
    private PackageQueryService queries;

    @Mock
    private CompositionResolver compositionResolver;

    @InjectMocks
    private PackageAvailabilityService service;

    private static TravelPackage pkg(boolean active, LocalDate endDate) {
        TravelPackage entity = new TravelPackage();
        entity.setId(ID);
        entity.setActive(active);
        entity.setEndDate(endDate);
        return entity;
    }

    /** Composition with one flight and one excursion having these seats. */
    private static CompositionResponse composition(Object flightSeats, Object excursionSeats) {
        return new CompositionResponse(
                List.of(Map.of("id", 2, "availableSeats", flightSeats)),
                List.of(Map.of("id", 1, "availableSeats", excursionSeats)));
    }

    private void given(TravelPackage entity, CompositionResponse composition) {
        when(queries.findEntity(ID)).thenReturn(entity);
        when(compositionResolver.resolve(ID)).thenReturn(composition);
    }

    // ---------------------------------------------------------------- availability

    @Test
    @DisplayName("availableSeats is the minimum across flights and excursions")
    void availability_composition_minimumSeats() {
        // Arrange
        given(pkg(true, null), composition(60, 12));

        // Act
        AvailabilityResponse response = service.availability(ID);

        // Assert
        assertThat(response.itemId()).isEqualTo(ID);
        assertThat(response.available()).isTrue();
        assertThat(response.availableSeats()).isEqualTo(12);
        verify(queries).findEntity(ID);
        verify(compositionResolver).resolve(ID);
    }

    @Test
    @DisplayName("Without composition, availableSeats is null and the package is available")
    void availability_noComposition_seatsNull() {
        // Arrange
        given(pkg(true, null), CompositionResponse.empty());

        // Act
        AvailabilityResponse response = service.availability(ID);

        // Assert
        assertThat(response.availableSeats()).isNull();
        assertThat(response.available()).isTrue();
    }

    @ParameterizedTest(name = "endDate today{0} days -> available={1}")
    @DisplayName("A package is available until its endDate included")
    @CsvSource({"-1, false", "0, true", "30, true"})
    void availability_endDate_boundary(int daysFromToday, boolean expected) {
        // Arrange
        given(pkg(true, LocalDate.now().plusDays(daysFromToday)), CompositionResponse.empty());

        // Act + Assert
        assertThat(service.availability(ID).available()).isEqualTo(expected);
    }

    @Test
    @DisplayName("An inactive package is not available")
    void availability_inactive_notAvailable() {
        given(pkg(false, null), composition(60, 12));

        assertThat(service.availability(ID).available()).isFalse();
    }

    @Test
    @DisplayName("A package with a sold-out item is not available")
    void availability_zeroSeats_notAvailable() {
        given(pkg(true, null), composition(60, 0));

        AvailabilityResponse response = service.availability(ID);

        assertThat(response.available()).isFalse();
        assertThat(response.availableSeats()).isZero();
    }

    @Test
    @DisplayName("Seats are also read from availablePlaces or from a numeric string")
    void availableSeats_otherKeysAndStrings_parsed() {
        // Arrange
        CompositionResponse composition = new CompositionResponse(
                List.of(Map.of("id", 2, "availableSeats", "7")),
                List.of(Map.of("id", 1, "availablePlaces", 9), Map.of("id", 3, "title", "no seats")));

        // Act + Assert
        assertThat(PackageAvailabilityService.availableSeats(composition)).isEqualTo(7);
    }

    // ---------------------------------------------------------------- reserve / release

    @Test
    @DisplayName("reserve() succeeds when enough seats and echoes the request")
    void reserve_enoughSeats_reserved() {
        // Arrange
        given(pkg(true, null), composition(60, 12));

        // Act
        ReserveResponse response = service.reserve(ID, new StockRequest(2, "123"));

        // Assert
        assertThat(response).isEqualTo(new ReserveResponse(ID, 2, "123", true));
    }

    @Test
    @DisplayName("reserve() with more than the seats left is INSUFFICIENT_AVAILABILITY")
    void reserve_notEnoughSeats_insufficientAvailability() {
        // Arrange
        given(pkg(true, null), composition(60, 12));

        // Act + Assert
        assertThatThrownBy(() -> service.reserve(ID, new StockRequest(13, "9")))
                .isInstanceOfSatisfying(ApiException.class, e -> {
                    assertThat(e.getCode()).isEqualTo(ErrorCode.INSUFFICIENT_AVAILABILITY);
                    assertThat(e.getDetails())
                            .containsEntry("itemId", ID)
                            .containsEntry("requested", 13)
                            .containsEntry("available", 12);
                });
    }

    @Test
    @DisplayName("reserve() on an inactive package reports 0 available")
    void reserve_inactive_insufficientAvailabilityWithZero() {
        // Arrange
        given(pkg(false, null), composition(60, 12));

        // Act + Assert
        assertThatThrownBy(() -> service.reserve(ID, new StockRequest(1, "1")))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getDetails()).containsEntry("available", 0));
    }

    @Test
    @DisplayName("reserve() on an unknown package propagates ITEM_NOT_FOUND")
    void reserve_unknownPackage_itemNotFound() {
        // Arrange
        when(queries.findEntity(ID)).thenThrow(ApiException.packageNotFound(ID));

        // Act + Assert
        assertThatThrownBy(() -> service.reserve(ID, new StockRequest(1, "1")))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo(ErrorCode.ITEM_NOT_FOUND));
        verifyNoInteractions(compositionResolver);
    }

    @Test
    @DisplayName("release() only checks that the package exists")
    void release_existingPackage_released() {
        // Arrange
        when(queries.findEntity(ID)).thenReturn(pkg(false, null));

        // Act
        ReleaseResponse response = service.release(ID, new StockRequest(2, 123));

        // Assert
        assertThat(response).isEqualTo(new ReleaseResponse(ID, 2, 123, true));
        verifyNoInteractions(compositionResolver);
    }
}
