package com.travelagency.package_service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.convert.DurationUnit;

import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.List;

/** {@code app.*} settings, all fed by environment variables (see .env.example). */
@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Cors cors, Services services) {

    public record Jwt(String secret) {
    }

    public record Cors(List<String> origins) {
    }

    public record Services(String flightUrl, String excursionUrl, @DurationUnit(ChronoUnit.SECONDS) Duration timeout) {
    }
}
