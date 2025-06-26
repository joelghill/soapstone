# Docker Setup Guide

This guide explains how to run the Soapstone application using Docker for both development and production environments.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB of available RAM
- At least 5GB of available disk space

## Quick Start (Development)

1. **Clone and navigate to the project:**
   ```bash
   git clone <repository-url>
   cd soapstone
   ```

2. **Start the development environment:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   - Application: http://localhost:3000
   - Database: localhost:5432
   - pgAdmin (optional): http://localhost:5050 (admin@example.com / admin)

4. **View logs:**
   ```bash
   docker-compose logs -f app
   ```

## Development Environment

### Services Included

- **app**: The main Soapstone application running in development mode with hot reload
- **postgres**: PostgreSQL 15 database with persistent data storage
- **pgadmin**: Web-based PostgreSQL administration tool (optional)

### Environment Variables

The development environment uses these default values:

```env
NODE_ENV=development
HOST=0.0.0.0
PORT=3000
PUBLIC_URL=http://localhost:3000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=soapstone
DB_USER=postgres
DB_PASSWORD=postgres
COOKIE_SECRET=development-secret-key-change-in-production
```

### Useful Commands

```bash
# Start all services
docker-compose up -d

# Start with pgAdmin
docker-compose --profile tools up -d

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v

# View logs
docker-compose logs -f app
docker-compose logs -f postgres

# Execute commands in containers
docker-compose exec app yarn migrate
docker-compose exec app yarn db:check
docker-compose exec postgres psql -U postgres -d soapstone

# Rebuild the application
docker-compose build app
docker-compose up -d app
```

## Production Environment

### Setup

1. **Create production environment file:**
   ```bash
   cp .env.production.example .env.production
   ```

2. **Edit `.env.production` with your values:**
   ```env
   PUBLIC_URL=https://your-domain.com
   DB_PASSWORD=your-secure-database-password
   COOKIE_SECRET=your-32-character-secret-key-here
   ```

3. **Deploy with production compose file:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Production Features

- **Multi-stage build**: Optimized image size with only production dependencies
- **Security**: Non-root user, minimal attack surface
- **Health checks**: Automatic container health monitoring
- **Resource limits**: CPU and memory constraints
- **Restart policies**: Automatic restart on failure
- **Network isolation**: Dedicated Docker network

### SSL/TLS Setup (Optional)

To enable HTTPS with Nginx reverse proxy:

1. **Create SSL certificates:**
   ```bash
   mkdir ssl
   # Add your SSL certificate files to the ssl/ directory
   ```

2. **Create nginx.conf:**
   ```nginx
   events {
       worker_connections 1024;
   }

   http {
       upstream app {
           server app:3000;
       }

       server {
           listen 80;
           server_name your-domain.com;
           return 301 https://$server_name$request_uri;
       }

       server {
           listen 443 ssl;
           server_name your-domain.com;

           ssl_certificate /etc/nginx/ssl/cert.pem;
           ssl_certificate_key /etc/nginx/ssl/key.pem;

           location / {
               proxy_pass http://app;
               proxy_set_header Host $host;
               proxy_set_header X-Real-IP $remote_addr;
               proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
               proxy_set_header X-Forwarded-Proto $scheme;
           }
       }
   }
   ```

3. **Enable Nginx service:**
   ```bash
   docker-compose -f docker-compose.prod.yml --profile nginx up -d
   ```

## Database Management

### Migrations

Database migrations are automatically run when the application starts. To run migrations manually:

```bash
# Development
docker-compose exec app yarn migrate

# Production
docker-compose -f docker-compose.prod.yml exec app node_modules/.bin/knex migrate:latest
```

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres soapstone > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres soapstone < backup.sql
```

### Database Access

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d soapstone

# View database logs
docker-compose logs postgres
```

## Monitoring and Debugging

### Health Checks

The application includes health check endpoints:

- **Application**: `GET /health`
- **Database**: Automatic PostgreSQL health checks

### Logs

```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View specific service logs
docker-compose logs app
docker-compose logs postgres
```

### Container Shell Access

```bash
# Access application container
docker-compose exec app sh

# Access database container
docker-compose exec postgres bash
```

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Change ports in docker-compose.yml if 3000 or 5432 are in use
   ports:
     - "3001:3000"  # Use different host port
   ```

2. **Database connection issues:**
   ```bash
   # Check if database is ready
   docker-compose exec postgres pg_isready -U postgres
   
   # Restart database
   docker-compose restart postgres
   ```

3. **Application won't start:**
   ```bash
   # Check logs
   docker-compose logs app
   
   # Rebuild image
   docker-compose build app --no-cache
   ```

4. **Permission issues:**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

### Performance Optimization

1. **Increase database resources:**
   ```yaml
   # In docker-compose.yml
   postgres:
     deploy:
       resources:
         limits:
           memory: 2G
         reservations:
           memory: 1G
   ```

2. **Enable Docker BuildKit:**
   ```bash
   export DOCKER_BUILDKIT=1
   docker-compose build
   ```

3. **Use volume mounts in development:**
   ```yaml
   volumes:
     - .:/app
     - /app/node_modules  # Exclude node_modules
   ```

## Security Considerations

### Production Security

- Always use strong, unique passwords
- Keep the `COOKIE_SECRET` secure and unique
- Use HTTPS in production
- Regularly update base images
- Monitor container logs for security events
- Use Docker secrets for sensitive data

### Network Security

```yaml
# Restrict database access
postgres:
  networks:
    - internal
  # Remove ports: section to prevent external access
```

## Maintenance

### Updates

```bash
# Update base images
docker-compose pull

# Rebuild with latest changes
docker-compose build --no-cache

# Restart services
docker-compose up -d
```

### Cleanup

```bash
# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove unused containers
docker container prune

# Complete cleanup (⚠️ removes everything)
docker system prune -a
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)