// Create initial documents
db = db.getSiblingDB('tunedIn');
const tracks = {
    "tracks": {
        "href": "https://api.spotify.com/v1/search?offset=0&limit=5&query=kendrick%20lamar&type=track",
        "items": [
            {
                "id": "6AI3ezQ4o3HUoP6Dhudph3",
                "name": "Not Like Us",
                "uri": "spotify:track:6AI3ezQ4o3HUoP6Dhudph3",
                "href": "https://api.spotify.com/v1/tracks/6AI3ezQ4o3HUoP6Dhudph3",
                "popularity": 92,
                "preview_url": null,
                "explicit": true,
                "artists": [
                    {
                        "id": "2YZyLoL8N0Wb9xBt1NhZWg",
                        "name": "Kendrick Lamar",
                        "uri": "spotify:artist:2YZyLoL8N0Wb9xBt1NhZWg",
                        "href": "https://api.spotify.com/v1/artists/2YZyLoL8N0Wb9xBt1NhZWg",
                        "popularity": null,
                        "genres": null,
                        "images": null
                    }
                ],
                "album": {
                    "id": "5JjnoGJyOxfSZUZtk2rRwZ",
                    "name": "Not Like Us",
                    "uri": "spotify:album:5JjnoGJyOxfSZUZtk2rRwZ",
                    "href": "https://api.spotify.com/v1/albums/5JjnoGJyOxfSZUZtk2rRwZ",
                    "album_type": "single",
                    "release_date": "2024-05-04",
                    "images": [
                        {
                            "url": "https://i.scdn.co/image/ab67616d0000b2731ea0c62b2339cbf493a999ad",
                            "height": 640,
                            "width": 640
                        },
                        {
                            "url": "https://i.scdn.co/image/ab67616d00001e021ea0c62b2339cbf493a999ad",
                            "height": 300,
                            "width": 300
                        },
                        {
                            "url": "https://i.scdn.co/image/ab67616d000048511ea0c62b2339cbf493a999ad",
                            "height": 64,
                            "width": 64
                        }
                    ],
                    "artists": [
                        {
                            "id": "2YZyLoL8N0Wb9xBt1NhZWg",
                            "name": "Kendrick Lamar",
                            "uri": "spotify:artist:2YZyLoL8N0Wb9xBt1NhZWg",
                            "href": "https://api.spotify.com/v1/artists/2YZyLoL8N0Wb9xBt1NhZWg",
                            "popularity": null,
                            "genres": null,
                            "images": null
                        }
                    ]
                }
            },
            {
                "id": "45J4avUb9Ni0bnETYaYFVJ",
                "name": "luther (with sza)",
                "uri": "spotify:track:45J4avUb9Ni0bnETYaYFVJ",
                "href": "https://api.spotify.com/v1/tracks/45J4avUb9Ni0bnETYaYFVJ",
                "popularity": 89,
                "preview_url": null,
                "explicit": false,
                "artists": [
                    {
                        "id": "2YZyLoL8N0Wb9xBt1NhZWg",
                        "name": "Kendrick Lamar",
                        "uri": "spotify:artist:2YZyLoL8N0Wb9xBt1NhZWg",
                        "href": "https://api.spotify.com/v1/artists/2YZyLoL8N0Wb9xBt1NhZWg",
                        "popularity": null,
                        "genres": null,
                        "images": null
                    },
                    {
                        "id": "7tYKF4w9nC0nq9CsPZTHyP",
                        "name": "SZA",
                        "uri": "spotify:artist:7tYKF4w9nC0nq9CsPZTHyP",
                        "href": "https://api.spotify.com/v1/artists/7tYKF4w9nC0nq9CsPZTHyP",
                        "popularity": null,
                        "genres": null,
                        "images": null
                    }
                ],
                "album": {
                    "id": "0hvT3yIEysuuvkK73vgdcW",
                    "name": "GNX",
                    "uri": "spotify:album:0hvT3yIEysuuvkK73vgdcW",
                    "href": "https://api.spotify.com/v1/albums/0hvT3yIEysuuvkK73vgdcW",
                    "album_type": "album",
                    "release_date": "2024-11-22",
                    "images": [
                        {
                            "url": "https://i.scdn.co/image/ab67616d0000b273d9985092cd88bffd97653b58",
                            "height": 640,
                            "width": 640
                        },
                        {
                            "url": "https://i.scdn.co/image/ab67616d00001e02d9985092cd88bffd97653b58",
                            "height": 300,
                            "width": 300
                        },
                        {
                            "url": "https://i.scdn.co/image/ab67616d00004851d9985092cd88bffd97653b58",
                            "height": 64,
                            "width": 64
                        }
                    ],
                    "artists": [
                        {
                            "id": "2YZyLoL8N0Wb9xBt1NhZWg",
                            "name": "Kendrick Lamar",
                            "uri": "spotify:artist:2YZyLoL8N0Wb9xBt1NhZWg",
                            "href": "https://api.spotify.com/v1/artists/2YZyLoL8N0Wb9xBt1NhZWg",
                            "popularity": null,
                            "genres": null,
                            "images": null
                        }
                    ]
                }
            },
            {
                "id": "0aB0v4027ukVziUGwVGYpG",
                "name": "tv off (feat. lefty gunplay)",
                "uri": "spotify:track:0aB0v4027ukVziUGwVGYpG",
                "href": "https://api.spotify.com/v1/tracks/0aB0v4027ukVziUGwVGYpG",
                "popularity": 91,
                "preview_url": null,
                "explicit": true,
                "artists": [
                    {
                        "id": "2YZyLoL8N0Wb9xBt1NhZWg",
                        "name": "Kendrick Lamar",
                        "uri": "spotify:artist:2YZyLoL8N0Wb9xBt1NhZWg",
                        "href": "https://api.spotify.com/v1/artists/2YZyLoL8N0Wb9xBt1NhZWg",
                        "popularity": null,
                        "genres": null,
                        "images": null
                    },
                    {
                        "id": "1jiZvw42D4oquLl24x2VWV",
                        "name": "Lefty Gunplay",
                        "uri": "spotify:artist:1jiZvw42D4oquLl24x2VWV",
                        "href": "https://api.spotify.com/v1/artists/1jiZvw42D4oquLl24x2VWV",
                        "popularity": null,
                        "genres": null,
                        "images": null
                    }
                ],
                "album": {
                    "id": "0hvT3yIEysuuvkK73vgdcW",
                    "name": "GNX",
                    "uri": "spotify:album:0hvT3yIEysuuvkK73vgdcW",
                    "href": "https://api.spotify.com/v1/albums/0hvT3yIEysuuvkK73vgdcW",
                    "album_type": "album",
                    "release_date": "2024-11-22",
                    "images": [
                        {
                            "url": "https://i.scdn.co/image/ab67616d0000b273d9985092cd88bffd97653b58",
                            "height": 640,
                            "width": 640
                        },
                        {
                            "url": "https://i.scdn.co/image/ab67616d00001e02d9985092cd88bffd97653b58",
                            "height": 300,
                            "width": 300
                        },
                        {
                            "url": "https://i.scdn.co/image/ab67616d00004851d9985092cd88bffd97653b58",
                            "height": 64,
                            "width": 64
                        }
                    ],
                    "artists": [
                        {
                            "id": "2YZyLoL8N0Wb9xBt1NhZWg",
                            "name": "Kendrick Lamar",
                            "uri": "spotify:artist:2YZyLoL8N0Wb9xBt1NhZWg",
                            "href": "https://api.spotify.com/v1/artists/2YZyLoL8N0Wb9xBt1NhZWg",
                            "popularity": null,
                            "genres": null,
                            "images": null
                        }
                    ]
                }
            },
            {
                "id": "0nj9Bq5sHDiTxSHunhgkFb",
                "name": "squabble up",
                "uri": "spotify:track:0nj9Bq5sHDiTxSHunhgkFb",
                "href": "https://api.spotify.com/v1/tracks/0nj9Bq5sHDiTxSHunhgkFb",
                "popularity": 87,
                "preview_url": null,
                "explicit": true,
                "artists": [
                    {
                        "id": "2YZyLoL8N0Wb9xBt1NhZWg",
                        "name": "Kendrick Lamar",
                        "uri": "spotify:artist:2YZyLoL8N0Wb9xBt1NhZWg",
                        "href": "https://api.spotify.com/v1/artists/2YZyLoL8N0Wb9xBt1NhZWg",
                        "popularity": null,
                        "genres": null,
                        "images": null
                    }
                ],
                "album": {
                    "id": "0hvT3yIEysuuvkK73vgdcW",
                    "name": "GNX",
                    "uri": "spotify:album:0hvT3yIEysuuvkK73vgdcW",
                    "href": "https://api.spotify.com/v1/albums/0hvT3yIEysuuvkK73vgdcW",
                    "album_type": "album",
                    "release_date": "2024-11-22",
                    "images": [
                        {
                            "url": "https://i.scdn.co/image/ab67616d0000b273d9985092cd88bffd97653b58",
                            "height": 640,
                            "width": 640
                        },
                        {
                            "url": "https://i.scdn.co/image/ab67616d00001e02d9985092cd88bffd97653b58",
                            "height": 300,
                            "width": 300
                        },
                        {
                            "url": "https://i.scdn.co/image/ab67616d00004851d9985092cd88bffd97653b58",
                            "height": 64,
                            "width": 64
                        }
                    ],
                    "artists": [
                        {
                            "id": "2YZyLoL8N0Wb9xBt1NhZWg",
                            "name": "Kendrick Lamar",
                            "uri": "spotify:artist:2YZyLoL8N0Wb9xBt1NhZWg",
                            "href": "https://api.spotify.com/v1/artists/2YZyLoL8N0Wb9xBt1NhZWg",
                            "popularity": null,
                            "genres": null,
                            "images": null
                        }
                    ]
                }
            },
            {
                "id": "5S8VwnB4sLi6W0lYTWYylu",
                "name": "hey now (feat. dody6)",
                "uri": "spotify:track:5S8VwnB4sLi6W0lYTWYylu",
                "href": "https://api.spotify.com/v1/tracks/5S8VwnB4sLi6W0lYTWYylu",
                "popularity": 80,
                "preview_url": null,
                "explicit": true,
                "artists": [
                    {
                        "id": "2YZyLoL8N0Wb9xBt1NhZWg",
                        "name": "Kendrick Lamar",
                        "uri": "spotify:artist:2YZyLoL8N0Wb9xBt1NhZWg",
                        "href": "https://api.spotify.com/v1/artists/2YZyLoL8N0Wb9xBt1NhZWg",
                        "popularity": null,
                        "genres": null,
                        "images": null
                    },
                    {
                        "id": "4VHa48wXlsDA2vWfgIi7cX",
                        "name": "Dody6",
                        "uri": "spotify:artist:4VHa48wXlsDA2vWfgIi7cX",
                        "href": "https://api.spotify.com/v1/artists/4VHa48wXlsDA2vWfgIi7cX",
                        "popularity": null,
                        "genres": null,
                        "images": null
                    }
                ],
                "album": {
                    "id": "0hvT3yIEysuuvkK73vgdcW",
                    "name": "GNX",
                    "uri": "spotify:album:0hvT3yIEysuuvkK73vgdcW",
                    "href": "https://api.spotify.com/v1/albums/0hvT3yIEysuuvkK73vgdcW",
                    "album_type": "album",
                    "release_date": "2024-11-22",
                    "images": [
                        {
                            "url": "https://i.scdn.co/image/ab67616d0000b273d9985092cd88bffd97653b58",
                            "height": 640,
                            "width": 640
                        },
                        {
                            "url": "https://i.scdn.co/image/ab67616d00001e02d9985092cd88bffd97653b58",
                            "height": 300,
                            "width": 300
                        },
                        {
                            "url": "https://i.scdn.co/image/ab67616d00004851d9985092cd88bffd97653b58",
                            "height": 64,
                            "width": 64
                        }
                    ],
                    "artists": [
                        {
                            "id": "2YZyLoL8N0Wb9xBt1NhZWg",
                            "name": "Kendrick Lamar",
                            "uri": "spotify:artist:2YZyLoL8N0Wb9xBt1NhZWg",
                            "href": "https://api.spotify.com/v1/artists/2YZyLoL8N0Wb9xBt1NhZWg",
                            "popularity": null,
                            "genres": null,
                            "images": null
                        }
                    ]
                }
            }
        ],
        "limit": 5,
        "next": "https://api.spotify.com/v1/search?offset=5&limit=5&query=kendrick%20lamar&type=track",
        "offset": 0,
        "previous": null,
        "total": 901
    },
    "artists": null,
    "albums": null,
    "playlists": null
  }
  
db.tracks.insertMany(tracks.tracks.items);