import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const HomePage = (user) => {
  const [trips, setTrips] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await axios.get('http://localhost:5010/api/homeTrips');
        setTrips(response.data.trips);
      } catch (error) {
        console.error('Error fetching trips:', error);
      }
    };

    fetchTrips();
  }, []);

  const goToTripDetails = (tripId) => {
    navigate(`/trips/${tripId}`,  {state: {user: user.user}});
  };

  return (
    <div>
      <h1>Trips</h1>
      {trips.map(trip => (
        <div key={trip._id} onClick={() => goToTripDetails(trip._id)} style={{ cursor: 'pointer' }}>
          <h2>{trip.name} by {trip.userEmail}</h2>
          <ul>
            {trip.locations.slice(0, 3).map((location, index) => ( // show only first three locations
              <li key={index}>{location.name}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default HomePage;