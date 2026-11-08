package com.travelagency.package_service.repository;

import com.travelagency.package_service.entity.PackageExcursion;
import com.travelagency.package_service.entity.PackageExcursionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface PackageExcursionRepository extends JpaRepository<PackageExcursion, PackageExcursionId> {

    List<PackageExcursion> findByPackageIdInOrderByPackageIdAscPositionAscExcursionIdAsc(Collection<Long> packageIds);

    @Query("select coalesce(max(e.position), 0) from PackageExcursion e where e.packageId = :packageId")
    int findMaxPosition(Long packageId);

    @Modifying
    @Query("delete from PackageExcursion e where e.packageId = :packageId")
    void deleteByPackageId(Long packageId);
}
