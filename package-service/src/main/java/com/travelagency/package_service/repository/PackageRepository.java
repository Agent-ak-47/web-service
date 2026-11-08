package com.travelagency.package_service.repository;

import com.travelagency.package_service.entity.TravelPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PackageRepository
        extends JpaRepository<TravelPackage, Long>, JpaSpecificationExecutor<TravelPackage> {
}
