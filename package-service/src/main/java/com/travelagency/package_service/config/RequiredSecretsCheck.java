package com.travelagency.package_service.config;

import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.Profiles;

import java.util.ArrayList;
import java.util.List;

/**
 * Refuses to start when a secret is empty (except under the "test" profile).
 * Runs as soon as the environment (application.properties + .env) is ready,
 * before any connection to MySQL is attempted.
 */
public class RequiredSecretsCheck implements ApplicationListener<ApplicationEnvironmentPreparedEvent> {

    private static final List<String[]> REQUIRED = List.of(
            new String[]{"app.jwt.secret", "JWT_SECRET"},
            new String[]{"spring.datasource.password", "DB_PASSWORD"});

    @Override
    public void onApplicationEvent(ApplicationEnvironmentPreparedEvent event) {
        ConfigurableEnvironment environment = event.getEnvironment();

        if (environment.acceptsProfiles(Profiles.of("test"))) {
            return;
        }

        List<String> missing = new ArrayList<>();

        for (String[] entry : REQUIRED) {
            String value = environment.getProperty(entry[0]);

            if (value == null || value.isBlank()) {
                missing.add(entry[1]);
            }
        }

        if (!missing.isEmpty()) {
            throw new IllegalStateException("Missing configuration " + missing
                    + ": set it in package-service/.env or in the environment.");
        }
    }
}
