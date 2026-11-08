package com.travelagency.package_service.service;

import com.travelagency.package_service.client.CatalogClient;
import com.travelagency.package_service.client.CatalogUnavailableException;
import com.travelagency.package_service.client.ExcursionClient;
import com.travelagency.package_service.client.FlightClient;
import com.travelagency.package_service.dto.CompositionResponse;
import com.travelagency.package_service.entity.PackageExcursion;
import com.travelagency.package_service.entity.PackageFlight;
import com.travelagency.package_service.repository.PackageExcursionRepository;
import com.travelagency.package_service.repository.PackageFlightRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

/**
 * Builds the composition (flights + excursions) of one or several packages.
 * The links come from package_flights / package_excursions; the details come
 * from the Flight and Excursion services. Each distinct item is fetched once
 * per call, and an item that cannot be fetched is skipped with a warning, so
 * the package endpoints keep working when another service is down.
 */
@Component
public class CompositionResolver {

    private static final Logger log = LoggerFactory.getLogger(CompositionResolver.class);

    private final PackageFlightRepository flightLinks;
    private final PackageExcursionRepository excursionLinks;
    private final FlightClient flightClient;
    private final ExcursionClient excursionClient;

    public CompositionResolver(PackageFlightRepository flightLinks, PackageExcursionRepository excursionLinks,
                               FlightClient flightClient, ExcursionClient excursionClient) {
        this.flightLinks = flightLinks;
        this.excursionLinks = excursionLinks;
        this.flightClient = flightClient;
        this.excursionClient = excursionClient;
    }

    public CompositionResponse resolve(long packageId) {
        return resolveAll(List.of(packageId)).getOrDefault(packageId, CompositionResponse.empty());
    }

    /** @return composition per package id (every requested id is present). */
    public Map<Long, CompositionResponse> resolveAll(Collection<Long> packageIds) {
        Map<Long, CompositionResponse> result = new LinkedHashMap<>();

        if (packageIds.isEmpty()) {
            return result;
        }

        List<PackageFlight> flights = flightLinks.findByPackageIdInOrderByPackageIdAscPositionAscFlightIdAsc(packageIds);
        List<PackageExcursion> excursions =
                excursionLinks.findByPackageIdInOrderByPackageIdAscPositionAscExcursionIdAsc(packageIds);

        Map<Long, Map<String, Object>> flightItems =
                fetchAll(flightClient, distinct(flights, PackageFlight::getFlightId));
        Map<Long, Map<String, Object>> excursionItems =
                fetchAll(excursionClient, distinct(excursions, PackageExcursion::getExcursionId));

        Map<Long, List<Map<String, Object>>> flightsByPackage = new HashMap<>();
        Map<Long, List<Map<String, Object>>> excursionsByPackage = new HashMap<>();

        for (PackageFlight link : flights) {
            add(flightsByPackage, link.getPackageId(), flightItems.get(link.getFlightId()), link.getPosition());
        }

        for (PackageExcursion link : excursions) {
            add(excursionsByPackage, link.getPackageId(), excursionItems.get(link.getExcursionId()), link.getPosition());
        }

        for (Long id : packageIds) {
            result.put(id, new CompositionResponse(
                    List.copyOf(flightsByPackage.getOrDefault(id, List.of())),
                    List.copyOf(excursionsByPackage.getOrDefault(id, List.of()))));
        }

        return result;
    }

    private static <T> Set<Long> distinct(List<T> links, Function<T, Long> idOf) {
        Set<Long> ids = new LinkedHashSet<>();
        links.forEach(link -> ids.add(idOf.apply(link)));

        return ids;
    }

    /** Fetches every id; stops calling a service as soon as it is unreachable. */
    private static Map<Long, Map<String, Object>> fetchAll(CatalogClient client, Set<Long> ids) {
        Map<Long, Map<String, Object>> items = new HashMap<>();

        for (Long id : ids) {
            try {
                client.findById(id).ifPresentOrElse(
                        item -> items.put(id, item),
                        () -> log.warn("{} {} not found in the {} service: skipped from the composition.",
                                client.resource(), id, client.resource()));
            }
            catch (CatalogUnavailableException exception) {
                log.warn("{} service unavailable, {} item(s) skipped from the composition: {}",
                        client.resource(), ids.size() - items.size(), exception.getMessage());
                break;
            }
        }

        return items;
    }

    private static void add(Map<Long, List<Map<String, Object>>> target, Long packageId,
                            Map<String, Object> item, Integer position) {
        if (item == null) {
            return;
        }

        Map<String, Object> copy = new LinkedHashMap<>(item);
        copy.put("position", position);
        target.computeIfAbsent(packageId, key -> new ArrayList<>()).add(copy);
    }
}
