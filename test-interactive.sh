#!/bin/bash

# Test script for interactive Cloi commands
echo "Testing Cloi Interactive Commands"
echo "================================="

# Function to test a command
test_command() {
    local cmd=$1
    local input=$2
    echo -e "\nTesting: $cmd"
    echo "Input: $input"
    echo "$input" | timeout 5s cloi 2>&1 | grep -A 10 "Type a command:" || echo "Command failed or timed out"
}

# Test each interactive command
echo "Testing /help"
test_command "/help" "/help"

echo -e "\n\nTesting /status"
test_command "/status" "/status"

echo -e "\n\nTesting /plugins with list action"
test_command "/plugins list" "/plugins\nlist"

echo -e "\n\nTesting /environment"
test_command "/environment" "/environment"

echo -e "\n\nTesting /session with status action"
test_command "/session status" "/session\nstatus"

echo -e "\n\nTesting /config with show action"
test_command "/config show" "/config\nshow"

echo -e "\n\nTesting /workflow (info only)"
test_command "/workflow" "/workflow\ncancel"

echo -e "\n\nTesting /a2a (info only)"
test_command "/a2a" "/a2a\ncancel"

echo -e "\n\nAll tests completed!"