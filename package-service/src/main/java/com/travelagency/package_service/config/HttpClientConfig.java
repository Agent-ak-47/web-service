package com.travelagency.package_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

/** RestClients of the Flight and Excursion services, with connect/read timeouts. */
@Configuration
public class HttpClientConfig {

    @Bean
    public RestClient flightRestClient(AppProperties properties) {
        return build(properties.services().flightUrl(), properties.services().timeout());
    }

    @Bean
    public RestClient excursionRestClient(AppProperties properties) {
        return build(properties.services().excursionUrl(), properties.services().timeout());
    }

    private static RestClient build(String baseUrl, Duration timeout) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeout);
        factory.setReadTimeout(timeout);

        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .defaultHeader("Accept", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }
}
