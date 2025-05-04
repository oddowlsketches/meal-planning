#!/bin/bash
# run-test.sh - Run the API verification test

echo "Running API verification test..."
node verify-env-api.js
exit_code=$?

if [ $exit_code -eq 0 ]; then
  echo "Test completed successfully."
else
  echo "Test failed with exit code $exit_code"
fi
