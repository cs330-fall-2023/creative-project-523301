// App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import './App.css';

const App = () => {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    // Implement login functionality and set the user state
    setUser(userData);
  };

  const handleLogout = () => {
    // Implement logout functionality and reset the user state
    setUser(null);
  };

  return (
    <Router>
      <div>
        <Header user={user} onLogout={handleLogout} />

        <Routes>
          <Route path="/" exact component={Home} />
          <Route
            path="/login"
            element={<Login onLogin={handleLogin} />}
            // render={(props) => <Login {...props} onLogin={handleLogin} />}
          />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            render={(props) => (
              <Dashboard {...props} user={user} />
            )}
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
