import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

import './TripDetail.css';
import './main.css'



const TripDetail = () => {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const [collaboratorTrips, setCollaboratorTrips] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user
  const token = user ? user.token : null;

  useEffect(() => {
    const fetchTrip = async () => {

      try {
        const response = await axios.get(`http://localhost:5010/api/trips/${tripId}`, {
          headers: { Authorization: `Bearer ${token}` }, // Send token in the request
        });
        setTrip(response.data.trip);
        const collaboratorTripsResponse = await axios.get('http://localhost:5010/api/collaboratorTrips', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCollaboratorTrips(collaboratorTripsResponse.data.collaboratorTrips);
      } catch (error) {
        console.error('Error fetching trip:', error);
      }
    };

    fetchTrip();
  }, [tripId, token]);
  const handleRemoveLocation = async (locationIndex) => {
    try {
      const response = await axios.patch(
        `http://localhost:5010/api/trips/${tripId}/removeLocation`,
        { locationIndex },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTrip(response.data.trip); // Update the trip with the new data
    } catch (error) {
      console.error('Error removing location:', error);
    }
  };
  
  const handleEditTripName = async () => {
    const newName = prompt('Enter the new name for the trip:', trip.name);
    if (newName && newName !== trip.name) {
      try {
        const response = await axios.patch(
          `http://localhost:5010/api/trips/${tripId}/editName`,
          { newName },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setTrip(response.data.trip); // Update the trip with the new name
      } catch (error) {
        console.error('Error editing trip name:', error);
      }
    }
  };
  
  const handleDeleteTrip = async () => {
    try {
      await axios.delete(
        `http://localhost:5010/api/trips/${tripId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/dashboard'); // Redirect to dashboard after deletion
    } catch (error) {
      console.error('Error deleting trip:', error);
    }
  };
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const handleAddLocation = () => {
    navigate(`/addTripLocation/${tripId}`, {state: {user: user}});
  };
  const handleAddCollaborator = async () => {
    try {
      await axios.post(`http://localhost:5010/api/trips/${tripId}/collaborators`, 
        { collaboratorEmail },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      alert('Collaborator added successfully');
      // Optionally, refresh the trip details to show the new collaborator
    } catch (error) {
      console.error('Error adding collaborator:', error);
      alert('Failed to add collaborator');
    }
  };
  const isCreator = trip && token && trip?.creatorToken === token; 
  console.log(collaboratorTrips)
  console.log(trip)
  let isCollaborator = false;
  if(collaboratorTrips?.length>0){
    for(let i = 0; i < collaboratorTrips.length; i++) {
      if(collaboratorTrips[i]._id===trip._id){
        isCollaborator = true;
        break;
      }
  }}
  if (!trip) {
    return <div>Loading...</div>;
  }
  for(let i = 0; i<trip.collaborators.length; i++){
    if(trip.collaborators[i].email === trip.creator){
      trip.collaborators.splice(i, 1)
    }
  }
  return (
  <div className="trip-container body">
  <div className="trip-header">
    <h2>{trip.name}</h2>
    <h3>Created by {trip.creator}</h3>
    {trip.collaborators.length > 0 && (
  <>
    <h4>Shared with:</h4>
    <ul>
      {trip.collaborators.map((collaborator, index) => (
        <li key={index}>{collaborator.email}</li>
      ))}
    </ul>
  </>)}
    
    {isCreator && (
        <>
          <button onClick={handleEditTripName}>Edit Name</button>
          <button onClick={handleDeleteTrip}>Delete</button>
      <input
      type="email"
      value={collaboratorEmail}
      onChange={(e) => setCollaboratorEmail(e.target.value)}
      placeholder="Enter collaborator's email"
      className='collaborator-input'
      />
      <button onClick={handleAddCollaborator}>Add Collaborator</button>
      </>
      )}
  </div>

  <h3>Locations:</h3>
  {trip.locations && trip.locations.length > 0 ? (
    <ul>
      {trip.locations.map((location, index) => (
        <li key={index} className="location-item">
          <span className="location-name">{location.name}</span>
          {(isCreator || isCollaborator) && (<button className="remove-button" onClick={() => handleRemoveLocation(index)}>Remove</button>)}
        </li>
      ))}
    </ul>
  ) : (
    <p>No locations added to this trip.</p>
  )}
  {(isCreator || isCollaborator) && <button onClick={handleAddLocation}>Add Location</button>}
</div>
  );
};

export default TripDetail;
