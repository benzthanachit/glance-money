# Deploying Glance Money to Google Cloud Run

This guide walks you through deploying the Glance Money web application to Google Cloud Run using Docker.

## Prerequisites

Before you begin, ensure you have:

1. **Google Cloud Account**: Active Google Cloud Platform account with billing enabled
2. **Google Cloud CLI**: Install the [gcloud CLI](https://cloud.google.com/sdk/docs/install)
3. **Docker**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
4. **Supabase Project**: Set up your Supabase project with the required database schema

## Step 1: Set Up Google Cloud Project

1. **Create a new project** (or use existing):
   ```bash
   gcloud projects create glance-money-app --name="Glance Money"
   ```

2. **Set the project as default**:
   ```bash
   gcloud config set project glance-money-app
   ```

3. **Enable required APIs**:
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

4. **Set up authentication**:
   ```bash
   gcloud auth login
   gcloud auth configure-docker
   ```

## Step 2: Prepare Environment Variables

1. **Create a `.env.production` file** in the project root:
   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

2. **Get your Supabase credentials**:
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Go to Settings > API
   - Copy the Project URL and anon/public key
   - Copy the service_role key (keep this secure!)

## Step 3: Build and Deploy

### Option A: Using Cloud Build (Recommended)

1. **Create a `cloudbuild.yaml` file**:
   ```yaml
   steps:
     # Build the container image
     - name: 'gcr.io/cloud-builders/docker'
       args: [
         'build',
         '--build-arg', 'NEXT_PUBLIC_SUPABASE_URL=${_SUPABASE_URL}',
         '--build-arg', 'NEXT_PUBLIC_SUPABASE_ANON_KEY=${_SUPABASE_ANON_KEY}',
         '--build-arg', 'SUPABASE_SERVICE_ROLE_KEY=${_SUPABASE_SERVICE_KEY}',
         '-t', 'gcr.io/$PROJECT_ID/glance-money:$BUILD_ID',
         '.'
       ]
     # Push the container image to Container Registry
     - name: 'gcr.io/cloud-builders/docker'
       args: ['push', 'gcr.io/$PROJECT_ID/glance-money:$BUILD_ID']
     # Deploy container image to Cloud Run
     - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
       entrypoint: gcloud
       args: [
         'run', 'deploy', 'glance-money',
         '--image', 'gcr.io/$PROJECT_ID/glance-money:$BUILD_ID',
         '--region', 'us-central1',
         '--platform', 'managed',
         '--allow-unauthenticated',
         '--port', '3000',
         '--memory', '1Gi',
         '--cpu', '1',
         '--min-instances', '0',
         '--max-instances', '10',
         '--set-env-vars', 'NODE_ENV=production'
       ]

   images:
     - gcr.io/$PROJECT_ID/glance-money:$BUILD_ID

   substitutions:
     _SUPABASE_URL: 'your_supabase_url_here'
     _SUPABASE_ANON_KEY: 'your_supabase_anon_key_here'
     _SUPABASE_SERVICE_KEY: 'your_supabase_service_role_key_here'
   ```

2. **Deploy using Cloud Build**:
   ```bash
   gcloud builds submit --config cloudbuild.yaml \
     --substitutions=_SUPABASE_URL="your_supabase_url",_SUPABASE_ANON_KEY="your_anon_key",_SUPABASE_SERVICE_KEY="your_service_key"
   ```

### Option B: Manual Docker Build and Deploy

1. **Build the Docker image**:
   ```bash
   docker build \
     --build-arg NEXT_PUBLIC_SUPABASE_URL="your_supabase_url" \
     --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key" \
     --build-arg SUPABASE_SERVICE_ROLE_KEY="your_service_key" \
     -t asia-southeast1-docker.pkg.dev/ai-inventory-optimizer-sme/glance-money-repo/glance-money .
   ```

2. **Push to Google Container Registry**:
   ```bash
   docker push asia-southeast1-docker.pkg.dev/ai-inventory-optimizer-sme/glance-money-repo/glance-money
   ```

3. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy glance-money \
     --image asia-southeast1-docker.pkg.dev/your-project-id/glance-money-repo/glance-money \
     --region asia-southeast1 \
     --platform managed \
     --allow-unauthenticated \
     --port 3000 \
     --memory 1Gi \
     --cpu 1 \
     --min-instances 0 \
     --max-instances 10
   ```

## Step 4: Configure Custom Domain (Optional)

1. **Map your domain**:
   ```bash
   gcloud run domain-mappings create \
     --service glance-money \
     --domain your-domain.com \
     --region us-central1
   ```

2. **Update DNS records** as instructed by the output.

## Step 5: Set Up HTTPS and Security

Cloud Run automatically provides HTTPS, but you can enhance security:

1. **Enable Cloud Armor** (for DDoS protection):
   ```bash
   gcloud compute security-policies create glance-money-policy \
     --description "Security policy for Glance Money"
   ```

2. **Configure IAM** for restricted access if needed:
   ```bash
   gcloud run services add-iam-policy-binding glance-money \
     --member="allUsers" \
     --role="roles/run.invoker" \
     --region us-central1
   ```

## Environment Variables Management

For production, consider using Google Secret Manager:

1. **Create secrets**:
   ```bash
   echo "your_supabase_url" | gcloud secrets create supabase-url --data-file=-
   echo "your_anon_key" | gcloud secrets create supabase-anon-key --data-file=-
   echo "your_service_key" | gcloud secrets create supabase-service-key --data-file=-
   ```

2. **Update Cloud Run service** to use secrets:
   ```bash
   gcloud run services update glance-money \
     --update-secrets NEXT_PUBLIC_SUPABASE_URL=supabase-url:latest \
     --update-secrets NEXT_PUBLIC_SUPABASE_ANON_KEY=supabase-anon-key:latest \
     --update-secrets SUPABASE_SERVICE_ROLE_KEY=supabase-service-key:latest \
     --region us-central1
   ```

## Monitoring and Logging

1. **View logs**:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=glance-money" --limit 50
   ```

2. **Set up monitoring** in the Google Cloud Console:
   - Go to Cloud Run > glance-money > Metrics
   - Set up alerting policies for errors, latency, etc.

## Troubleshooting

### Common Issues:

1. **Build fails with environment variables**:
   - Ensure all required environment variables are properly set
   - Check that Supabase credentials are correct

2. **Service won't start**:
   - Check logs: `gcloud logs read "resource.type=cloud_run_revision"`
   - Verify port 3000 is exposed correctly

3. **Database connection issues**:
   - Ensure Supabase project is accessible from Cloud Run
   - Check RLS (Row Level Security) policies in Supabase

4. **Memory or CPU issues**:
   - Increase memory allocation: `--memory 2Gi`
   - Increase CPU: `--cpu 2`

### Performance Optimization:

1. **Enable Cloud CDN**:
   ```bash
   gcloud compute backend-services create glance-money-backend \
     --global \
     --enable-cdn
   ```

2. **Configure caching headers** (already included in next.config.ts)

3. **Monitor performance** using Cloud Monitoring

## Cost Optimization

- **Set minimum instances to 0** for cost savings during low traffic
- **Use appropriate CPU and memory** allocations
- **Monitor usage** in Cloud Console billing section
- **Set up budget alerts** to avoid unexpected charges

## Security Best Practices

1. **Use Secret Manager** for sensitive environment variables
2. **Enable Cloud Armor** for DDoS protection
3. **Configure proper CORS** in your Supabase project
4. **Regular security updates** by rebuilding and redeploying
5. **Monitor access logs** for suspicious activity

## Continuous Deployment

Set up automated deployments using Cloud Build triggers:

1. **Connect your repository** to Cloud Build
2. **Create a trigger** for main branch pushes
3. **Use the cloudbuild.yaml** configuration above

Your Glance Money application should now be successfully deployed to Google Cloud Run!

## Support

For issues specific to:
- **Google Cloud Run**: Check [Cloud Run documentation](https://cloud.google.com/run/docs)
- **Supabase**: Check [Supabase documentation](https://supabase.com/docs)
- **Next.js**: Check [Next.js documentation](https://nextjs.org/docs)