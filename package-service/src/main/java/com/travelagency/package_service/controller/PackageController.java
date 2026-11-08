package com.travelagency.package_service.controller;

import com.travelagency.package_service.dto.ApiResponse;
import com.travelagency.package_service.dto.AvailabilityResponse;
import com.travelagency.package_service.dto.PackageResponse;
import com.travelagency.package_service.dto.PackageSearchCriteria;
import com.travelagency.package_service.dto.PageResponse;
import com.travelagency.package_service.security.AuthService;
import com.travelagency.package_service.service.PackageAvailabilityService;
import com.travelagency.package_service.service.PackageQueryService;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

/** Public catalogue endpoints (no token needed). */
@RestController
@RequestMapping("/api/packages")
public class PackageController {

    private final PackageQueryService queries;
    private final PackageAvailabilityService availability;
    private final AuthService authService;

    public PackageController(PackageQueryService queries, PackageAvailabilityService availability,
                             AuthService authService) {
        this.queries = queries;
        this.availability = availability;
        this.authService = authService;
    }

    /** Inactive packages are included only for a valid ADMIN token (admin table). */
    @GetMapping
    public ApiResponse<PageResponse<PackageResponse>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean withComposition,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        PackageSearchCriteria criteria = new PackageSearchCriteria(
                search, destination, startDate, minPrice, maxPrice, page, size, withComposition);

        return ApiResponse.of(queries.list(criteria, authService.isAdmin(authorization)));
    }

    @GetMapping("/{id}")
    public ApiResponse<PackageResponse> get(@PathVariable long id) {
        return ApiResponse.of(queries.getById(id));
    }

    @GetMapping("/{id}/availability")
    public ApiResponse<AvailabilityResponse> availability(@PathVariable long id) {
        return ApiResponse.of(availability.availability(id));
    }
}
