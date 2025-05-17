package com.car_rental.controller;

import com.car_rental.model.Car;
import com.car_rental.service.CarService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/")
@CrossOrigin(origins = "http://localhost:3000")
public class CarController {

    @Autowired
    private CarService carService;

    @GetMapping("/cars")
    public List<Car> getCars(){
        return carService.getCars();
    }

    @PostMapping("/add")
    public void addCar(@RequestBody Car car) {
        carService.addCar(car);
    }

    @GetMapping("/available/{fuelType}")
    public List<Car> getAvailableCars(@PathVariable String fuelType) {
        return carService.getAvailableCars(fuelType);
    }

    @PostMapping("/rent/{id}")
    public String rentCar(@PathVariable int id, @RequestParam int days) {
        return carService.rentCar(id, days);
    }

    @GetMapping("/suggest")
    public List<Car> suggestCars(@RequestParam String fuelType, @RequestParam int travelers) {
        return carService.suggestCars(fuelType, travelers);
    }

    @GetMapping("/rent-info/{id}")
    public ResponseEntity<?> getCarRentalInfo(@PathVariable int id, @RequestParam int days) {
        Car car = carService.getCarById(id); // You must implement this
        if (car == null || car.isRented()) {
            return ResponseEntity.badRequest().body("Car not available for rent.");
        }

        double costPerDay = car.getPricePerDay(); // Or however you're calculating
        double totalCost = costPerDay * days;

        Map<String, Object> response = new HashMap<>();
        response.put("car", car);
        response.put("days", days);
        response.put("totalCost", totalCost);

        return ResponseEntity.ok(response);
    }

}

