package com.travelagency.package_service.client;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Reads one item of another catalogue service: {@code GET /api/{resource}/{id}}
 * answering {@code { "data": { ... } }}.
 */
public abstract class CatalogClient {

    private static final ParameterizedTypeReference<Map<String, Object>> JSON_OBJECT =
            new ParameterizedTypeReference<>() {
            };

    private final RestClient restClient;
    private final String resource;

    protected CatalogClient(RestClient restClient, String resource) {
        this.restClient = restClient;
        this.resource = resource;
    }

    /**
     * @return the item, or empty when the service answers 404
     * @throws CatalogUnavailableException when the service is unreachable or fails
     */
    public Optional<Map<String, Object>> findById(long id) {
        Map<String, Object> body;

        try {
            body = restClient.get()
                    .uri("/api/{resource}/{id}", resource, id)
                    .retrieve()
                    .body(JSON_OBJECT);
        }
        catch (HttpClientErrorException.NotFound exception) {
            return Optional.empty();
        }
        catch (RestClientException exception) {
            throw new CatalogUnavailableException(
                    "The " + resource + " service failed for id " + id + ": " + exception.getMessage(), exception);
        }

        Object data = body == null ? null : body.get("data");

        if (!(data instanceof Map<?, ?> item)) {
            throw new CatalogUnavailableException(
                    "The " + resource + " service returned an invalid body for id " + id + ".", null);
        }

        Map<String, Object> copy = new LinkedHashMap<>();
        item.forEach((key, value) -> copy.put(String.valueOf(key), value));

        return Optional.of(copy);
    }

    public String resource() {
        return resource;
    }
}
