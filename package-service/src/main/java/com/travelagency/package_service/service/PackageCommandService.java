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
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Write side, database only (no HTTP call inside a transaction).
 * Only touches the tables owned by this service.
 */
@Service
public class PackageCommandService {

    private final PackageRepository packages;
    private final PackageFlightRepository flightLinks;
    private final PackageExcursionRepository excursionLinks;
    private final PackageMapper mapper;

    public PackageCommandService(PackageRepository packages, PackageFlightRepository flightLinks,
                                 PackageExcursionRepository excursionLinks, PackageMapper mapper) {
        this.packages = packages;
        this.flightLinks = flightLinks;
        this.excursionLinks = excursionLinks;
        this.mapper = mapper;
    }

    @Transactional
    public long create(PackageData data) {
        TravelPackage entity = new TravelPackage();
        mapper.apply(data, entity);

        return packages.saveAndFlush(entity).getId();
    }

    @Transactional
    public void update(long id, PackageData data) {
        TravelPackage entity = packages.findById(id).orElseThrow(() -> ApiException.packageNotFound(id));
        mapper.apply(data, entity);
        packages.flush();
    }

    /**
     * MySQL removes the composition rows through ON DELETE CASCADE; they are
     * also deleted explicitly so the behaviour does not depend on the FK.
     */
    @Transactional
    public void delete(long id) {
        if (!packages.existsById(id)) {
            throw ApiException.packageNotFound(id);
        }

        flightLinks.deleteByPackageId(id);
        excursionLinks.deleteByPackageId(id);
        packages.deleteById(id);
    }

    @Transactional
    public void linkFlight(long packageId, long flightId, Integer position) {
        requirePackage(packageId);

        if (flightLinks.existsById(new PackageFlightId(packageId, flightId))) {
            throw duplicate("flightId", flightId, "This flight is already part of the package.");
        }

        int finalPosition = position != null ? position : flightLinks.findMaxPosition(packageId) + 1;

        try {
            flightLinks.saveAndFlush(new PackageFlight(packageId, flightId, finalPosition));
        }
        catch (DataIntegrityViolationException exception) {
            throw itemNotFound("Flight", "flightId", flightId);
        }
    }

    @Transactional
    public void unlinkFlight(long packageId, long flightId) {
        requirePackage(packageId);
        PackageFlightId id = new PackageFlightId(packageId, flightId);

        if (!flightLinks.existsById(id)) {
            throw new ApiException(ErrorCode.ITEM_NOT_FOUND, "This flight is not part of the package.",
                    Map.of("flightId", flightId));
        }

        flightLinks.deleteById(id);
    }

    @Transactional
    public void linkExcursion(long packageId, long excursionId, Integer position) {
        requirePackage(packageId);

        if (excursionLinks.existsById(new PackageExcursionId(packageId, excursionId))) {
            throw duplicate("excursionId", excursionId, "This excursion is already part of the package.");
        }

        int finalPosition = position != null ? position : excursionLinks.findMaxPosition(packageId) + 1;

        try {
            excursionLinks.saveAndFlush(new PackageExcursion(packageId, excursionId, finalPosition));
        }
        catch (DataIntegrityViolationException exception) {
            throw itemNotFound("Excursion", "excursionId", excursionId);
        }
    }

    @Transactional
    public void unlinkExcursion(long packageId, long excursionId) {
        requirePackage(packageId);
        PackageExcursionId id = new PackageExcursionId(packageId, excursionId);

        if (!excursionLinks.existsById(id)) {
            throw new ApiException(ErrorCode.ITEM_NOT_FOUND, "This excursion is not part of the package.",
                    Map.of("excursionId", excursionId));
        }

        excursionLinks.deleteById(id);
    }

    private void requirePackage(long packageId) {
        if (!packages.existsById(packageId)) {
            throw ApiException.packageNotFound(packageId);
        }
    }

    private static ApiException duplicate(String field, long id, String message) {
        return new ApiException(ErrorCode.DUPLICATE, message, Map.of(field, id));
    }

    static ApiException itemNotFound(String label, String field, long id) {
        return new ApiException(ErrorCode.ITEM_NOT_FOUND, label + " not found.", Map.of(field, id));
    }
}
