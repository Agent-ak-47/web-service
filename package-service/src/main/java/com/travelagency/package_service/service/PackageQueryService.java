package com.travelagency.package_service.service;

import com.travelagency.package_service.dto.CompositionResponse;
import com.travelagency.package_service.dto.PackageResponse;
import com.travelagency.package_service.dto.PackageSearchCriteria;
import com.travelagency.package_service.dto.PageResponse;
import com.travelagency.package_service.entity.TravelPackage;
import com.travelagency.package_service.exception.ApiException;
import com.travelagency.package_service.exception.ErrorCode;
import com.travelagency.package_service.mapper.PackageMapper;
import com.travelagency.package_service.repository.PackageRepository;
import com.travelagency.package_service.repository.PackageSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Year;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Read side: list with filters and pagination, and detail of a package. */
@Service
public class PackageQueryService {

    static final int MAX_PAGE_SIZE = 100;

    private final PackageRepository packages;
    private final CompositionResolver compositionResolver;
    private final PackageMapper mapper;

    public PackageQueryService(PackageRepository packages, CompositionResolver compositionResolver,
                               PackageMapper mapper) {
        this.packages = packages;
        this.compositionResolver = compositionResolver;
        this.mapper = mapper;
    }

    /**
     * @param includeInactive true only for a valid ADMIN token
     */
    public PageResponse<PackageResponse> list(PackageSearchCriteria criteria, boolean includeInactive) {
        if (criteria.page() < 1) {
            throw invalidParam("page", "Must be 1 or more.");
        }

        if (criteria.size() < 1) {
            throw invalidParam("size", "Must be 1 or more.");
        }

        int size = Math.min(criteria.size(), MAX_PAGE_SIZE);
        PageRequest pageable = PageRequest.of(criteria.page() - 1, size, Sort.by(Sort.Direction.ASC, "id"));
        Page<TravelPackage> page = packages.findAll(specification(criteria, includeInactive), pageable);

        List<Long> ids = page.getContent().stream().map(TravelPackage::getId).toList();
        Map<Long, CompositionResponse> compositions = criteria.withComposition()
                ? compositionResolver.resolveAll(ids)
                : Map.of();

        List<PackageResponse> items = page.getContent().stream()
                .map(entity -> mapper.toResponse(entity, compositions.get(entity.getId())))
                .toList();

        return new PageResponse<>(items, criteria.page(), size, page.getTotalElements(), page.getTotalPages());
    }

    /** Detail with the full composition (inactive packages are returned too). */
    public PackageResponse getById(long id) {
        TravelPackage entity = findEntity(id);

        return mapper.toResponse(entity, compositionResolver.resolve(id));
    }

    public TravelPackage findEntity(long id) {
        return packages.findById(id).orElseThrow(() -> ApiException.packageNotFound(id));
    }

    // ---------------------------------------------------------------- filters

    private static Specification<TravelPackage> specification(PackageSearchCriteria criteria, boolean includeInactive) {
        List<Specification<TravelPackage>> filters = new ArrayList<>();

        if (!includeInactive) {
            filters.add(PackageSpecifications.activeOnly());
        }

        if (hasText(criteria.search())) {
            filters.add(PackageSpecifications.nameOrDestinationContains(criteria.search()));
        }

        if (hasText(criteria.destination())) {
            filters.add(PackageSpecifications.destinationContains(criteria.destination()));
        }

        if (hasText(criteria.startDate())) {
            LocalDate[] range = startDateRange(criteria.startDate().trim());
            filters.add(PackageSpecifications.startDateBetween(range[0], range[1]));
        }

        if (criteria.minPrice() != null) {
            filters.add(PackageSpecifications.promoPriceAtLeast(criteria.minPrice()));
        }

        if (criteria.maxPrice() != null) {
            filters.add(PackageSpecifications.promoPriceAtMost(criteria.maxPrice()));
        }

        return Specification.allOf(filters);
    }

    /**
     * Prefix match on the ISO start date, done as a date range so that the
     * database can use plain comparisons: "2026" -> the whole year,
     * "2026-06" -> the month, "2026-06-01" -> that day.
     */
    static LocalDate[] startDateRange(String prefix) {
        try {
            if (prefix.matches("\\d{4}")) {
                LocalDate from = Year.parse(prefix).atDay(1);

                return new LocalDate[]{from, from.plusYears(1)};
            }

            if (prefix.matches("\\d{4}-\\d{2}")) {
                LocalDate from = YearMonth.parse(prefix).atDay(1);

                return new LocalDate[]{from, from.plusMonths(1)};
            }

            if (prefix.matches("\\d{4}-\\d{2}-\\d{2}")) {
                LocalDate from = LocalDate.parse(prefix);

                return new LocalDate[]{from, from.plusDays(1)};
            }
        }
        catch (DateTimeParseException exception) {
            // handled below
        }

        throw invalidParam("startDate", "Use YYYY, YYYY-MM or YYYY-MM-DD.");
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static ApiException invalidParam(String name, String message) {
        return new ApiException(ErrorCode.INVALID_FORMAT, "Invalid query parameter: " + name + ".",
                Map.of(name, message));
    }
}
