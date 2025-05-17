import React, { useState } from 'react';
import CarList from './components/CarList';
import AddCarForm from './components/AddCarForm';
import SuggestButton from './components/SuggestButton';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  const [refresh, setRefresh] = useState(false);
  const triggerRefresh = () => setRefresh(!refresh);

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3">
        <a className="navbar-brand" href="#">Car Rental System</a>
      </nav>

      <div className="container mt-4">
        <AddCarForm onCarAdded={triggerRefresh} />
        <SuggestButton onSuggest={triggerRefresh} />
        <CarList key={refresh} />
      </div>

      <footer className="bg-dark text-white text-center py-3 mt-5">
        <p>© {new Date().getFullYear()} Car Rental Inc. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default App;
