// Switch to tunedIn database
db = db.getSiblingDB('tunedIn');

// Drop existing collections
db.tracks.drop()
db.artists.drop()
db.albums.drop()
db.rankings.drop()
db.sessions.drop()
db.users.drop()
db.user_ranking_lists.drop()
db.trackReview.drop()

// Create collections
db.createCollection('artists');
db.createCollection('albums'); 
db.createCollection('trackReview');  // Changed from 'reviews' to match your application
db.createCollection('sessions'); 
db.createCollection('users'); 
db.createCollection('user_ranking_lists'); 