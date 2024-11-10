################################################################################
# Stage 0: Base image
################################################################################
FROM oven/bun AS base

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app

# Copy package.json and lockfile
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile


################################################################################
# Stage 2: dev application
################################################################################
FROM base AS dev
WORKDIR /app
# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl
# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the application
COPY . .

EXPOSE 3000
HEALTHCHECK --interval=3s --timeout=3s --start-period=5s --retries=10 CMD curl -f http://localhost:3000/health || exit 1
