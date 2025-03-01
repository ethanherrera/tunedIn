// Switch to the application database
db = db.getSiblingDB('tunedIn');

// Create initial collections
db.createCollection('trackReview');  // Changed to match your application
db.createCollection('tracks');
db.createCollection('artists');
db.createCollection('albums');
db.createCollection('sessions');
db.createCollection('users');
db.createCollection('user_ranking_lists');

