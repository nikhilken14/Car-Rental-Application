package com.car_rental.controller;

import com.car_rental.model.Car;
import com.car_rental.service.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
public class CarController {
    private final CarService cars;
    private final AccountService accounts;

    public CarController(CarService cars, AccountService accounts) {
        this.cars = cars;
        this.accounts = accounts;
    }

    @GetMapping("/cars")
    public List<Car> cars() {
        return cars.getCars();
    }

    @GetMapping("/fleet")
    public List<Car> fleet(Authentication auth) {
        return cars.ownFleet(accounts.current(auth));
    }

    @GetMapping("/rentals")
    public List<CarService.RentalView> rentals(Authentication auth) {
        return cars.rentals(accounts.current(auth));
    }

    @PostMapping("/add")
    public Car add(@RequestBody Car car, Authentication auth) {
        return cars.addCar(car, accounts.current(auth));
    }

    @DeleteMapping("/cars/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable int id, Authentication auth) {
        cars.deleteCar(id, accounts.current(auth));
    }

    @GetMapping("/available/{fuelType}")
    public List<Car> available(@PathVariable String fuelType) {
        return cars.getAvailableCars(fuelType);
    }

    @GetMapping("/suggest")
    public List<Car> suggest(@RequestParam String fuelType, @RequestParam int travelers) {
        return cars.suggestCars(fuelType, travelers);
    }

    @PostMapping("/rent/{id}")
    public String rent(@PathVariable int id, @RequestParam int days, Authentication auth) {
        return cars.rentCar(id, days, accounts.current(auth));
    }

    @PostMapping("/return/{id}")
    public String returnCar(@PathVariable int id, Authentication auth) {
        return cars.returnCar(id, accounts.current(auth));
    }

    @GetMapping("/rent-info/{id}")
    public Map<String, Object> quote(@PathVariable int id, @RequestParam int days) {
        cars.validateDays(days);
        Car car = cars.getCarById(id);
        if (car.isRented() || car.getOwnerId() == null)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Car is unavailable.");
        return Map.of("car", car, "days", days, "totalCost", cars.rentalCost(car, days));
    }
}
