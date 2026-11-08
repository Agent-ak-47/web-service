package com.travelagency.package_service.controller;

import com.travelagency.package_service.dto.ApiResponse;
import com.travelagency.package_service.dto.DeleteResponse;
import com.travelagency.package_service.dto.ExcursionLinkRequest;
import com.travelagency.package_service.dto.FlightLinkRequest;
import com.travelagency.package_service.dto.PackageFormRequest;
import com.travelagency.package_service.dto.PackageResponse;
import com.travelagency.package_service.security.RequireAdmin;
import com.travelagency.package_service.service.PackageAdminService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Admin endpoints: header "Authorization: Bearer <jwt>" with role ADMIN. */
@RestController
@RequestMapping("/api/packages")
@RequireAdmin
public class PackageAdminController {

    private final PackageAdminService admin;

    public PackageAdminController(PackageAdminService admin) {
        this.admin = admin;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PackageResponse> create(@RequestBody PackageFormRequest form) {
        return ApiResponse.of(admin.create(form));
    }

    /** The frontend updates with POST; PUT is accepted too. */
    @RequestMapping(value = "/{id}", method = {RequestMethod.POST, RequestMethod.PUT})
    public ApiResponse<PackageResponse> update(@PathVariable long id, @RequestBody PackageFormRequest form) {
        return ApiResponse.of(admin.update(id, form));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<DeleteResponse> delete(@PathVariable long id) {
        return ApiResponse.of(admin.delete(id));
    }

    @PostMapping("/{id}/flights")
    public ApiResponse<PackageResponse> addFlight(@PathVariable long id,
                                                  @Valid @RequestBody FlightLinkRequest request) {
        return ApiResponse.of(admin.addFlight(id, request));
    }

    @DeleteMapping("/{id}/flights/{flightId}")
    public ApiResponse<PackageResponse> removeFlight(@PathVariable long id, @PathVariable long flightId) {
        return ApiResponse.of(admin.removeFlight(id, flightId));
    }

    @PostMapping("/{id}/excursions")
    public ApiResponse<PackageResponse> addExcursion(@PathVariable long id,
                                                     @Valid @RequestBody ExcursionLinkRequest request) {
        return ApiResponse.of(admin.addExcursion(id, request));
    }

    @DeleteMapping("/{id}/excursions/{excursionId}")
    public ApiResponse<PackageResponse> removeExcursion(@PathVariable long id, @PathVariable long excursionId) {
        return ApiResponse.of(admin.removeExcursion(id, excursionId));
    }
}
