package com.travelagency.package_service.client;

/** The Flight or Excursion service is down, too slow or answered garbage. */
public class CatalogUnavailableException extends RuntimeException {

    public CatalogUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
