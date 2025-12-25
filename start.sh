#!/bin/bash
# Startup script for Toden-E application

# Activate Python virtual environment
source .venv/bin/activate

# Navigate to frontend directory and run dev server
cd toden-e-frontend
npm run dev
