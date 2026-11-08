package com.travelagency.package_service.security;

/** Identity carried by a valid token. */
public record AuthenticatedUser(long userId, String role, String email) {

    public static final String ADMIN = "ADMIN";

    public boolean isAdmin() {
        return ADMIN.equals(role);
    }
}
