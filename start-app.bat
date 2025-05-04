@echo off
REM Start the application with the correct API server

echo Starting Meal Planner with Express Recipe Server...
echo ------------------------------------------------

REM Make sure the express-recipe-server has the correct dependencies
echo Checking express-recipe-server dependencies...
cd express-recipe-server
npm list tesseract.js >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Installing tesseract.js...
  npm install tesseract.js
)

REM Create uploads directory if it doesn't exist
if not exist uploads (
  echo Creating uploads directory...
  mkdir uploads
)

REM Start the Express Recipe Server in a new window
echo Starting Express Recipe Server...
start cmd /k "npm start"

REM Wait for the API to start
echo Waiting for API server to start...
timeout /t 5

REM Start the React app in a new window
cd ..
echo Starting React application...
start cmd /k "npm start"

echo.
echo Both servers are now running.
echo API server is running at http://localhost:3001
echo React app is running at http://localhost:3000
echo.
echo Testing tips:
echo  - To test recipe search: Enter ingredients like 'tomato, pasta' in Recipe Ideas
echo  - To test recipe details: Click on any recipe card
echo  - To test pantry: Go to My Pantry page and try Add Item
echo  - To test receipt scanning: Upload a clear receipt image in JPG format
echo.
echo Close the command windows to stop the servers.
