from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_pymongo import PyMongo
import os
import jwt
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from bson.objectid import ObjectId

app = Flask(__name__)

# Configuration
app.config["MONGO_URI"] = os.environ.get("MONGO_URI", "mongodb://localhost:27017/akshar_paaul")
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "akshar_paaul_secret_key")
JWT_SECRET = os.environ.get("JWT_SECRET", "jwt_secret_key")

# Admin credentials from environment
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@akshar.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")

CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

mongo = PyMongo(app)

@app.after_request
def after_request(response):
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
    return response


# ---------- AUTHENTICATION MIDDLEWARE ----------
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            current_user = data
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            
            if data.get('userType') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            current_user = data
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated


# ---------- AUTH ROUTES ----------
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    user_type = data.get('userType', 'volunteer')  # 'admin' or 'volunteer'
    
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
    
    # Admin login
    if user_type == 'admin':
        if email == ADMIN_EMAIL and password == ADMIN_PASSWORD:
            # Generate JWT token
            token = jwt.encode({
                'email': email,
                'userType': 'admin',
                'name': 'Admin User',
                'exp': datetime.utcnow() + timedelta(days=7)
            }, JWT_SECRET, algorithm="HS256")
            
            return jsonify({
                'token': token,
                'userType': 'admin',
                'user': {
                    'email': email,
                    'name': 'Admin User',
                    'userType': 'admin'
                }
            }), 200
        else:
            return jsonify({'error': 'Invalid admin credentials'}), 401
    
    # Volunteer login
    else:
        volunteer = mongo.db.volunteers.find_one({'email': email})
        
        if not volunteer:
            return jsonify({'error': 'Volunteer not found'}), 401
        
        # Check if volunteer has a password field, if not, use email as password (demo)
        stored_password = volunteer.get('password', email)
        
        if password == stored_password:
            # Generate JWT token
            token = jwt.encode({
                'id': str(volunteer['_id']),
                'email': volunteer['email'],
                'userType': 'volunteer',
                'name': volunteer['name'],
                'exp': datetime.utcnow() + timedelta(days=7)
            }, JWT_SECRET, algorithm="HS256")
            
            volunteer['_id'] = str(volunteer['_id'])
            
            return jsonify({
                'token': token,
                'userType': 'volunteer',
                'user': {
                    'id': volunteer['_id'],
                    'email': volunteer['email'],
                    'name': volunteer['name'],
                    'phone': volunteer.get('phone'),
                    'hours': volunteer.get('hours', 0),
                    'status': volunteer.get('status', 'active'),
                    'userType': 'volunteer'
                }
            }), 200
        else:
            return jsonify({'error': 'Invalid password'}), 401


@app.route('/api/auth/logout', methods=['POST'])
@token_required
def logout(current_user):
    # In JWT, logout is handled on the client side by removing the token
    return jsonify({'message': 'Logged out successfully'}), 200


@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Get current logged in user details"""
    return jsonify({'user': current_user}), 200


# ---------- VOLUNTEERS ----------
@app.route('/api/volunteers', methods=['GET'])
@admin_required
def get_volunteers(current_user):
    volunteers = list(mongo.db.volunteers.find())
    for vol in volunteers:
        vol['_id'] = str(vol['_id'])
    return jsonify(volunteers)

@app.route('/api/volunteers', methods=['POST'])
@admin_required
def create_volunteer(current_user):
    new_vol = request.get_json()
    inserted = mongo.db.volunteers.insert_one(new_vol)
    new_vol['_id'] = str(inserted.inserted_id)
    return jsonify(new_vol), 201

@app.route('/api/volunteers/<vol_id>', methods=['PUT'])
@admin_required
def update_volunteer(current_user, vol_id):
    update_data = request.get_json()
    result = mongo.db.volunteers.update_one(
        {"_id": ObjectId(vol_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        return jsonify({"error": "Volunteer not found"}), 404
    
    updated_vol = mongo.db.volunteers.find_one({"_id": ObjectId(vol_id)})
    updated_vol['_id'] = str(updated_vol['_id'])
    return jsonify(updated_vol)

@app.route('/api/volunteers/<vol_id>', methods=['DELETE'])
@admin_required
def delete_volunteer(current_user, vol_id):
    result = mongo.db.volunteers.delete_one({"_id": ObjectId(vol_id)})
    
    if result.deleted_count == 0:
        return jsonify({"error": "Volunteer not found"}), 404
    
    return jsonify({"message": f"Volunteer {vol_id} deleted"})


# ---------- EVENTS ----------
@app.route('/api/events', methods=['GET'])
@token_required
def get_events(current_user):
    events = list(mongo.db.events.find())
    for eve in events:
        eve['_id'] = str(eve['_id'])
    return jsonify(events)

@app.route('/api/events', methods=['POST'])
@admin_required
def create_event(current_user):
    new_event = request.get_json()
    inserted = mongo.db.events.insert_one(new_event)
    new_event['_id'] = str(inserted.inserted_id)
    return jsonify(new_event), 201

@app.route('/api/events/<event_id>', methods=['PUT'])
@admin_required
def update_event(current_user, event_id):
    update_data = request.get_json()
    result = mongo.db.events.update_one(
        {"_id": ObjectId(event_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        return jsonify({"error": "Event not found"}), 404
    
    updated_event = mongo.db.events.find_one({"_id": ObjectId(event_id)})
    updated_event['_id'] = str(updated_event['_id'])
    return jsonify(updated_event)

@app.route('/api/events/<event_id>', methods=['DELETE'])
@admin_required
def delete_event(current_user, event_id):
    result = mongo.db.events.delete_one({"_id": ObjectId(event_id)})
    
    if result.deleted_count == 0:
        return jsonify({"error": "Event not found"}), 404
    
    return jsonify({"message": f"Event {event_id} deleted"})


# ---------- TASKS ----------
@app.route('/api/tasks', methods=['GET'])
@token_required
def get_tasks(current_user):
    tasks = list(mongo.db.tasks.find())
    for tas in tasks:
        tas['_id'] = str(tas['_id'])
    return jsonify(tasks)

@app.route('/api/tasks', methods=['POST'])
@admin_required
def create_task(current_user):
    new_task = request.get_json()
    # Set default status if not provided
    if 'status' not in new_task:
        new_task['status'] = 'pending'
    inserted = mongo.db.tasks.insert_one(new_task)
    new_task['_id'] = str(inserted.inserted_id)
    return jsonify(new_task), 201

@app.route('/api/tasks/<task_id>', methods=['PUT'])
@token_required
def update_task(current_user, task_id):
    update_data = request.get_json()
    result = mongo.db.tasks.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        return jsonify({"error": "Task not found"}), 404
    
    updated_task = mongo.db.tasks.find_one({"_id": ObjectId(task_id)})
    updated_task['_id'] = str(updated_task['_id'])
    return jsonify(updated_task)

@app.route('/api/tasks/<task_id>', methods=['DELETE'])
@admin_required
def delete_task(current_user, task_id):
    result = mongo.db.tasks.delete_one({"_id": ObjectId(task_id)})
    
    if result.deleted_count == 0:
        return jsonify({"error": "Task not found"}), 404
    
    return jsonify({"message": f"Task {task_id} deleted"})


# ---------- ATTENDANCE ----------
@app.route('/api/attendance', methods=['GET'])
@token_required
def get_attendance(current_user):
    attendance = list(mongo.db.attendance.find())
    for attend in attendance:
        attend['_id'] = str(attend['_id'])
    return jsonify(attendance)

@app.route('/api/attendance/bulk', methods=['POST'])
@admin_required
def create_bulk_attendance(current_user):
    data = request.get_json()
    records = data.get('records', [])
    
    if not records:
        return jsonify({"error": "No records provided"}), 400
    
    # Insert attendance records
    result = mongo.db.attendance.insert_many(records)
    
    # Update volunteer hours
    for record in records:
        if record.get('status') == 'present' and record.get('hours', 0) > 0:
            mongo.db.volunteers.update_one(
                {"_id": ObjectId(record['volunteerId'])},
                {"$inc": {"hours": record['hours']}}
            )
    
    inserted_ids = [str(_id) for _id in result.inserted_ids]
    
    return jsonify({
        "message": "Attendance added",
        "inserted_ids": inserted_ids
    }), 201


@app.route('/test_mongo')
def test_mongo():
    try:
        mongo.db.command('ping')
        return "MongoDB Atlas connection successful!"
    except Exception as e:
        return str(e)


@app.route('/')
def index():
    return jsonify({
        'message': 'Akshar Paaul API is running!',
        'version': '2.0 with Authentication',
        'endpoints': {
            'login': '/api/auth/login',
            'logout': '/api/auth/logout',
            'volunteers': '/api/volunteers',
            'events': '/api/events',
            'tasks': '/api/tasks',
            'attendance': '/api/attendance'
        }
    })


if __name__ == '__main__':
    app.run(debug=True)