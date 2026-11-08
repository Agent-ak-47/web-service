package com.travelagency.package_service.client;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/** HTTP client of the Flight service (port 8081). */
@Component
public class FlightClient extends CatalogClient {

    public FlightClient(@Qualifier("flightRestClient") RestClient flightRestClient) {
        super(flightRestClient, "flights");
    }
}
