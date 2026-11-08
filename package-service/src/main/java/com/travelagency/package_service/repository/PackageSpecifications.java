package com.travelagency.package_service.repository;

import com.travelagency.package_service.entity.TravelPackage;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Root;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Locale;

/**
 * Database filters of {@code GET /api/packages}. Every method returns a
 * specification that is combined with {@link Specification#allOf}.
 */
public final class PackageSpecifications {

    private static final char ESCAPE = '\\';
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    /** promoPrice is rounded HALF_UP to 2 decimals: round(x/100) <= m  <=>  x < 100m + 0.5 */
    private static final BigDecimal HALF_CENT = new BigDecimal("0.5");

    private PackageSpecifications() {
    }

    public static Specification<TravelPackage> activeOnly() {
        return (root, query, cb) -> cb.isTrue(root.get("active"));
    }

    /** name OR destination contains the text, case-insensitive. */
    public static Specification<TravelPackage> nameOrDestinationContains(String text) {
        String pattern = containsPattern(text);

        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("name")), pattern, ESCAPE),
                cb.like(cb.lower(root.get("destination")), pattern, ESCAPE));
    }

    public static Specification<TravelPackage> destinationContains(String text) {
        String pattern = containsPattern(text);

        return (root, query, cb) -> cb.like(cb.lower(root.get("destination")), pattern, ESCAPE);
    }

    /** startDate in [from, toExclusive). */
    public static Specification<TravelPackage> startDateBetween(LocalDate from, LocalDate toExclusive) {
        return (root, query, cb) -> cb.and(
                cb.greaterThanOrEqualTo(root.get("startDate"), from),
                cb.lessThan(root.get("startDate"), toExclusive));
    }

    /** promoPrice >= min, computed in SQL. */
    public static Specification<TravelPackage> promoPriceAtLeast(BigDecimal min) {
        BigDecimal bound = min.multiply(HUNDRED).subtract(HALF_CENT);

        return (root, query, cb) -> cb.greaterThanOrEqualTo(priceTimesRemainingPercent(root, cb), bound);
    }

    /** promoPrice <= max, computed in SQL. */
    public static Specification<TravelPackage> promoPriceAtMost(BigDecimal max) {
        BigDecimal bound = max.multiply(HUNDRED).add(HALF_CENT);

        return (root, query, cb) -> cb.lessThan(priceTimesRemainingPercent(root, cb), bound);
    }

    /** price * (100 - discountPercentage) = promoPrice * 100 before rounding. */
    private static Expression<BigDecimal> priceTimesRemainingPercent(Root<TravelPackage> root, CriteriaBuilder cb) {
        Expression<BigDecimal> remaining = cb.diff(HUNDRED, root.<BigDecimal>get("discountPercentage"));

        return cb.prod(root.<BigDecimal>get("price"), remaining);
    }

    private static String containsPattern(String text) {
        String escaped = text.trim().toLowerCase(Locale.ROOT)
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");

        return "%" + escaped + "%";
    }
}
