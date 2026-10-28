FROM node:22-slim

WORKDIR /app

# Dependencies first so this layer is cached until package*.json changes (same idea as the backend).
COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5173

# --host 0.0.0.0: Vite listens only on localhost by default, which inside a container means
# "reachable from this container only" — the published port would get no answer.
CMD ["npx", "vite", "--host", "0.0.0.0"]
