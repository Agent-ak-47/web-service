package com.travelagency.package_service.dto;

/**
 * Raw body of create/update (frontend KzPackageForm). The admin form sends
 * numbers as strings ("3", "2400", ""), so every field is accepted as any
 * JSON scalar and parsed by PackageFormParser.
 */
public record PackageFormRequest(
        Object name,
        Object description,
        Object destination,
        Object durationNights,
        Object price,
        Object startDate,
        Object endDate,
        Object discountPercentage,
        Object imageUrl,
        Object active) {
}
