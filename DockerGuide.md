# Docker Deployment Guide for Windows

This guide explains how to build and run the `glance-money` application using Docker on Windows.

## Prerequisites

1.  **Install Docker Desktop**:
    *   Download from [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/).
    *   During installation, ensure the **WSL 2** (Windows Subsystem for Linux) backend is selected for better performance.

2.  **Start Docker**:
    *   Open "Docker Desktop" from your Start menu and wait for the engine to start.

## Deployment Steps

Open a terminal (PowerShell, Command Prompt, or VS Code Terminal) in the project root directory.

### 1. Build the Docker Image

Run the following command to build the image. This may take a few minutes the first time.

```powershell
docker build -t glance-money .
```

*   `-t glance-money`: Tags the image with the name "glance-money".
*   `.`: Specifies the current directory as the build context.

### 2. Run the Container

Once the build is complete, start the container:

```powershell
docker run -p 3000:3000 --env-file .env.local glance-money
```

*   `-p 3000:3000`: Maps port 3000 on your Windows machine to port 3000 in the container.
*   `--env-file .env.local`: Injects your local environment variables into the container. **Make sure you have a `.env.local` file with your Supabase keys.**

### 3. Access the Application

Open your web browser and navigate to:

[http://localhost:3000](http://localhost:3000)

## Troubleshooting

*   **"exec user process caused: no such file or directory"**: This usually happens if line endings in `package.json` or scripts are CRLF instead of LF.
    *   *Fix*: The `.dockerignore` file we added prevents local Windows files (like `node_modules`) from conflicting with the Linux container. Re-build with `docker build --no-cache -t glance-money .`.
*   **Port already in use**: If port 3000 is taken, run on a different port (e.g., 3001):
    ```powershell
    docker run -p 3001:3000 --env-file .env.local glance-money
    ```
