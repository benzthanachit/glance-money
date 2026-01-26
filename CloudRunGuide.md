# Deploy to Google Cloud Run (via Artifact Registry)

This guide walks you through deploying the `glance-money` app to Cloud Run using Google Artifact Registry.

## Prerequisites

1.  **Google Cloud SDK**: Install the [gcloud CLI](https://cloud.google.com/sdk/docs/install).
2.  **Google Cloud Project**: You need an active GCP project with billing enabled.

## Step 1: Initialize gcloud

Open **PowerShell** and log in:

```powershell
gcloud auth login
gcloud config set project [YOUR_PROJECT_ID]
```

*Replace `[YOUR_PROJECT_ID]` with your actual project ID (not the name).*

## Step 2: Setup Artifact Registry

1.  **Enable APIs**:
    ```powershell
    gcloud services enable artifactregistry.googleapis.com run.googleapis.com
    ```

2.  **Create a Repository**:
    Create a Docker repository named `glance-money-repo` in the `asia-southeast1` region (or your preferred region).
    ```powershell
    gcloud artifacts repositories create glance-money-repo --repository-format=docker --location=asia-southeast1 --description="Docker repository for Glance Money"
    ```

3.  **Configure Docker Auth**:
    Configure Docker to authenticate with your region.
    ```powershell
    gcloud auth configure-docker asia-southeast1-docker.pkg.dev
    ```

## Step 3: Build and Push Image

1.  **Tag the Image**:
    Format: `[LOCATION]-docker.pkg.dev/[PROJECT-ID]/[REPO-NAME]/[IMAGE-NAME]:[TAG]`
    
    *Replace `[PROJECT-ID]` with your actual project ID.*
    
    ```powershell
    docker build -t asia-southeast1-docker.pkg.dev/[PROJECT-ID]/glance-money-repo/glance-money:latest .
    ```

2.  **Push the Image**:
    ```powershell
    docker push asia-southeast1-docker.pkg.dev/[PROJECT-ID]/glance-money-repo/glance-money:latest
    ```

## Step 4: Deploy to Cloud Run

Deploy the service using the pushed image. You will need to set your environment variables here.

```powershell
gcloud run deploy glance-money-service `
  --image asia-southeast1-docker.pkg.dev/[PROJECT-ID]/glance-money-repo/glance-money:latest `
  --region asia-southeast1 `
  --allow-unauthenticated `
  --set-env-vars NEXT_PUBLIC_SUPABASE_URL="[YOUR_SUPABASE_URL]",NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR_ANON_KEY]"
```

*   **Note**: For sensitive keys like `SUPABASE_SERVICE_ROLE_KEY`, it is better to use [Secret Manager](https://cloud.google.com/secret-manager/docs), but `--set-env-vars` works for quick testing.
*   The backtick (`` ` ``) is the line continuation character in PowerShell.

## Step 5: Verification

After successful deployment, `gcloud` will output a **Service URL**. Click it to verify your running application.
