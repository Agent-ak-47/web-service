package com.travelagency.package_service.service;

import com.travelagency.package_service.dto.AvailabilityResponse;
import com.travelagency.package_service.dto.CompositionResponse;
import com.travelagency.package_service.dto.ReleaseResponse;
import com.travelagency.package_service.dto.ReserveResponse;
import com.travelagency.package_service.dto.StockRequest;
import com.travelagency.package_service.entity.TravelPackage;
import com.travelagency.package_service.exception.ApiException;
import com.travelagency.package_service.exception.ErrorCode;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

/**
 * Availability of a package and the internal reserve/release endpoints.
 * A package has no stock of its own: its seats are the minimum of the seats
 * left in its flights and excursions, so nothing is written here.
 */
@Service
public class PackageAvailabilityService {

    private final PackageQueryService queries;
    private final CompositionResolver compositionResolver;

    public PackageAvailabilityService(PackageQueryService queries, CompositionResolver compositionResolver) {
        this.queries = queries;
        this.compositionResolver = compositionResolver;
    }

    public AvailabilityResponse availability(long id) {
        TravelPackage entity = queries.findEntity(id);
        Integer seats = availableSeats(compositionResolver.resolve(id));

        return new AvailabilityResponse(id, isAvailable(entity, seats), seats);
    }

    public ReserveResponse reserve(long id, StockRequest request) {
        AvailabilityResponse availability = availability(id);
        int quantity = request.quantity();
        Integer seats = availability.availableSeats();

        if (!availability.available() || (seats != null && seats < quantity)) {
            Map<String, Object> details = new LinkedHashMap<>();
            details.put("itemId", id);
            details.put("requested", quantity);
            details.put("available", availability.available() && seats != null ? seats : 0);

            throw new ApiException(ErrorCode.INSUFFICIENT_AVAILABILITY,
                    availability.available() ? "Not enough availability." : "This package is not available.",
                    details);
        }

        return new ReserveResponse(id, quantity, request.reservationId(), true);
    }

    public ReleaseResponse release(long id, StockRequest request) {
        queries.findEntity(id);

        return new ReleaseResponse(id, request.quantity(), request.reservationId(), true);
    }

    /** active AND not expired AND (seats unknown OR seats > 0). */
    static boolean isAvailable(TravelPackage entity, Integer seats) {
        boolean active = Boolean.TRUE.equals(entity.getActive());
        LocalDate endDate = entity.getEndDate();
        boolean notExpired = endDate == null || !endDate.isBefore(LocalDate.now());

        return active && notExpired && (seats == null || seats > 0);
    }

    /** Minimum availableSeats of the composed items, null when unknown. */
    static Integer availableSeats(CompositionResponse composition) {
        return Stream.concat(composition.flights().stream(), composition.excursions().stream())
                .map(PackageAvailabilityService::seatsOf)
                .filter(seats -> seats != null)
                .min(Integer::compare)
                .orElse(null);
    }

    private static Integer seatsOf(Map<String, Object> item) {
        for (String key : List.of("availableSeats", "availablePlaces")) {
            Object value = item.get(key);

            if (value instanceof Number number) {
                return Math.max(0, number.intValue());
            }

            if (value instanceof String text) {
                try {
                    return Math.max(0, Integer.parseInt(text.trim()));
                }
                catch (NumberFormatException exception) {
                    // try the next key
                }
            }
        }

        return null;
    }
}
