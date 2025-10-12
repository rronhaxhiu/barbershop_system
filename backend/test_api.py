#!/usr/bin/env python3
"""
Basic API tests for the barbershop appointment system
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api"

def test_get_barbers():
    """Test getting all barbers"""
    print("Testing GET /barbers...")
    response = requests.get(f"{BASE_URL}/barbers")
    assert response.status_code == 200
    barbers = response.json()
    assert len(barbers) > 0
    print(f"✅ Found {len(barbers)} barbers")
    return barbers

def test_get_barber_services(barber_id):
    """Test getting services for a specific barber"""
    print(f"Testing GET /barbers/{barber_id}/services...")
    response = requests.get(f"{BASE_URL}/barbers/{barber_id}/services")
    assert response.status_code == 200
    services = response.json()
    assert len(services) > 0
    print(f"✅ Found {len(services)} services for barber {barber_id}")
    return services

def test_create_appointment(barber_id, service_id):
    """Test creating a new appointment"""
    print("Testing POST /appointments...")
    
    # Create appointment data
    appointment_data = {
        "barber_id": barber_id,
        "service_id": service_id,
        "client_name": "API Test User",
        "client_email": "apitest@example.com",
        "client_phone": "555-0123",
        "appointment_datetime": (datetime.now() + timedelta(days=1)).isoformat(),
        "notes": "API test appointment"
    }
    
    response = requests.post(
        f"{BASE_URL}/appointments",
        headers={"Content-Type": "application/json"},
        data=json.dumps(appointment_data)
    )
    
    assert response.status_code == 200
    appointment = response.json()
    assert appointment["status"] == "pending"
    assert "confirmation_token" in appointment
    print(f"✅ Created appointment with ID {appointment['id']}")
    return appointment

def test_confirm_appointment(token):
    """Test confirming an appointment"""
    print(f"Testing GET /appointments/confirm/{token}...")
    response = requests.get(f"{BASE_URL}/appointments/confirm/{token}")
    assert response.status_code == 200
    result = response.json()
    assert "appointment_id" in result
    print(f"✅ Confirmed appointment {result['appointment_id']}")

def test_admin_appointments():
    """Test getting all appointments (admin endpoint)"""
    print("Testing GET /admin/appointments...")
    response = requests.get(f"{BASE_URL}/admin/appointments")
    assert response.status_code == 200
    appointments = response.json()
    print(f"✅ Found {len(appointments)} appointments")
    return appointments

def test_create_barber():
    """Test creating a new barber"""
    print("Testing POST /admin/barbers...")
    
    barber_data = {
        "name": "API Test Barber",
        "description": "Test barber created via API",
        "working_hours": json.dumps({
            "monday": "09:00-17:00",
            "tuesday": "09:00-17:00",
            "wednesday": "09:00-17:00",
            "thursday": "09:00-17:00",
            "friday": "09:00-17:00",
            "saturday": "09:00-15:00",
            "sunday": "closed"
        })
    }
    
    response = requests.post(
        f"{BASE_URL}/admin/barbers",
        headers={"Content-Type": "application/json"},
        data=json.dumps(barber_data)
    )
    
    assert response.status_code == 200
    barber = response.json()
    assert barber["name"] == "API Test Barber"
    print(f"✅ Created barber with ID {barber['id']}")
    return barber

def run_tests():
    """Run all API tests"""
    print("🧪 Starting API tests...\n")
    
    try:
        # Test basic endpoints
        barbers = test_get_barbers()
        services = test_get_barber_services(barbers[0]["id"])
        
        # Test appointment flow
        appointment = test_create_appointment(barbers[0]["id"], services[0]["id"])
        test_confirm_appointment(appointment["confirmation_token"])
        
        # Test admin endpoints
        test_admin_appointments()
        test_create_barber()
        
        print("\n🎉 All tests passed!")
        
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
    except requests.exceptions.ConnectionError:
        print("\n❌ Could not connect to API. Make sure the backend server is running on http://localhost:8000")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")

if __name__ == "__main__":
    run_tests()
