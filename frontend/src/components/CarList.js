import React, { useEffect, useState } from 'react';
import { getCars } from '../api';
import RentCarForm from './RentCarForm';
import Modal from './Model';  // import modal

const CarList = () => {
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);

  const fetchCars = async () => {
    try {
      const response = await getCars();
      setCars(response.data);
    } catch (error) {
      alert("Failed to load cars: " + (error.response?.data || error.message));
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const handleRentClick = (car) => {
    setSelectedCar(car);
  };

  const handleCloseRentForm = () => {
    setSelectedCar(null);
    fetchCars();  // refresh cars after rent or cancel
  };

  return (
    <div>
      <h3 className="mb-3">Available Cars</h3>
      <div className="row">
        {cars.map(car => (
          <div className="col-md-4 mb-3" key={car.id}>
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">{car.brand}</h5>
                <p className="card-text">
                  Type: {car.vehicleType}<br />
                  Fuel: {car.fuelType}<br />
                  Capacity: {car.capacity}<br />
                  ₹{car.pricePerDay}/day
                </p>
                <p className={`badge ${car.status === "rented" ? "bg-danger" : "bg-success"}`}>
                  {car.status === "rented" ? "Rented" : "Available"}
                </p>
                <p className="rent-button">
                  {car.status !== 'rented' && (
                    <button style={{ marginLeft: '10px' }} onClick={() => handleRentClick(car)}>Rent</button>
                  )}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Render modal only if a car is selected */}
      {selectedCar && (
        <Modal onClose={handleCloseRentForm}>
          <RentCarForm
            carId={selectedCar.id}
            carDetails={selectedCar}
            onClose={handleCloseRentForm}
          />
        </Modal>
      )}
    </div>
  );
};

export default CarList;
