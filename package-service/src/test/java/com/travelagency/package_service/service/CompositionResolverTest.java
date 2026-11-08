package com.travelagency.package_service.service;

import com.travelagency.package_service.client.CatalogUnavailableException;
import com.travelagency.package_service.client.ExcursionClient;
import com.travelagency.package_service.client.FlightClient;
import com.travelagency.package_service.dto.CompositionResponse;
import com.travelagency.package_service.entity.PackageExcursion;
import com.travelagency.package_service.entity.PackageFlight;
import com.travelagency.package_service.repository.PackageExcursionRepository;
import com.travelagency.package_service.repository.PackageFlightRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("CompositionResolver")
class CompositionResolverTest {

    @Mock
    private PackageFlightRepository flightLinks;

    @Mock
    private PackageExcursionRepository excursionLinks;

    @Mock
    private FlightClient flightClient;

    @Mock
    private ExcursionClient excursionClient;

    @InjectMocks
    private CompositionResolver resolver;

    @BeforeEach
    void namesForTheLogs() {
        lenient().when(flightClient.resource()).thenReturn("flights");
        lenient().when(excursionClient.resource()).thenReturn("excursions");
    }

    private void links(List<PackageFlight> flights, List<PackageExcursion> excursions) {
        when(flightLinks.findByPackageIdInOrderByPackageIdAscPositionAscFlightIdAsc(anyCollection()))
                .thenReturn(flights);
        when(excursionLinks.findByPackageIdInOrderByPackageIdAscPositionAscExcursionIdAsc(anyCollection()))
                .thenReturn(excursions);
    }

    private static Optional<Map<String, Object>> item(long id) {
        return Optional.of(Map.of("id", id, "availableSeats", 10));
    }

    @Test
    @DisplayName("Builds the composition in link order and adds the position")
    void resolve_links_itemsInOrderWithPosition() {
        // Arrange
        links(List.of(new PackageFlight(1L, 2L, 1), new PackageFlight(1L, 3L, 2)),
                List.of(new PackageExcursion(1L, 1L, 1)));
        when(flightClient.findById(2L)).thenReturn(item(2));
        when(flightClient.findById(3L)).thenReturn(item(3));
        when(excursionClient.findById(1L)).thenReturn(item(1));

        // Act
        CompositionResponse composition = resolver.resolve(1L);

        // Assert
        assertThat(composition.flights()).extracting(f -> f.get("id")).containsExactly(2L, 3L);
        assertThat(composition.flights()).extracting(f -> f.get("position")).containsExactly(1, 2);
        assertThat(composition.excursions()).singleElement()
                .satisfies(e -> assertThat(e).containsEntry("position", 1).containsEntry("availableSeats", 10));
    }

    @Test
    @DisplayName("An item shared by several packages is fetched only once")
    void resolveAll_sharedItem_fetchedOnce() {
        // Arrange
        links(List.of(new PackageFlight(1L, 2L, 1), new PackageFlight(2L, 2L, 1)),
                List.of(new PackageExcursion(1L, 1L, 1), new PackageExcursion(2L, 1L, 1)));
        when(flightClient.findById(2L)).thenReturn(item(2));
        when(excursionClient.findById(1L)).thenReturn(item(1));

        // Act
        Map<Long, CompositionResponse> result = resolver.resolveAll(List.of(1L, 2L));

        // Assert
        assertThat(result).containsOnlyKeys(1L, 2L);
        assertThat(result.get(1L).flights()).hasSize(1);
        assertThat(result.get(2L).flights()).hasSize(1);
        verify(flightClient, times(1)).findById(2L);
        verify(excursionClient, times(1)).findById(1L);
    }

    @Test
    @DisplayName("When a catalogue service is down its items are skipped and it is not called again")
    void resolve_serviceDown_itemsSkippedAndNoMoreCalls() {
        // Arrange
        links(List.of(new PackageFlight(1L, 2L, 1), new PackageFlight(1L, 3L, 2)),
                List.of(new PackageExcursion(1L, 1L, 1)));
        when(flightClient.findById(2L)).thenThrow(new CatalogUnavailableException("connection refused", null));
        when(excursionClient.findById(1L)).thenReturn(item(1));

        // Act
        CompositionResponse composition = resolver.resolve(1L);

        // Assert
        assertThat(composition.flights()).isEmpty();
        assertThat(composition.excursions()).hasSize(1);
        verify(flightClient, never()).findById(3L);
    }

    @Test
    @DisplayName("An item unknown to its service (404) is skipped, the others are kept")
    void resolve_itemNotFound_skipped() {
        // Arrange
        links(List.of(new PackageFlight(1L, 2L, 1), new PackageFlight(1L, 99L, 2)), List.of());
        when(flightClient.findById(2L)).thenReturn(item(2));
        when(flightClient.findById(99L)).thenReturn(Optional.empty());

        // Act
        CompositionResponse composition = resolver.resolve(1L);

        // Assert
        assertThat(composition.flights()).extracting(f -> f.get("id")).containsExactly(2L);
        verifyNoInteractions(excursionClient);
    }

    @Test
    @DisplayName("A package without links gets an empty composition and no HTTP call")
    void resolve_noLinks_emptyAndNoHttpCall() {
        // Arrange
        links(List.of(), List.of());

        // Act
        CompositionResponse composition = resolver.resolve(1L);

        // Assert
        assertThat(composition.flights()).isEmpty();
        assertThat(composition.excursions()).isEmpty();
        verify(flightClient, never()).findById(anyLong());
        verify(excursionClient, never()).findById(anyLong());
    }

    @Test
    @DisplayName("No package id means no query at all")
    void resolveAll_noIds_noInteraction() {
        assertThat(resolver.resolveAll(List.of())).isEmpty();
        verifyNoInteractions(flightLinks, excursionLinks, flightClient, excursionClient);
    }
}
