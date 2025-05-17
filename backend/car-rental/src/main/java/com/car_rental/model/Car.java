package com.car_rental.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "cars")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Car {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String brand;
    private String vehicleType;
    private String fuelType;
    private int capacity;
    private double pricePerDay;

    private String status;  // e.g. "free" or "rented"

    public boolean isRented() {
        return "rented".equalsIgnoreCase(this.status);
    }

    public void setRented(boolean rented) {
        this.status = rented ? "rented" : "free";
    }
}
