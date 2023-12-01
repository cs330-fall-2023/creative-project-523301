// Header.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = ({ user, setUser }) => {
  const navigate = useNavigate();
  const handleLogout = () => {
    // Logout logic
    setUser(null);
    navigate('/login'); // Redirect to login page after logout
  };
  return (
    <header>
      <nav>
        <ul>
          <li><Link to="/home">Home</Link></li>
          {user ? (
            <>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><button onClick={handleLogout}>Logout</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
