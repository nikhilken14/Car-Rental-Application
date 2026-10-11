package com.car_rental.service;

import com.car_rental.model.*;
import com.car_rental.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.*;
import java.time.Instant;
import java.math.*;

@Service
public class CarService {
    private final CarRepository repo;
    private final AccountRepository accounts;

    public CarService(CarRepository repo, AccountRepository accounts) {
        this.repo = repo;
        this.accounts = accounts;
    }

    private void role(Account a, String role) {
        if (!role.equals(a.getRole()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This action is not allowed for your account.");
    }

    private void owner(Car car, Account account) {
        role(account, "RENTER");
        if (!Objects.equals(car.getOwnerId(), account.getId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only manage your own vehicles.");
    }

    public void validateDays(int days) {
        if (days < 1 || days > 365)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Days must be between 1 and 365.");
    }

    public Car addCar(Car car, Account account) {
        role(account, "RENTER");
        if (car.getBrand() == null || car.getBrand().isBlank() || car.getBrand().trim().length() > 120 || car.getVehicleType() == null || car.getVehicleType().isBlank() || car.getVehicleType().length() > 100 || car.getFuelType() == null || car.getFuelType().isBlank() || car.getFuelType().length() > 100 || car.getCapacity() < 1 || car.getCapacity() > 50 || !Double.isFinite(car.getPricePerDay()) || car.getPricePerDay() <= 0 || car.getPricePerDay() > 1000000)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide valid vehicle details, 1–50 seats and a positive daily rate up to 1000000.");
        car.setId(0);
        car.setBrand(car.getBrand().trim());
        car.setVehicleType(car.getVehicleType().trim());
        car.setFuelType(car.getFuelType().trim());
        car.setStatus("available");
        car.setOwnerId(account.getId());
        car.setRentedById(null);
        car.setRentalDays(null);
        car.setRentedAt(null);
        car.setRentalTotal(null);
        return repo.save(car);
    }

    public BigDecimal rentalCost(Car car, int days) {
        validateDays(days);
        return BigDecimal.valueOf(car.getPricePerDay()).multiply(BigDecimal.valueOf(days)).setScale(2, RoundingMode.HALF_UP);
    }

    public List<Car> getCars() {
        return repo.findAll().stream().filter(c -> c.getOwnerId() != null && !c.isRented()).toList();
    }

    public List<Car> ownFleet(Account account) {
        role(account, "RENTER");
        return repo.findAll().stream().filter(c -> Objects.equals(c.getOwnerId(), account.getId())).toList();
    }

    public Car getCarById(int id) {
        return repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found."));
    }

    public List<Car> getAvailableCars(String fuel) {
        return getCars().stream().filter(c -> c.getFuelType() != null && c.getFuelType().equalsIgnoreCase(fuel.trim())).toList();
    }

    public List<Car> suggestCars(String fuel, int travelers) {
        if (travelers < 1 || travelers > 50)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Travelers must be between 1 and 50.");
        return getAvailableCars(fuel).stream().filter(c -> c.getCapacity() >= travelers).sorted(Comparator.comparingDouble(Car::getPricePerDay)).limit(3).toList();
    }

    @Transactional
    public String rentCar(int id, int days, Account account) {
        role(account, "CUSTOMER");
        validateDays(days);
        Car car = repo.findForRental(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found."));
        if (car.isRented() || car.getOwnerId() == null)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This car is unavailable.");
        car.setStatus("rented");
        car.setRentedById(account.getId());
        car.setRentalDays(days);
        car.setRentedAt(Instant.now());
        car.setRentalTotal(rentalCost(car, days));
        repo.save(car);
        return "Car rented successfully. Total bill: ₹" + car.getRentalTotal();
    }

    @Transactional
    public String returnCar(int id, Account account) {
        Car car = repo.findForRental(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found."));
        owner(car, account);
        if (!car.isRented()) throw new ResponseStatusException(HttpStatus.CONFLICT, "This car is already available.");
        car.setStatus("available");
        car.setRentedById(null);
        car.setRentalDays(null);
        car.setRentedAt(null);
        car.setRentalTotal(null);
        repo.save(car);
        return "Car returned successfully.";
    }

    @Transactional
    public void deleteCar(int id, Account account) {
        Car car = repo.findForRental(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found."));
        owner(car, account);
        if (car.isRented())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Return this rented vehicle before deleting it.");
        repo.delete(car);
    }

    public record RentalView(Car car, String customerName, String customerEmail) {
    }

    public List<RentalView> rentals(Account account) {
        return repo.findAll().stream().filter(Car::isRented).filter(c -> "RENTER".equals(account.getRole()) ? Objects.equals(c.getOwnerId(), account.getId()) : Objects.equals(c.getRentedById(), account.getId())).map(c -> {
            var customer = c.getRentedById() == null ? null : accounts.findById(c.getRentedById()).orElse(null);
            return new RentalView(c, customer == null ? "Legacy rental" : customer.getName(), customer == null ? "" : customer.getEmail());
        }).toList();
    }
}
