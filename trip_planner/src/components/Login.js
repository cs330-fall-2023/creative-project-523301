// Login.js
import React, { useState } from 'react';
import axios from 'axios'; 
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();


  const handleLogin = async () => {
      try {
        // Send a POST request to the registration endpoint
        const response = await axios.post('http://localhost:5010/api/login', {
          email,
          password,
          // Add more registration fields as needed
        });
  
        // Handle success (e.g., redirect to login page)
        console.log('Login successful!', response.data);
        onLogin(response.data.user);
        const { token } = response.data.user.token;
        localStorage.setItem('userToken', token);
        navigate('/dashboard');
      } catch (error) {
        // Handle error (e.g., display an error message)
        console.error('Login failed:', error.message);
      }
  };

  return (
    <div>
      <h2>Login</h2>
      <form>
        <label>Email/Username:</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>Password:</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="button" onClick={handleLogin}>Login</button>
      </form>
    </div>
  );
};

export default Login;
