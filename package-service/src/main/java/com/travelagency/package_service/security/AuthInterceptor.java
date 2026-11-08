package com.travelagency.package_service.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Enforces {@link RequireAdmin}. Errors thrown here are rendered by the
 * GlobalExceptionHandler like any other error. CORS preflight requests are not
 * HandlerMethods, so they are never blocked.
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    public static final String USER_ATTRIBUTE = AuthenticatedUser.class.getName();

    private final AuthService authService;

    public AuthInterceptor(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod method) || !requiresAdmin(method)) {
            return true;
        }

        AuthenticatedUser user = authService.requireAdmin(request.getHeader(HttpHeaders.AUTHORIZATION));
        request.setAttribute(USER_ATTRIBUTE, user);

        return true;
    }

    private static boolean requiresAdmin(HandlerMethod method) {
        return method.hasMethodAnnotation(RequireAdmin.class)
                || method.getBeanType().isAnnotationPresent(RequireAdmin.class);
    }
}
