/* global google */

import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import React, {useState, useCallback} from 'react';
import axios from 'axios'; 
import { useNavigate } from 'react-router-dom';
import './main.css';


const AddTrip = (user) => {
  console.log(user)
  const navigate = useNavigate();
  if(!user) {
     navigate('/login');
  }
  const token = user.user.token;
  
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [nearbyPlaces, setNearbyPlaces] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const mapStyles = {        
    height: "70vh",
    width: "100%"};
  
  const defaultCenter = {
    lat: 41.3851, lng: 2.1734
  }
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyDGXL-EyVeSNmIvY4ut14fZIQNZOkbvsSQ',
    libraries: ['geometry', 'drawing', 'places'],
  });
  const handleMapClick = (event) => {
    if (mapInstance) {
      const service = new google.maps.places.PlacesService(mapInstance);

      const location = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      service.nearbySearch({
        location: location,
        radius: '40',
        type: ['establishment']
      }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          setNearbyPlaces(results);
        }
      });
    }
  };
  const handleAddToTrip = (location) => {
    if(!selectedLocations.includes(location)){
      setSelectedLocations(prevLocations => [...prevLocations, location]);
    }
  };
  const handleSubmitTrip = async () => {
    try {
      // Send a POST request to the registration endpoint
      const response = await axios.post('http://localhost:5010/api/createTrip', {
        locations: selectedLocations
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Handle success (e.g., redirect to login page)
      console.log('Trip created successful!', response.data);
      navigate('/dashboard');
    } catch (error) {
      // Handle error (e.g., display an error message)
      console.error('Trip creation failed:', error.message);
    }
  };

  // Callback to store the map instance once it's loaded
  const onLoad = useCallback((map) => {
    setMapInstance(map);
  }, []);

  return (
    <div class="body">
      {isLoaded && (
        <GoogleMap
          mapContainerStyle={mapStyles}
          center={defaultCenter}
          zoom={13}
          onLoad={onLoad} // Set onLoad callback
          onClick={handleMapClick}
        >
        </GoogleMap>
      )}
      {selectedLocations.length>0 && user.user!==null ?<> 
        <button onClick={handleSubmitTrip}>Create Trip</button>
        <ul>{selectedLocations.map((place) => (<li>{place.name}</li>))}</ul></>:<> </>}
      {nearbyPlaces ? <table>
          <thead>
            <tr>
              <th>Place</th>
              <th>Address</th>
              <th>Rating</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {nearbyPlaces ? nearbyPlaces.map((place) => (
              <tr key={place.id}>
                <td style={{margin:"0 20"}}>{place.name}</td>
                <td style={{margin:"0 20"}}>{place.vicinity}</td>
                <td style={{margin:"0 20"}}>{place.rating}</td>
                <td style={{margin:"0 20"}}></td>
                <td>{!selectedLocations.includes(place)?<button onClick={() => handleAddToTrip(place)}>Add to Trip</button>:<button disabled>Add to Trip</button>}</td>
              </tr>
            )) : <></>}
          </tbody>
        </table>:<h1>Click on the map to show nearby establishments!</h1>}
      
    </div>
  );
}

export default AddTrip;