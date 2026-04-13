# Docker Documentation

This project provides multiple Docker configurations to suit different environments and resource constraints.

## Dockerfile Variants

| Filename | Purpose | Best For |
| :------- | :------ | :------- |
| `main.Dockerfile` | Standard build with full dependencies. | Production, General use. |
| `main-tiny.Dockerfile` | Optimized for size using `tiny.en` Whisper model and quantized Kokoro. | Low-resource environments. |
| `main-cuda.Dockerfile` | GPU-accelerated build for faster rendering and AI processing. | Servers with NVIDIA GPUs. |

## Quick Start

The easiest way to run the project is using Docker Compose.

### 1. Prerequisites
- Docker and Docker Compose installed.
- A valid `.env` file with at least `PEXELS_API_KEY`.

### 2. Build and Run
You can use the convenience scripts defined in `package.json`:

```bash
# Build the images
npm run docker:build

# Start the services in the background
npm run docker:up
```

Alternatively, use standard docker commands:
```bash
docker compose up --build -d
```

### 3. Monitoring
Check the logs to ensure everything is running correctly:
```bash
docker compose logs -f
```

### 4. Stopping
```bash
npm run docker:down
```

## Persistent Data
- **Host Data**: The application data and videos are persisted in the `./data` directory on your host machine.
- **Caches**: Puppeteer and HuggingFace caches are stored within `./data/cache` to avoid re-downloading models and browser binaries on every restart.

## Advanced Configuration

### Using Different Flavors
To use the `tiny` or `cuda` flavor, edit the `dockerfile` path in `docker-compose.yml`:

```yaml
  short-creator:
    build:
      context: .
      dockerfile: main-tiny.Dockerfile # Change here
```

### External Services
- **Redis**: Included in the compose stack.
- **LLM/Ollama**: Currently expects an Ollama instance running on the host at `http://host.docker.internal:12434`. You can change this in your `.env` file.
