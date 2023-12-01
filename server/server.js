const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const uri = "mongodb+srv://hjerome:01092002jero@tripplanner.csp3jkr.mongodb.net/?retryWrites=true&w=majority";

const app = express();
app.use(cors());
const PORT = process.env.PORT || 5010;

const crypto = require('crypto');
const generateToken = (length = 48) => {
  return crypto.randomBytes(length).toString('hex');
};
// Connect to MongoDB
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Define a user schema and model
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  token: { type: String }
});

const User = mongoose.model('User', userSchema);

const tripSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String },
  locations: [{ 
    name: String
  }],
  createdAt: { type: Date, default: Date.now },
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const Trip = mongoose.model('Trip', tripSchema);

// Register endpoint
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

     // Hash the password
     const hashedPassword = await bcrypt.hash(password, saltRounds);

     // Create a new user with the hashed password
     const newUser = new User({ email, password: hashedPassword });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken();
    user.token = token; // Assign the token to the user's token field
    await user.save(); // Save the user with the new token
    res.json({ message: 'Login successful', user: { email: user.email, token: token } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const getUserFromToken = async (token) => {
  try {
    const user = await User.findOne({ token }).exec();
    return user || null;  // Return null if no user is found
  } catch (error) {
    console.error("Error finding user by token:", error);
    return null;
  }
};

app.post('/api/createTrip', async (req, res) => {
  const { locations } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  // Authenticate the user using the token
  const user = await getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const userTripCount = await Trip.countDocuments({ userId: user._id });
    const tripName = `Trip ${userTripCount + 1}`;
    const newTrip = new Trip({ userId: user._id, name: tripName, locations, collaborators: [user._id] });
    await newTrip.save();
    res.status(201).json({ message: 'Trip created successfully', trip: newTrip });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.post('/api/trips/:tripId/collaborators', async (req, res) => {
  const { tripId } = req.params;
  const { collaboratorEmail } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  const requestingUser = await getUserFromToken(token);
  if (!requestingUser) return res.status(401).json({ message: 'Unauthorized' });

  const trip = await Trip.findById(tripId);
  if (!trip || trip.userId.toString() !== requestingUser._id.toString()) return res.status(404).json({ message: 'Trip not found or forbidden' });

  const collaborator = await User.findOne({ email: collaboratorEmail });
  if (!collaborator) return res.status(404).json({ message: 'User not found' });

  if (!trip.collaborators.includes(collaborator._id)) {
    trip.collaborators.push(collaborator._id);
    await trip.save();
  }

  res.status(200).json({ message: 'Collaborator added', trip });
});

app.get('/api/trips', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const user = await getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const trips = await Trip.find({ userId: user._id });

    res.json({ trips });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.get('/api/trips/:tripId', async (req, res) => {
  const { tripId } = req.params;
  
  try {
    const trip = await Trip.findById(tripId)
                          .populate('userId', 'email token')
                          .populate('collaborators', 'email'); // Populate collaborator's email
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    const creatorToken = trip.userId.token;
    const creator = trip.userId.email;
    res.json({ trip: { ...trip.toObject(), creator, creatorToken } });
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.patch('/api/trips/:tripId/removeLocation', async (req, res) => {
  const { tripId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  try {
    // Fetch the trip along with populated data
    let trip = await Trip.findById(tripId)
      .populate('userId', 'email token') // Populate creator's email and token
      .populate('collaborators', 'email'); // Populate collaborators' emails

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if the user is either the creator or a collaborator
    let isAuthorized = trip.userId._id.equals(user._id);
    if (!isAuthorized) {
      isAuthorized = trip.collaborators.some(collaborator => collaborator._id.equals(user._id));
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { locationIndex } = req.body;
    // Remove the location at the specified index
    trip.locations.splice(locationIndex, 1); 
    await trip.save(); 
    const creator = trip.userId.email;
    const creatorToken = trip.userId.token;

    // Respond with updated trip data
    res.json({ message: 'Location removed successfully', trip: { ...trip.toObject(), creator, creatorToken } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.patch('/api/trips/:tripId/editName', async (req, res) => {
  const { tripId } = req.params;
  const { newName } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  const user = await getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const trip = await Trip.findOne({ _id: tripId, userId: user._id })
      .populate('userId', 'email token') // Populate creator's email and token
      .populate('collaborators', 'email'); // Populate collaborators' emails;
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found or you do not have permission to modify it' });
    }
    const creator = await User.findById(trip.userId);
    const creatorName = creator.email;
    const creatorToken = creator.token

    trip.name = newName;
    await trip.save();

    res.json({ message: 'Trip name updated successfully', trip: { ...trip.toObject(), creator: creatorName, creatorToken: creatorToken } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/trips/:tripId', async (req, res) => {
  const { tripId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  const user = await getUserFromToken(token);

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const trip = await Trip.findOneAndDelete({ _id: tripId, userId: user._id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found or you do not have permission to delete it' });
    }

    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.post('/api/trips/:tripId/addLocation', async (req, res) => {
  const { tripId } = req.params;
  const { locations } = req.body; 
  const token = req.headers.authorization?.split(' ')[1];

  try {
    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }    
    const trip = await Trip.findById(tripId)
                          .populate('userId', 'email token')
                          .populate('collaborators', 'email'); // Populate collaborator's email

    const flag = trip.collaborators.includes(user._id) || trip.userId._id.toString() === user._id.toString();
    if (!trip && !flag) {
      return res.status(404).json({ message: 'Trip not found or you do not have permission to modify it' });
    }

    trip.locations.push(...locations); // Add the new locations to the trip
    await trip.save();

    res.json({ message: 'Locations added successfully', trip });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.get('/api/collaboratorTrips', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find trips where the user's ID is in the collaborators array
    const collaboratorTrips = await Trip.find({
      collaborators: user._id // Directly check if user's ID is in the collaborators array
    })
    .populate('userId', 'email') // Populate creator's email
    .populate('collaborators', 'email'); // Populate collaborators' emails

    // Convert to object and add a flag to indicate these are collaborator trips
    const formattedTrips = collaboratorTrips.map(trip => ({
      ...trip.toObject(),
      isCollaboratorTrip: true
    }));

    res.json({ collaboratorTrips: formattedTrips });
  } catch (error) {
    console.error('Error fetching collaborator trips:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/homeTrips', async (req, res) => {
  try {
    const trips = await Trip.find()
      .populate('userId', 'email')  // Assuming you want to show the user's email
      .lean() // Lean query to make it possible to manipulate the result
      .exec();

    // Limit locations to first three and add user email to each trip
    const tripsWithLimitedLocations = trips.map(trip => {
      return {
        ...trip,
        locations: trip.locations.slice(0, 3), // Get only the first three locations
        userEmail: trip.userId.email // Add the user's email to the trip object
      };
    });

    res.json({ trips: tripsWithLimitedLocations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});