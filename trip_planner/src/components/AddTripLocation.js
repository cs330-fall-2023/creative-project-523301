/* global google */

import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import React, {useState, useCallback, useEffect} from 'react';
import axios from 'axios'; 
import { useNavigate, useLocation,useParams } from 'react-router-dom';


const AddTripLocation = () => {
const { tripId } = useParams();
const location = useLocation();
const user = location.state?.user
  console.log(user)
  const navigate = useNavigate();
  if(!user) {
     navigate('/login');
  }
  const token = user.token;
  
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [nearbyPlaces, setNearbyPlaces] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [tripLocations, setTripLocations] = useState([]); // New state for existing trip locations

  useEffect(() => {
    // Function to fetch existing locations of the trip
    const fetchTripLocations = async () => {
        try {
          const response = await axios.get(`http://localhost:5010/api/trips/${tripId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setTripLocations(response.data.trip.locations); // Assuming the response has a 'locations' field
        } catch (error) {
          console.error('Error fetching trip locations:', error);
        }
      };

    fetchTripLocations();
  }, [tripId, token]);
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
      const response = await axios.post(`http://localhost:5010/api/trips/${tripId}/addLocation`, {
        locations: selectedLocations
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Trip updated successfully!', response.data);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating trip:', error.message);
    }
  };

  // Callback to store the map instance once it's loaded
  const onLoad = useCallback((map) => {
    setMapInstance(map);
  }, []);

  return (
    <>
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
      <ul>
        {tripLocations.map((place) => (<li>{place.name}</li>))}
      {selectedLocations.length>0 && user.user!==null ?<> 
        <button onClick={handleSubmitTrip}>Add Following Locations to Trip</button>
        {selectedLocations.map((place) => (<li>{place.name}</li>))}</>:<> </>}
    </ul>
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
                <td>{!selectedLocations.includes(place)?<button onClick={() => handleAddToTrip(place)}>Add to Trip</button>:<button disabled>Add to Trip</button>}</td>              </tr>
            )) : <></>}
          </tbody>
        </table>:<h1>Click on the map to show nearby establishments!</h1>}
      
    </>
  );
}

export default AddTripLocation;