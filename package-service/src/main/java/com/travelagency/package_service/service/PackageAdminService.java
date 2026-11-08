package com.travelagency.package_service.service;

import com.travelagency.package_service.client.CatalogClient;
import com.travelagency.package_service.client.CatalogUnavailableException;
import com.travelagency.package_service.client.ExcursionClient;
import com.travelagency.package_service.client.FlightClient;
import com.travelagency.package_service.dto.DeleteResponse;
import com.travelagency.package_service.dto.ExcursionLinkRequest;
import com.travelagency.package_service.dto.FlightLinkRequest;
import com.travelagency.package_service.dto.PackageData;
import com.travelagency.package_service.dto.PackageFormRequest;
import com.travelagency.package_service.dto.PackageResponse;
import com.travelagency.package_service.exception.ApiException;
import com.travelagency.package_service.exception.ErrorCode;
import com.travelagency.package_service.mapper.PackageFormParser;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Admin use cases. Orchestrates: parse/validate, remote existence checks,
 * the transactional write ({@link PackageCommandService}), then the fresh
 * package ({@link PackageQueryService}).
 */
@Service
public class PackageAdminService {

    private final PackageFormParser formParser;
    private final PackageCommandService commands;
    private final PackageQueryService queries;
    private final FlightClient flightClient;
    private final ExcursionClient excursionClient;

    public PackageAdminService(PackageFormParser formParser, PackageCommandService commands,
                               PackageQueryService queries, FlightClient flightClient,
                               ExcursionClient excursionClient) {
        this.formParser = formParser;
        this.commands = commands;
        this.queries = queries;
        this.flightClient = flightClient;
        this.excursionClient = excursionClient;
    }

    public PackageResponse create(PackageFormRequest form) {
        PackageData data = formParser.parse(form);
        long id = commands.create(data);

        return queries.getById(id);
    }

    public PackageResponse update(long id, PackageFormRequest form) {
        queries.findEntity(id);
        PackageData data = formParser.parse(form);
        commands.update(id, data);

        return queries.getById(id);
    }

    public DeleteResponse delete(long id) {
        commands.delete(id);

        return new DeleteResponse(true, id);
    }

    public PackageResponse addFlight(long packageId, FlightLinkRequest request) {
        queries.findEntity(packageId);
        requireCatalogItem(flightClient, "Flight", "flightId", request.flightId());
        commands.linkFlight(packageId, request.flightId(), request.position());

        return queries.getById(packageId);
    }

    public PackageResponse removeFlight(long packageId, long flightId) {
        commands.unlinkFlight(packageId, flightId);

        return queries.getById(packageId);
    }

    public PackageResponse addExcursion(long packageId, ExcursionLinkRequest request) {
        queries.findEntity(packageId);
        requireCatalogItem(excursionClient, "Excursion", "excursionId", request.excursionId());
        commands.linkExcursion(packageId, request.excursionId(), request.position());

        return queries.getById(packageId);
    }

    public PackageResponse removeExcursion(long packageId, long excursionId) {
        commands.unlinkExcursion(packageId, excursionId);

        return queries.getById(packageId);
    }

    private static void requireCatalogItem(CatalogClient client, String label, String field, long id) {
        try {
            if (client.findById(id).isEmpty()) {
                throw PackageCommandService.itemNotFound(label, field, id);
            }
        }
        catch (CatalogUnavailableException exception) {
            throw new ApiException(ErrorCode.SERVICE_UNAVAILABLE,
                    "The " + client.resource() + " service is unavailable, try again later.",
                    Map.of("service", client.resource()));
        }
    }
}
