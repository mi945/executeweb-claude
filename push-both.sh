#!/bin/bash
# Helper script to push to both remotes

echo "📤 Pushing to Vibecode (origin)..."
git push origin main

echo "📤 Pushing to GitHub..."
git push github main

echo "✅ Successfully pushed to both remotes!"
