# Use Node.js 22.5.1 as specified in .nvmrc
FROM node:22.5.1-alpine AS base

# Install dependencies needed for node-gyp and native modules
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Install dependencies
RUN yarn install --immutable

# Development stage
FROM base AS development
COPY . .
EXPOSE 3000
CMD ["yarn", "dev"]

# Build stage
FROM base AS build
COPY . .
RUN yarn build

# Production stage
FROM node:22.5.1-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Install only production dependencies
ENV NODE_ENV=production
RUN yarn install --immutable && yarn cache clean

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/lexicons ./lexicons
COPY --from=build /app/knexfile.js ./

# Copy views and static files to the locations expected by the compiled code
COPY --from=build /app/dist/views ./views
COPY --from=build /app/dist/static ./static

# Change ownership to app user
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "http.get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
