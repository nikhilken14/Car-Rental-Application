import React, { useState } from 'react';
import { addCar } from '../api';

const AddCarForm = ({ onCarAdded }) => {
  const [brand, setBrand] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [capacity, setCapacity] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [pricePerDay, setPricePerDay] = useState(''); // add price per day input

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newCar = {
      brand,
      vehicleType,
      fuelType,
      capacity: Number(capacity),
      pricePerDay: Number(pricePerDay),
      status: 'available' // default status for new cars
    };

    try {
      await addCar(newCar);
      setBrand('');
      setVehicleType('');
      setFuelType('');
      setCapacity('');
      setPricePerDay('');
      onCarAdded();
      alert("Car added successfully!");
    } catch (err) {
      alert("Failed to add car: " + (err.response?.data || err.message));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-4 mb-4 shadow-sm">
      <h3 className="mb-3">Add New Car</h3>
      <div className="row">
        <div className="col">
          <input
            className="form-control mb-2"
            value={brand}
            onChange={e => setBrand(e.target.value)}
            placeholder="Brand"
            required
          />
        </div>
        <div className="col">
          <input
            className="form-control mb-2"
            value={vehicleType}
            onChange={e => setVehicleType(e.target.value)}
            placeholder="Vehicle Type"
            required
          />
        </div>
        <div className="col">
          <input
            className="form-control mb-2"
            value={fuelType}
            onChange={e => setFuelType(e.target.value)}
            placeholder="Fuel Type"
            required
          />
        </div>
        <div className="col">
          <input
            className="form-control mb-2"
            type="number"
            value={capacity}
            onChange={e => setCapacity(e.target.value)}
            placeholder="Capacity"
            required
            min="1"
          />
        </div>
        <div className="col">
          <input
            className="form-control mb-2"
            type="number"
            value={pricePerDay}
            onChange={e => setPricePerDay(e.target.value)}
            placeholder="Price Per Day"
            required
            min="1"
          />
        </div>
      </div>
      <button type="submit" className="btn btn-primary">Add Car</button>
    </form>
  );
};

export default AddCarForm;

