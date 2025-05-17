# 🚗 Car Rental System

A full-stack **Car Rental System** built using **Spring Boot (Java)** for the backend and **React** for the frontend. The system allows users to view available cars, rent cars based on preferences (fuel type, capacity, vehicle type), and receive a rental bill. It supports persistent storage using PostgreSQL and implements best practices using Spring Data JPA, Hibernate, and Lombok.

---

## 📌 Project Overview

This project simulates a real-world car rental service that allows users to:

- View available cars
- Rent cars based on filters (fuel type: petrol/diesel/electric, vehicle type, capacity)
- Automatically generate rental bills based on selected car and rental days
- Keep track of car availability status
- Suggest best rental options based on number of travelers and fuel preferences

---

## 🧰 Technologies Used

### 🖥 Backend:
- **Spring Boot** – REST API framework
- **Spring Data JPA** – ORM mapping and database access
- **Hibernate** – ORM provider
- **Lombok** – Boilerplate code elimination
- **PostgreSQL** – Relational database

### 🌐 Frontend:
- **React** – UI framework
- **HTML5** – Markup language
- **Bootstrap** – Styling and responsive design

## 🚀 Features
- Car filtering by:
      Fuel Type: Petrol / Diesel / Electric
      Number of Travelers
- Car availability management (Free / Rented)
- Dynamic rental bill generation
- Best car recommendations (Top 3 based on price)
- Clean and responsive UI

## Future Improvements
- Here are some suggested improvements to enhance the system:

- **Car Images Support** - Add image upload and preview functionality for each car in the inventory.
- **Buy/Sell Functionality** - Allow users to list their own cars for sale and purchase cars listed by others.
- **Authentication & Authorization** - Implement login/signup functionality for Admins and Customers.

This project is open-source and available under the MIT License.
