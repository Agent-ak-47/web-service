package com.travelagency.package_service.service;

import com.travelagency.package_service.dto.PackageData;
import com.travelagency.package_service.entity.PackageExcursion;
import com.travelagency.package_service.entity.PackageExcursionId;
import com.travelagency.package_service.entity.PackageFlight;
import com.travelagency.package_service.entity.PackageFlightId;
import com.travelagency.package_service.entity.TravelPackage;
import com.travelagency.package_service.exception.ApiException;
import com.travelagency.package_service.exception.ErrorCode;
import com.travelagency.package_service.mapper.PackageMapper;
import com.travelagency.package_service.repository.PackageExcursionRepository;
import com.travelagency.package_service.repository.PackageFlightRepository;
import com.travelagency.package_service.repository.PackageRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("PackageCommandService")
class PackageCommandServiceTest {

    private static final long PACKAGE_ID = 1L;

    @Mock
    private PackageRepository packages;

    @Mock
    private PackageFlightRepository flightLinks;

    @Mock
    private PackageExcursionRepository excursionLinks;

    @Spy
    private PackageMapper mapper = new PackageMapper();

    @InjectMocks
    private PackageCommandService service;

    private static PackageData data(String name) {
        return new PackageData(name, "desc", "Fes", 2, new BigDecimal("200.00"),
                LocalDate.of(2027, 1, 1), LocalDate.of(2027, 1, 10), new BigDecimal("25.00"), null, true);
    }

    @Nested
    @DisplayName("create / update / delete")
    class Crud {

        @Test
        @DisplayName("create() maps the data, saves it and returns the generated id")
        void create_validData_savesAndReturnsId() {
            // Arrange
            when(packages.saveAndFlush(any(TravelPackage.class))).thenAnswer(call -> {
                TravelPackage saved = call.getArgument(0);
                saved.setId(42L);
                return saved;
            });
            ArgumentCaptor<TravelPackage> captor = ArgumentCaptor.forClass(TravelPackage.class);

            // Act
            long id = service.create(data("Sahara"));

            // Assert
            assertThat(id).isEqualTo(42L);
            verify(packages).saveAndFlush(captor.capture());
            assertThat(captor.getValue().getName()).isEqualTo("Sahara");
            assertThat(captor.getValue().getDiscountPercentage()).isEqualByComparingTo("25");
            assertThat(captor.getValue().getActive()).isTrue();
        }

        @Test
        @DisplayName("update() changes the loaded entity and flushes")
        void update_existingPackage_updatesAndFlushes() {
            // Arrange
            TravelPackage existing = new TravelPackage();
            existing.setId(PACKAGE_ID);
            existing.setName("Old");
            when(packages.findById(PACKAGE_ID)).thenReturn(Optional.of(existing));

            // Act
            service.update(PACKAGE_ID, data("New"));

            // Assert
            assertThat(existing.getName()).isEqualTo("New");
            assertThat(existing.getEndDate()).isEqualTo(LocalDate.of(2027, 1, 10));
            verify(mapper).apply(any(PackageData.class), any(TravelPackage.class));
            verify(packages).flush();
        }

        @Test
        @DisplayName("update() of an unknown package is ITEM_NOT_FOUND and writes nothing")
        void update_unknownPackage_itemNotFound() {
            // Arrange
            when(packages.findById(PACKAGE_ID)).thenReturn(Optional.empty());

            // Act + Assert
            assertThatThrownBy(() -> service.update(PACKAGE_ID, data("X")))
                    .isInstanceOfSatisfying(ApiException.class,
                            e -> assertThat(e.getCode()).isEqualTo(ErrorCode.ITEM_NOT_FOUND));
            verify(packages, never()).flush();
        }

        @Test
        @DisplayName("delete() removes the composition rows, then the package")
        void delete_existingPackage_deletesLinksThenPackage() {
            // Arrange
            when(packages.existsById(PACKAGE_ID)).thenReturn(true);

            // Act
            service.delete(PACKAGE_ID);

            // Assert
            InOrder order = inOrder(flightLinks, excursionLinks, packages);
            order.verify(flightLinks).deleteByPackageId(PACKAGE_ID);
            order.verify(excursionLinks).deleteByPackageId(PACKAGE_ID);
            order.verify(packages).deleteById(PACKAGE_ID);
        }

        @Test
        @DisplayName("delete() of an unknown package is ITEM_NOT_FOUND and deletes nothing")
        void delete_unknownPackage_itemNotFound() {
            // Arrange
            when(packages.existsById(PACKAGE_ID)).thenReturn(false);

            // Act + Assert
            assertThatThrownBy(() -> service.delete(PACKAGE_ID)).isInstanceOf(ApiException.class);
            verify(packages, never()).deleteById(any());
            verifyNoInteractions(flightLinks, excursionLinks);
        }
    }

    @Nested
    @DisplayName("flights")
    class Flights {

        @Test
        @DisplayName("linkFlight() keeps the given position")
        void linkFlight_withPosition_savesThatPosition() {
            // Arrange
            when(packages.existsById(PACKAGE_ID)).thenReturn(true);
            when(flightLinks.existsById(new PackageFlightId(PACKAGE_ID, 2L))).thenReturn(false);
            ArgumentCaptor<PackageFlight> captor = ArgumentCaptor.forClass(PackageFlight.class);

            // Act
            service.linkFlight(PACKAGE_ID, 2L, 5);

            // Assert
            verify(flightLinks).saveAndFlush(captor.capture());
            assertThat(captor.getValue().getPackageId()).isEqualTo(PACKAGE_ID);
            assertThat(captor.getValue().getFlightId()).isEqualTo(2L);
            assertThat(captor.getValue().getPosition()).isEqualTo(5);
            verify(flightLinks, never()).findMaxPosition(any());
        }

        @Test
        @DisplayName("linkFlight() without position appends after the last one")
        void linkFlight_withoutPosition_appendsAtTheEnd() {
            // Arrange
            when(packages.existsById(PACKAGE_ID)).thenReturn(true);
            when(flightLinks.existsById(new PackageFlightId(PACKAGE_ID, 3L))).thenReturn(false);
            when(flightLinks.findMaxPosition(PACKAGE_ID)).thenReturn(2);
            ArgumentCaptor<PackageFlight> captor = ArgumentCaptor.forClass(PackageFlight.class);

            // Act
            service.linkFlight(PACKAGE_ID, 3L, null);

            // Assert
            verify(flightLinks).saveAndFlush(captor.capture());
            assertThat(captor.getValue().getPosition()).isEqualTo(3);
        }

        @Test
        @DisplayName("linkFlight() of an already linked flight is DUPLICATE")
        void linkFlight_alreadyLinked_duplicate() {
            // Arrange
            when(packages.existsById(PACKAGE_ID)).thenReturn(true);
            when(flightLinks.existsById(new PackageFlightId(PACKAGE_ID, 2L))).thenReturn(true);

            // Act + Assert
            assertThatThrownBy(() -> service.linkFlight(PACKAGE_ID, 2L, 1))
                    .isInstanceOfSatisfying(ApiException.class, e -> {
                        assertThat(e.getCode()).isEqualTo(ErrorCode.DUPLICATE);
                        assertThat(e.getDetails()).containsEntry("flightId", 2L);
                    });
            verify(flightLinks, never()).saveAndFlush(any());
        }

        @Test
        @DisplayName("linkFlight() translates the FK violation into ITEM_NOT_FOUND")
        void linkFlight_foreignKeyViolation_itemNotFound() {
            // Arrange
            when(packages.existsById(PACKAGE_ID)).thenReturn(true);
            when(flightLinks.existsById(new PackageFlightId(PACKAGE_ID, 99L))).thenReturn(false);
            when(flightLinks.saveAndFlush(any(PackageFlight.class)))
                    .thenThrow(new DataIntegrityViolationException("fk_package_flights_flight"));

            // Act + Assert
            assertThatThrownBy(() -> service.linkFlight(PACKAGE_ID, 99L, 1))
                    .isInstanceOfSatisfying(ApiException.class, e -> {
                        assertThat(e.getCode()).isEqualTo(ErrorCode.ITEM_NOT_FOUND);
                        assertThat(e.getDetails()).containsEntry("flightId", 99L);
                    });
        }

        @Test
        @DisplayName("linkFlight() on an unknown package is ITEM_NOT_FOUND")
        void linkFlight_unknownPackage_itemNotFound() {
            // Arrange
            when(packages.existsById(PACKAGE_ID)).thenReturn(false);

            // Act + Assert
            assertThatThrownBy(() -> service.linkFlight(PACKAGE_ID, 2L, 1))
                    .isInstanceOfSatisfying(ApiException.class,
                            e -> assertThat(e.getDetails()).containsEntry("id", PACKAGE_ID));
            verifyNoInteractions(flightLinks);
        }

        @Test
        @DisplayName("unlinkFlight() deletes the link")
        void unlinkFlight_linked_deletesLink() {
            // Arrange
            PackageFlightId id = new PackageFlightId(PACKAGE_ID, 2L);
            when(packages.existsById(PACKAGE_ID)).thenReturn(true);
            when(flightLinks.existsById(id)).thenReturn(true);

            // Act
            service.unlinkFlight(PACKAGE_ID, 2L);

            // Assert
            verify(flightLinks).deleteById(id);
        }

        @Test
        @DisplayName("unlinkFlight() of a flight that is not linked is ITEM_NOT_FOUND")
        void unlinkFlight_notLinked_itemNotFound() {
            // Arrange
            when(packages.existsById(PACKAGE_ID)).thenReturn(true);
            when(flightLinks.existsById(new PackageFlightId(PACKAGE_ID, 2L))).thenReturn(false);

            // Act + Assert
            assertThatThrownBy(() -> service.unlinkFlight(PACKAGE_ID, 2L))
                    .isInstanceOfSatisfying(ApiException.class,
                            e -> assertThat(e.getCode()).isEqualTo(ErrorCode.ITEM_NOT_FOUND));
            verify(flightLinks, never()).deleteById(any());
        }
    }

    @Nested
    @DisplayName("excursions")
    class Excursions {

        @Test
        @DisplayName("linkExcursion() without position appends after the last one")
        void linkExcursion_withoutPosition_appendsAtTheEnd() {
            // Arrange
            when(packages.existsById(PACKAGE_ID)).thenReturn(true);
            when(excursionLinks.existsById(new PackageExcursionId(PACKAGE_ID, 1L))).thenReturn(false);
            when(excursionLinks.findMaxPosition(PACKAGE_ID)).thenReturn(0);
            ArgumentCaptor<PackageExcursion> captor = ArgumentCaptor.forClass(PackageExcursion.class);

            // Act
            service.linkExcursion(PACKAGE_ID, 1L, null);

            // Assert
            verify(excursionLinks).saveAndFlush(captor.capture());
            assertThat(captor.getValue().getExcursionId()).isEqualTo(1L);
            assertThat(captor.getValue().getPosition()).isEqualTo(1);
        }

        @Test
        @DisplayName("linkExcursion() of an already linked excursion is DUPLICATE")
        void linkExcursion_alreadyLinked_duplicate() {
            // Arrange
            when(packages.existsById(PACKAGE_ID)).thenReturn(true);
            when(excursionLinks.existsById(new PackageExcursionId(PACKAGE_ID, 1L))).thenReturn(true);

            // Act + Assert
            assertThatThrownBy(() -> service.linkExcursion(PACKAGE_ID, 1L, 1))
                    .isInstanceOfSatisfying(ApiException.class,
                            e -> assertThat(e.getCode()).isEqualTo(ErrorCode.DUPLICATE));
            verify(excursionLinks, never()).saveAndFlush(any());
        }

        @Test
        @DisplayName("linkExcursion() translates the FK violation into ITEM_NOT_FOUND")
        void linkExcursion_foreignKeyViolation_itemNotFound() {
            // Arrange
            when(packages.existsById(PACKAGE_ID)).thenReturn(true);
            when(excursionLinks.existsById(new PackageExcursionId(PACKAGE_ID, 77L))).thenReturn(false);
            when(excursionLinks.saveAndFlush(any(PackageExcursion.class)))
                    .thenThrow(new DataIntegrityViolationException("fk_package_excursions_excursion"));

            // Act + Assert
            assertThatThrownBy(() -> service.linkExcursion(PACKAGE_ID, 77L, 1))
                    .isInstanceOfSatisfying(ApiException.class,
                            e -> assertThat(e.getDetails()).containsEntry("excursionId", 77L));
        }

        @Test
        @DisplayName("unlinkExcursion() deletes the link, or is ITEM_NOT_FOUND when absent")
        void unlinkExcursion_linkedThenAbsent() {
            // Arrange
            PackageExcursionId id = new PackageExcursionId(PACKAGE_ID, 1L);
            when(packages.existsById(PACKAGE_ID)).thenReturn(true);
            when(excursionLinks.existsById(id)).thenReturn(true, false);

            // Act
            service.unlinkExcursion(PACKAGE_ID, 1L);

            // Assert
            verify(excursionLinks).deleteById(id);
            assertThatThrownBy(() -> service.unlinkExcursion(PACKAGE_ID, 1L))
                    .isInstanceOf(ApiException.class);
        }
    }
}
