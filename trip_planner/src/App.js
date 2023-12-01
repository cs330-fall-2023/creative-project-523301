import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import AddTrip from './components/AddTrip';
import TripDetail from './components/TripDetail';
import AddTripLocation from './components/AddTripLocation';
import { AuthProvider } from './components/AuthContext';
import './App.css';

const App = () => {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    // Implement login functionality and set the user state
    setUser(userData);
  };


  return (
    <AuthProvider>
    <Router>
      <div>
        <Header user={user} setUser={setUser} />

        <Routes>
          <Route path="/home" exact element={<Home user={user}/>} />
          <Route path="/" exact element={<Home user={user}/>} />
          <Route
            path="/login"
            element={<Login onLogin={handleLogin} />}
          />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={<Dashboard user={user} />}
          />
          <Route
            path="/addTrip"
            element={<AddTrip user={user} />}
          />
          <Route path="/trips/:tripId" user={user} element={<TripDetail />} />
          <Route path="/AddTripLocation/:tripId" user={user} element={<AddTripLocation />} />
        </Routes>
      </div>
    </Router>
    </AuthProvider>
  );
};

export default App;
