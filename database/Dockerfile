FROM mongo:7.0

# Copy the initialization script
COPY ./init-mongo.js /docker-entrypoint-initdb.d/

# MongoDB will automatically run scripts in docker-entrypoint-initdb.d/
# The default CMD is already set to run mongod in the base image 