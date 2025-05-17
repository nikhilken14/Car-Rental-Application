package com.car_rental.repository;

import com.car_rental.model.Car;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CarRepository extends JpaRepository<Car, Integer> {
    List<Car> findByFuelTypeAndStatus(String fuelType, String status);

    // this will return top 3 suggested car
    @Query("SELECT c FROM Car c WHERE c.status = 'Free' AND c.fuelType = :fuelType AND c.capacity >= :travelers ORDER BY c.pricePerDay ASC LIMIT 3")
    List<Car> findTop3ByFuelAndTravelers(@Param("fuelType") String fuelType, @Param("travelers") int travelers);

    List<Car> findByFuelTypeIgnoreCaseAndStatusIgnoreCase(String fuelType, String free);

    // this will return all available cars which are available
    @Query("SELECT c FROM Car c WHERE c.status = 'Free' ")
    List<Car> findAllAvailable();
}

