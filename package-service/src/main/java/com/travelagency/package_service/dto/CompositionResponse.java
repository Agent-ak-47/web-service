package com.travelagency.package_service.dto;

import java.util.List;
import java.util.Map;

/**
 * Flights and excursions of a package, as returned by the Flight and Excursion
 * services, plus a "position" key. Items are kept as JSON maps so this
 * service does not break when the other services add fields.
 */
public record CompositionResponse(List<Map<String, Object>> flights, List<Map<String, Object>> excursions) {

    public static CompositionResponse empty() {
        return new CompositionResponse(List.of(), List.of());
    }
}
