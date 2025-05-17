import React, {useState } from 'react';
import { suggestCars } from '../api';

const SuggestButton= ()=>{
  const [fuelType , setFuelType] = useState('');
  const [capacity,setCapacity] = useState('');
  const [cars,setCars] = useState('');
  const [suggestedCars,setSuggestedCars] = useState('');

const fetchCars = async () => {
  const response = await suggestCars(fuelType, parseInt(capacity));
  return response.data;  // return the data directly
};

  
const handleSuggest = async (e) => {
  e.preventDefault();
  const carList = await fetchCars();
  setCars(carList);
  setSuggestedCars(carList);
};
  


return (
    <form onSubmit={handleSuggest} className="card p-4 mb-4 shadow-sm">
  <h3>Suggest a Car</h3>
  <div className="row mb-3">
    <div className="col">
      <input value={fuelType} onChange={e => setFuelType(e.target.value)} className="form-control" placeholder="Fuel Type" required />
    </div>
    <div className="col">
      <input value={capacity} onChange={e => setCapacity(e.target.value)} className="form-control" placeholder="Capacity" required />
    </div>
    <div className="col-auto">
      <button type="submit" className="btn btn-secondary">Suggest</button>
    </div>
  </div>
  <ul className="list-group">
    {suggestedCars.length > 0 ? (
      suggestedCars.map((car, index) => (
        <li className="list-group-item" key={index}>
          {car.brand} - {car.vehicleType} - {car.capacity} - ₹{car.pricePerDay}
        </li>
      ))
    ) : (
      <li className="list-group-item">No suggestions yet.</li>
    )}
  </ul>
</form>

    
     
);


}
export default SuggestButton;