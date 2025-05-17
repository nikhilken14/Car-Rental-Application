import React, { useState } from 'react';
import { getRentInfo, rentCar } from '../api';

const RentCarForm = ({ carId, carDetails, onClose }) => {
  const [days, setDays] = useState('');
  const [totalCost, setTotalCost] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState('');

  const calculateCost = async () => {
    if (!days || isNaN(days) || parseInt(days) <= 0) {
      alert("Please enter a valid number of days");
      return;
    }

    try {
      const response = await getRentInfo(carId, parseInt(days));
      setTotalCost(response.data.totalCost);
      setConfirmed(true);
      setMessage('');
    } catch (err) {
      setMessage("❌ Failed to fetch rental info: " + (err.response?.data || err.message));
    }
  };

  const confirmRent = async () => {
    try {
      const res = await rentCar(carId, parseInt(days));
      setMessage("✅ " + res.data);
      setConfirmed(false);
    } catch (err) {
      setMessage("❌ Failed to rent: " + (err.response?.data || err.message));
    }
  };

  const rejectRent = () => {
    setMessage('❌ Rental canceled.');
    setConfirmed(false);
    setDays('');
    setTotalCost(null);
    onClose(); // closes the form and goes back to car list
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', marginTop: '20px' }}>
      <h3>Rent Car - {carDetails.brand} ({carDetails.vehicleType})</h3>
      <p><strong>Fuel Type:</strong> {carDetails.fuelType}</p>
      <p><strong>Capacity:</strong> {carDetails.capacity}</p>
      <p><strong>Price Per Day:</strong> ₹{carDetails.pricePerDay}</p>

      <div style={{ marginTop: '10px' }}>
        <label>Number of days to rent:</label>
        <input
          type="number"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          min="1"
          required
          style={{ marginLeft: '10px' }}
        />
        <button onClick={calculateCost} style={{ marginLeft: '10px' }}>Calculate</button>
      </div>

      {confirmed && (
        <div style={{ marginTop: '15px' }}>
          <p><strong>Total Cost:</strong> ₹{totalCost}</p>
          <button onClick={confirmRent} style={{ marginRight: '10px' }}>✅ Accept</button>
          <button onClick={rejectRent}>❌ Reject</button>
        </div>
      )}

      {message && <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{message}</p>}
    </div>
  );
};

export default RentCarForm;
