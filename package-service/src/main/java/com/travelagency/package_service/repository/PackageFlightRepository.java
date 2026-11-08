package com.travelagency.package_service.repository;

import com.travelagency.package_service.entity.PackageFlight;
import com.travelagency.package_service.entity.PackageFlightId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface PackageFlightRepository extends JpaRepository<PackageFlight, PackageFlightId> {

    List<PackageFlight> findByPackageIdInOrderByPackageIdAscPositionAscFlightIdAsc(Collection<Long> packageIds);

    @Query("select coalesce(max(f.position), 0) from PackageFlight f where f.packageId = :packageId")
    int findMaxPosition(Long packageId);

    @Modifying
    @Query("delete from PackageFlight f where f.packageId = :packageId")
    void deleteByPackageId(Long packageId);
}
