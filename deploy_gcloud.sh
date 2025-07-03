#!/bin/bash

# Build client app
npm install
npm run build-apps:persistence

# Deploy
gcloud app deploy app.yaml --quiet --no-cache
