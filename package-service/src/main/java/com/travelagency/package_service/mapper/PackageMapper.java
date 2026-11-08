package com.travelagency.package_service.mapper;

import com.travelagency.package_service.dto.CompositionResponse;
import com.travelagency.package_service.dto.PackageData;
import com.travelagency.package_service.dto.PackageResponse;
import com.travelagency.package_service.entity.TravelPackage;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/** Entity <-> JSON conversions of a package. */
@Component
public class PackageMapper {

    public PackageResponse toResponse(TravelPackage entity, CompositionResponse composition) {
        boolean active = Boolean.TRUE.equals(entity.getActive());

        return new PackageResponse(
                entity.getId(),
                text(entity.getName()),
                text(entity.getDescription()),
                text(entity.getDestination()),
                entity.getDurationNights(),
                PriceCalculator.money(entity.getPrice()),
                date(entity.getStartDate()),
                date(entity.getEndDate()),
                PriceCalculator.money(entity.getDiscountPercentage()),
                PriceCalculator.promoPrice(entity.getPrice(), entity.getDiscountPercentage()),
                text(entity.getImageUrl()),
                active,
                active,
                composition == null ? CompositionResponse.empty() : composition);
    }

    /** Copies the validated form onto a new or existing entity. */
    public void apply(PackageData data, TravelPackage entity) {
        entity.setName(data.name());
        entity.setDescription(data.description());
        entity.setDestination(data.destination());
        entity.setDurationNights(data.durationNights());
        entity.setPrice(data.price());
        entity.setStartDate(data.startDate());
        entity.setEndDate(data.endDate());
        entity.setDiscountPercentage(data.discountPercentage());
        entity.setImageUrl(data.imageUrl());
        entity.setActive(data.active());
    }

    private static String text(String value) {
        return value == null ? "" : value;
    }

    private static String date(LocalDate value) {
        return value == null ? "" : value.toString();
    }
}
