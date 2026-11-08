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
 * Row of {@code package_flights}: the package "includes" a flight.
 * The flight itself belongs to the Flight service, only its id is stored here.
 */
@Entity
@Table(name = "package_flights")
@IdClass(PackageFlightId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PackageFlight {

    @Id
    @Column(name = "package_id", nullable = false)
    private Long packageId;

    @Id
    @Column(name = "flight_id", nullable = false)
    private Long flightId;

    @Column(name = "position", nullable = false)
    private Integer position;
}
