package com.travelagency.package_service.client;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/** HTTP client of the Excursion service (port 8084). */
@Component
public class ExcursionClient extends CatalogClient {

    public ExcursionClient(@Qualifier("excursionRestClient") RestClient excursionRestClient) {
        super(excursionRestClient, "excursions");
    }
}
