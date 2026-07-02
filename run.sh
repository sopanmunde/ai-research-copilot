#!/bin/bash

if [ ! -d "backend/.venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv backend/.venv
    echo "Installing backend dependencies..."
    backend/.venv/bin/pip install -r backend/requirements.txt
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    if command -v bun &> /dev/null; then
        bun install
    else
        npm install
    fi
    cd ..
fi

cleanup() {
    echo "Stopping all services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

echo "Starting Backend..."
source backend/.venv/bin/activate
python backend/index.py &
BACKEND_PID=$!

echo "Starting Frontend..."
cd frontend
if command -v bun &> /dev/null; then
    bun dev &
else
    npm run dev &
fi
FRONTEND_PID=$!

wait
