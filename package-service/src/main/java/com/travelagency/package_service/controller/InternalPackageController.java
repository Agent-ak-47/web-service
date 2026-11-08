package com.travelagency.package_service.controller;

import com.travelagency.package_service.dto.ApiResponse;
import com.travelagency.package_service.dto.ReleaseResponse;
import com.travelagency.package_service.dto.ReserveResponse;
import com.travelagency.package_service.dto.StockRequest;
import com.travelagency.package_service.service.PackageAvailabilityService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Service-to-service endpoints called by the Reservation and Payment services
 * (kamal/reservation/helpers/catalog.py, kamal/payment/helpers/catalog.py).
 */
@RestController
@RequestMapping("/api/internal/packages")
public class InternalPackageController {

    private final PackageAvailabilityService availability;

    public InternalPackageController(PackageAvailabilityService availability) {
        this.availability = availability;
    }

    @PostMapping("/{id}/reserve")
    public ApiResponse<ReserveResponse> reserve(@PathVariable long id, @Valid @RequestBody StockRequest request) {
        return ApiResponse.of(availability.reserve(id, request));
    }

    @PostMapping("/{id}/release")
    public ApiResponse<ReleaseResponse> release(@PathVariable long id, @Valid @RequestBody StockRequest request) {
        return ApiResponse.of(availability.release(id, request));
    }
}
