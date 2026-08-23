#!/bin/bash
set -e

echo "Testing Rust API - Register"
curl -s -X POST http://localhost:3002/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com", "password": "password123"}' | jq

echo -e "\nTesting Nest API - Register"
curl -s -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Nest User", "email": "nest@example.com", "password": "password123"}' | jq
