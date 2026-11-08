package com.travelagency.package_service.repository;

import com.travelagency.package_service.entity.UserSession;
import org.springframework.data.repository.Repository;

import java.time.LocalDateTime;

/** Read-only access to {@code sessions} (owned by the user service). */
public interface UserSessionRepository extends Repository<UserSession, Long> {

    boolean existsByTokenHashAndExpiresAtAfter(String tokenHash, LocalDateTime now);
}
