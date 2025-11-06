### Aksharsetu — Volunteer Management Portal

## Project Overview

Aksharsetu is a web application designed to help both on-ground volunteers and NGO admins stay organized and connected.
It provides an easy-to-use platform to manage volunteering sessions, log hours, track activities, and support NGO missions with technical and non-technical features.

## Key Features

# Volunteer Portal

* User-friendly space where volunteers can check in to their sessions, check tasks, log hours, upload reports or photos
* Quick access to important resources volunteers might need

# Admin Dashboard

* Basic control panel for NGO admins to manage sessions and volunteer activities
* View reports, track volunteer participation, and confirm attendance without hassle

# Technology Stack

* Frontend: React.js/HTML/CSS
* Backend: Python (Flask)
* Database: MongoDB
* Authentication: JWT 
* API: RESTful JSON endpoints

## Getting Started

# Prerequisites

* Node.js & npm (for frontend)
* Python 3.x (for backend)
* MongoDB 

# Setup and Run Frontend

cd frontend
npm install
npm start

The frontend app will be available at: [http://localhost:3000](http://localhost:3000)

# Setup and Run Backend

cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt

# For Flask:
export FLASK_APP=app.py
flask run

# OR for Django:
python manage.py runserver

The backend API will be available at: [http://localhost:5000](http://localhost:5000)

# Connecting Frontend and Backend

Ensure the frontend’s API base URL points to the backend address. Usually set in a `.env` file or config:

REACT_APP_API_URL=http://localhost:5000/api

## Team Members
Member 1 - Kritika Nair
Member 2 - Muskan Sahay
Member 3 - Niyati Dave 
Member 4 - Pranami Mishra

This project is licensed under the MIT License. See the LICENSE file for details.

