package com.car_rental.service;


import com.car_rental.model.Car;
import com.car_rental.repository.CarRepository;
import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CarService {

    @Autowired
    private CarRepository carRepo;

    public void addCar(Car car) {
        car.setStatus("Free");
        carRepo.save(car);
    }

    public List<Car> getAvailableCarsByFuelType(String fuelType) {
        return carRepo.findByFuelTypeIgnoreCaseAndStatusIgnoreCase(fuelType, "Free");
    }

    public String rentCar(int id, int days) {
        Car car = carRepo.findById(id).orElseThrow(() -> new RuntimeException("Car not found"));
        if (car.getStatus().equals("Rented")) {
            throw new RuntimeException("Car already rented");
        }
        car.setStatus("Rented");
        carRepo.save(car);
        double bill = car.getPricePerDay() * days;
        return "Car rented successfully. Total Bill: ₹" + bill;
    }
    

    public List<Car> suggestCars(String fuelType, int travelers) {
        return carRepo.findTop3ByFuelAndTravelers(fuelType, travelers);
    }

    public List<Car> getCars() {
        return carRepo.findAllAvailable();
    }

    public List<Car> getAvailableCars(String fuelType) {
        return carRepo.findByFuelTypeAndStatus(fuelType, "Free");
    }

    public Car getCarById(int id) {
        return carRepo.findById(id).orElse(null);
    }
}
