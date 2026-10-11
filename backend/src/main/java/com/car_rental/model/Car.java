package com.car_rental.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.Instant;
import java.math.BigDecimal;

@Entity
@Table(name = "cars")
public class Car {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String brand;
    private String vehicleType;
    private String fuelType;
    private int capacity;
    private double pricePerDay;

    private String status;  // e.g. "available" or "rented"

    private Long ownerId;
    @JsonIgnore
    private Long rentedById;
    private Integer rentalDays;
    private Instant rentedAt;
    private BigDecimal rentalTotal;

    public boolean isRented() {
        return "rented".equalsIgnoreCase(this.status);
    }

    public void setRented(boolean rented) {
        this.status = rented ? "rented" : "available";
    }

    public int getId() {
        return id;
    }

    public void setId(int value) {
        this.id = value;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String value) {
        this.brand = value;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String value) {
        this.vehicleType = value;
    }

    public String getFuelType() {
        return fuelType;
    }

    public void setFuelType(String value) {
        this.fuelType = value;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int value) {
        this.capacity = value;
    }

    public double getPricePerDay() {
        return pricePerDay;
    }

    public void setPricePerDay(double value) {
        this.pricePerDay = value;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String value) {
        this.status = value;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long value) {
        this.ownerId = value;
    }

    public Long getRentedById() {
        return rentedById;
    }

    public void setRentedById(Long value) {
        this.rentedById = value;
    }

    public Integer getRentalDays() {
        return rentalDays;
    }

    public void setRentalDays(Integer value) {
        this.rentalDays = value;
    }

    public Instant getRentedAt() {
        return rentedAt;
    }

    public void setRentedAt(Instant value) {
        this.rentedAt = value;
    }

    public BigDecimal getRentalTotal() {
        return rentalTotal;
    }

    public void setRentalTotal(BigDecimal value) {
        this.rentalTotal = value;
    }

}
