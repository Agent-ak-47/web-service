package com.travelagency.package_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Row of {@code package_excursions}: the package "includes" an excursion.
 * The excursion itself belongs to the Excursion service, only its id is stored here.
 */
@Entity
@Table(name = "package_excursions")
@IdClass(PackageExcursionId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PackageExcursion {

    @Id
    @Column(name = "package_id", nullable = false)
    private Long packageId;

    @Id
    @Column(name = "excursion_id", nullable = false)
    private Long excursionId;

    @Column(name = "position", nullable = false)
    private Integer position;
}
