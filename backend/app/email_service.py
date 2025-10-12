import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template
from typing import Optional
import logging

from app.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_host = settings.smtp_host
        self.smtp_port = settings.smtp_port
        self.smtp_user = settings.smtp_user
        self.smtp_password = settings.smtp_password
        self.from_email = settings.from_email

    def send_email(self, to_email: str, subject: str, html_content: str, text_content: Optional[str] = None) -> bool:
        """Send an email using SMTP"""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = to_email

            # Add text content if provided
            if text_content:
                text_part = MIMEText(text_content, 'plain')
                msg.attach(text_part)

            # Add HTML content
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)

            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)

            logger.info(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False

    def send_appointment_confirmation(self, appointment_data: dict) -> bool:
        """Send appointment confirmation email"""
        confirmation_url = f"{settings.frontend_url}/confirm/{appointment_data['confirmation_token']}"
        
        html_template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Appointment Confirmation</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .appointment-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
                .confirm-button { 
                    display: inline-block; 
                    background-color: #3498db; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    margin: 20px 0; 
                }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>💈 Barbershop Appointment</h1>
                </div>
                <div class="content">
                    <h2>Hello {{ client_name }}!</h2>
                    <p>Thank you for booking an appointment with us. Please confirm your appointment by clicking the button below:</p>
                    
                    <div class="appointment-details">
                        <h3>Appointment Details:</h3>
                        <p><strong>Barber:</strong> {{ barber_name }}</p>
                        <p><strong>Service:</strong> {{ service_name }}</p>
                        <p><strong>Date & Time:</strong> {{ appointment_datetime }}</p>
                        <p><strong>Duration:</strong> {{ duration_minutes }} minutes</p>
                        <p><strong>Price:</strong> ${{ price }}</p>
                        {% if notes %}
                        <p><strong>Notes:</strong> {{ notes }}</p>
                        {% endif %}
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="{{ confirmation_url }}" class="confirm-button">Confirm Appointment</a>
                    </div>
                    
                    <p><strong>Important:</strong> Your appointment is not confirmed until you click the confirmation link above.</p>
                    
                    <p>If you cannot click the button, copy and paste this link into your browser:</p>
                    <p>{{ confirmation_url }}</p>
                </div>
                <div class="footer">
                    <p>If you didn't book this appointment, please ignore this email.</p>
                    <p>© 2024 Barbershop Appointment System</p>
                </div>
            </div>
        </body>
        </html>
        """)

        text_template = Template("""
        Barbershop Appointment Confirmation
        
        Hello {{ client_name }}!
        
        Thank you for booking an appointment with us. Please confirm your appointment by visiting:
        {{ confirmation_url }}
        
        Appointment Details:
        - Barber: {{ barber_name }}
        - Service: {{ service_name }}
        - Date & Time: {{ appointment_datetime }}
        - Duration: {{ duration_minutes }} minutes
        - Price: ${{ price }}
        {% if notes %}- Notes: {{ notes }}{% endif %}
        
        Important: Your appointment is not confirmed until you click the confirmation link above.
        
        If you didn't book this appointment, please ignore this email.
        """)

        html_content = html_template.render(**appointment_data)
        text_content = text_template.render(**appointment_data)

        return self.send_email(
            to_email=appointment_data['client_email'],
            subject="Confirm Your Barbershop Appointment",
            html_content=html_content,
            text_content=text_content
        )

# Create email service instance
email_service = EmailService()
