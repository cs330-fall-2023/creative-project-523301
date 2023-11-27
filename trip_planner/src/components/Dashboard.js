// Dashboard.js
import React from 'react';

const Dashboard = ({ user }) => {
  return (
    <div>
      <h2>Welcome, {user ? user.email : 'Guest'}!</h2>
      {/* Add dashboard content and functionalities */}
    </div>
  );
};

export default Dashboard;
