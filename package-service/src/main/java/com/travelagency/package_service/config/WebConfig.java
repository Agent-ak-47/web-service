package com.travelagency.package_service.config;

import com.travelagency.package_service.security.AuthInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

/** CORS for the Angular frontend and registration of the auth interceptor. */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private static final String DEFAULT_ORIGIN = "http://localhost:4200";

    private final AppProperties properties;
    private final AuthInterceptor authInterceptor;

    public WebConfig(AppProperties properties, AuthInterceptor authInterceptor) {
        this.properties = properties;
        this.authInterceptor = authInterceptor;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(origins().toArray(String[]::new))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("Content-Type", "Authorization")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor).addPathPatterns("/api/**");
    }

    private List<String> origins() {
        if (properties.cors() == null || properties.cors().origins() == null) {
            return List.of(DEFAULT_ORIGIN);
        }

        List<String> origins = properties.cors().origins().stream()
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();

        return origins.isEmpty() ? List.of(DEFAULT_ORIGIN) : origins;
    }
}
