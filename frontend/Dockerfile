FROM node:20-alpine
WORKDIR /app
# We do NOT run 'npm install' here because of potential lockfile conflicts across OS.
# Instead, we mount the volume and install at runtime in docker-compose.
EXPOSE 3000
CMD ["npm", "run", "dev"]
