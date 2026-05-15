# Use an official base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy files
COPY package*.json ./

# Install dependencies
RUN npm install 

# Copy rest of the app
COPY . .
RUN npx prisma generate


# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start:dev"]