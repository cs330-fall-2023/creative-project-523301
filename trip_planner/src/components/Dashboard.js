import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './AuthContext';

const Dashboard = ({ user }) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  console.log(user)
  if(!user){
    navigate('/home')
  }
  const [collaboratorTrips, setCollaboratorTrips] = useState([]);
  
  const navigateToTrip = (tripId) => {
    navigate(`/trips/${tripId}`, {state: {user: user}});
  };
  useEffect(() => {
    // Check if the user is not logged in
    if (!token) {
      navigate('/login'); // Redirect to login page if not authenticated
    }
  }, [token, navigate]);
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await axios.get('http://localhost:5010/api/trips', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setTrips(response.data.trips); 
        const collaboratorTripsResponse = await axios.get('http://localhost:5010/api/collaboratorTrips', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setCollaboratorTrips(collaboratorTripsResponse.data.collaboratorTrips);
      } catch (error) {
        console.error('Error fetching trips:', error);
      }
    };

    if (user) {
      fetchTrips();
    }
  }, [user]);
  console.log(collaboratorTrips)

  const handleAddTrip = () => {
    navigate('/addTrip');
  };

  return (
    <div>
      <h2>Welcome, {user ? user.email : 'Guest'}!</h2>
      {!user ? <h1>Please login or create an account to plan trips!</h1> :
      <>
      <button onClick={handleAddTrip}>Add New Trip</button>
      <h3>Your Trips</h3>
      {trips.length > 0 ? (
        <ul>
          {trips.map(trip => (
            <li key={trip._id} onClick={() => navigateToTrip(trip._id)} style={{ cursor: 'pointer' }}>
              {trip.name}
            </li>
          ))}
        </ul>
      ) : (
        <p>No trips added yet.</p>
      )}
      <h3>Trips Shared With You</h3>
      {collaboratorTrips.length > 0 ? (
        <ul>
          {collaboratorTrips.map(trip => (
            <li key={trip._id} onClick={() => navigateToTrip(trip._id)} style={{ cursor: 'pointer' }}>
              {trip.name}, shared by {trip.userId.email}
            </li>
          ))}
        </ul>
      ) : <p>No shared trips yet.</p>}</>}
    </div>
  );
};

export default Dashboard;
