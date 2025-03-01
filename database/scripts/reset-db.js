db = db.getSiblingDB('tunedIn');
db.tracks.drop()
db.artists.drop()
db.albums.drop()
db.rankings.drop()
db.sessions.drop()
db.users.drop()
db.user_ranking_lists.drop()

db.createCollection('artists');
db.createCollection('albums'); 
db.createCollection('reviews'); 
db.createCollection('sessions'); 
db.createCollection('users'); 
db.createCollection('user_ranking_lists'); 