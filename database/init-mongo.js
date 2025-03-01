// Connect to the admin database
db = db.getSiblingDB('admin');

// Create application database
db = db.getSiblingDB('tunedIn');

// Create application user
db.createUser({
  user: 'tunedInUser',
  pwd: 'password',  // You should change this in a production environment
  roles: [
    {
      role: 'readWrite',
      db: 'tunedIn'
    }
  ]
});

db.grantRolesToUser("tunedInUser", [{ role: "readWrite", db: "tunedindb" }])

// Create initial collections
db.createCollection('tracks');
db.createCollection('artists');
db.createCollection('albums'); 
db.createCollection('reviews'); 
db.createCollection('sessions'); 
db.createCollection('users'); 
db.createCollection('user_reviews_lists'); 

