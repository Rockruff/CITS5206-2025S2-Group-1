FROM node:22-slim

RUN apt update
RUN apt install --no-install-recommends -y git python3-venv
RUN apt clean

# Set working directory
WORKDIR /app

# Copy the repository
COPY . .
RUN git clean -xdf

# Install all dependencies (monorepo root)
RUN npm install

# Build frontend
RUN cd frontend && npm run build

# Backend
RUN cd backend && npm run db:migrate

# Expose only the frontend dev server port
EXPOSE 3000

# Default command:
# 1. Start backend in background
# 2. Start frontend (at port 3000)
CMD ["/bin/bash", "-c", "npm run --prefix backend server & npm run --prefix frontend start"]
