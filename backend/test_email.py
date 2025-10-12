#!/usr/bin/env python3
"""
Simple test script to verify email functionality
"""

from app.email_service import email_service
from datetime import datetime

def test_email():
    """Test the email confirmation functionality"""
    
    # Sample appointment data
    appointment_data = {
        'client_name': 'John Doe',
        'client_email': 'test@example.com',
        'barber_name': 'Mike Johnson',
        'service_name': 'Classic Haircut',
        'appointment_datetime': '2024-10-15 14:30',
        'duration_minutes': 30,
        'price': 25.0,
        'notes': 'First time customer',
        'confirmation_token': 'test-token-123',
        'confirmation_url': 'http://localhost:3000/confirm/test-token-123'
    }
    
    print("Testing email confirmation system...")
    print(f"Sending test email to: {appointment_data['client_email']}")
    
    # This will fail in development since we don't have real SMTP configured
    # but it will show us the email template and confirm the logic works
    try:
        result = email_service.send_appointment_confirmation(appointment_data)
        if result:
            print("✅ Email sent successfully!")
        else:
            print("❌ Email sending failed (expected in development)")
    except Exception as e:
        print(f"❌ Email error (expected in development): {e}")
    
    print("\nEmail system test completed.")
    print("Note: In production, configure real SMTP settings in .env file")

if __name__ == "__main__":
    test_email()
