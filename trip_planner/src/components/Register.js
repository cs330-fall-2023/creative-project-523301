// Register.js
import React, { useState } from 'react';
import axios from 'axios'; 
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    console.log("Here");
    try {
      // Send a POST request to the registration endpoint
      const response = await axios.post('http://localhost:5010/api/register', {
        email,
        password,
      });

      // Handle success (e.g., redirect to login page)
      console.log('Registration successful!', response.data);
      navigate('/login');
    } catch (error) {
      // Handle error (e.g., display an error message)
      console.error('Registration failed:', error.message);
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form>
        <label>Email/Username:</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>Password:</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {/* Add more registration fields as needed */}
        <button type="button" onClick={handleRegister}>Register</button>
      </form>
    </div>
  );
};

export default Register;
