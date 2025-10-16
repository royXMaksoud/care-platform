#!/bin/bash

# Bash script to test the Data Analysis Service health endpoint

echo -e "\033[36mTesting Data Analysis Service Health Endpoint...\033[0m"
echo -e "\033[36m================================================\033[0m"
echo ""

BASE_URL="http://localhost:6072"

# Test root endpoint
echo -e "\033[33mTesting root endpoint (/)...\033[0m"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "\033[32m✓ Root endpoint is accessible\033[0m"
    echo -e "\033[90mResponse:\033[0m"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
else
    echo -e "\033[31m✗ Root endpoint failed with status code: $http_code\033[0m"
    echo ""
fi

# Test actuator health endpoint
echo -e "\033[33mTesting health endpoint (/actuator/health)...\033[0m"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/actuator/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "\033[32m✓ Health endpoint is accessible\033[0m"
    echo -e "\033[90mResponse:\033[0m"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
    
    status=$(echo "$body" | jq -r '.status' 2>/dev/null)
    if [ "$status" = "UP" ]; then
        echo -e "\033[32m✓ Service is UP and healthy!\033[0m"
    else
        echo -e "\033[33m⚠ Service status: $status\033[0m"
    fi
else
    echo -e "\033[31m✗ Health endpoint failed with status code: $http_code\033[0m"
    echo ""
fi

# Test actuator info endpoint
echo -e "\033[33mTesting info endpoint (/actuator/info)...\033[0m"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/actuator/info")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "\033[32m✓ Info endpoint is accessible\033[0m"
    echo -e "\033[90mResponse:\033[0m"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
else
    echo -e "\033[31m✗ Info endpoint failed with status code: $http_code\033[0m"
    echo ""
fi

echo ""
echo -e "\033[36m================================================\033[0m"
echo -e "\033[36mTest complete!\033[0m"

