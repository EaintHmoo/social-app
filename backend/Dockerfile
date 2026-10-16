FROM node:22-slim

WORKDIR /app

# The Prisma CLI's migration engine (migrate, status, studio) is a native binary that links against
# OpenSSL, which the slim image leaves out. Without it Prisma guesses a version and warns on every
# command. --no-install-recommends + clearing the apt lists keeps the layer small.
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Laravel: this is composer.json/composer.lock copied before the rest of the code.
# Dependencies change rarely, so Docker can reuse this layer's cache on most rebuilds.
# The Prisma schema comes along too: `npm ci` runs the postinstall script, which generates the
# Prisma client from it.
COPY package*.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

COPY . .

EXPOSE 3000

# -L (legacy watch = polling) — file change events from a macOS/Windows bind mount
# do not reach the Linux container, so nodemon has to poll to see your edits.
# nodemon.json runs src/server.ts through tsx, so no build step is needed in development.
# `prisma migrate deploy` first applies any migrations not yet run (Laravel: `php artisan migrate --force`).
CMD ["sh", "-c", "npx prisma migrate deploy && npx nodemon -L"]
