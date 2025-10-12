from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Base, Barber, Service
import json

def create_sample_data():
    """Create sample barbers and services for testing"""
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if data already exists
        if db.query(Barber).first():
            print("Sample data already exists")
            return
        
        # Sample working hours
        working_hours = json.dumps({
            "monday": "09:00-17:00",
            "tuesday": "09:00-17:00", 
            "wednesday": "09:00-17:00",
            "thursday": "09:00-17:00",
            "friday": "09:00-17:00",
            "saturday": "09:00-15:00",
            "sunday": "closed"
        })
        
        # Create sample barbers
        barber1 = Barber(
            name="Mike Johnson",
            description="Senior barber with 10+ years experience. Specializes in classic cuts and beard styling.",
            working_hours=working_hours
        )
        
        barber2 = Barber(
            name="Sarah Williams", 
            description="Expert in modern styling and hair treatments. Great with all hair types.",
            working_hours=working_hours
        )
        
        barber3 = Barber(
            name="Tony Rodriguez",
            description="Master barber specializing in fades, beard trims, and traditional hot towel shaves.",
            working_hours=working_hours
        )
        
        db.add_all([barber1, barber2, barber3])
        db.commit()
        
        # Create sample services for each barber
        services_data = [
            # Mike Johnson's services
            {"barber": barber1, "name": "Classic Haircut", "description": "Traditional men's haircut with styling", "price": 25.0, "duration": 30},
            {"barber": barber1, "name": "Beard Trim", "description": "Professional beard shaping and trimming", "price": 15.0, "duration": 20},
            {"barber": barber1, "name": "Haircut + Beard Combo", "description": "Complete grooming package", "price": 35.0, "duration": 45},
            {"barber": barber1, "name": "Hot Towel Shave", "description": "Traditional straight razor shave with hot towel", "price": 30.0, "duration": 40},
            
            # Sarah Williams's services  
            {"barber": barber2, "name": "Modern Cut & Style", "description": "Contemporary haircut with modern styling", "price": 30.0, "duration": 35},
            {"barber": barber2, "name": "Hair Wash & Cut", "description": "Shampoo, cut, and blow dry", "price": 35.0, "duration": 45},
            {"barber": barber2, "name": "Styling Only", "description": "Hair styling without cutting", "price": 20.0, "duration": 25},
            {"barber": barber2, "name": "Hair Treatment", "description": "Deep conditioning and scalp treatment", "price": 40.0, "duration": 50},
            
            # Tony Rodriguez's services
            {"barber": barber3, "name": "Fade Cut", "description": "Professional fade haircut (low, mid, or high)", "price": 28.0, "duration": 35},
            {"barber": barber3, "name": "Buzz Cut", "description": "Clean, simple buzz cut", "price": 18.0, "duration": 15},
            {"barber": barber3, "name": "Beard Design", "description": "Creative beard shaping and design", "price": 25.0, "duration": 30},
            {"barber": barber3, "name": "Full Service", "description": "Haircut, beard trim, and hot towel treatment", "price": 45.0, "duration": 60},
        ]
        
        for service_data in services_data:
            service = Service(
                barber_id=service_data["barber"].id,
                name=service_data["name"],
                description=service_data["description"],
                price=service_data["price"],
                duration_minutes=service_data["duration"]
            )
            db.add(service)
        
        db.commit()
        print("Sample data created successfully!")
        
    except Exception as e:
        print(f"Error creating sample data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_data()
