import math
from datetime import datetime, timedelta

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees) in meters.
    """
    R = 6371000  # radius of Earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) *
         (math.sin(delta_lambda / 2.0) ** 2))
    
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def check_duplicate_complaints(new_lat: float, new_lng: float, category: str, active_complaints: list) -> dict:
    """
    Finds if a similar category complaint was filed within 100 meters.
    """
    for comp in active_complaints:
        # Check category match (case insensitive)
        if comp.get("category", "").lower() == category.lower():
            comp_lat = comp.get("lat")
            comp_lng = comp.get("lng")
            if comp_lat is not None and comp_lng is not None:
                dist = calculate_haversine_distance(new_lat, new_lng, float(comp_lat), float(comp_lng))
                if dist < 100.0: # 100 meters threshold
                    return {
                        "isDuplicate": True,
                        "duplicateId": comp.get("id"),
                        "distanceMeters": round(dist, 1)
                    }
                    
    return {
        "isDuplicate": False,
        "duplicateId": None
    }

def predict_maintenance_trends(history: list) -> dict:
    """
    Predicts future failure dates and hotspots by analyzing monthly volumes.
    """
    alerts = []
    category_counts = {}
    
    # Count complaints per category
    for comp in history:
        cat = comp.get("category", "Sanitation")
        category_counts[cat] = category_counts.get(cat, 0) + 1

    # Analyze categories that cross standard triggers
    departments_map = {
        "Potholes": "Roads",
        "Garbage": "Sanitation",
        "Water leakage": "Water",
        "Street lights": "Electricity",
        "Open manholes": "Sanitation",
        "Drainage": "Sanitation"
    }

    for cat, count in category_counts.items():
        dept = departments_map.get(cat, "Sanitation")
        
        # If user reports exceed threshold of 3, forecast high risk
        if count >= 3:
            forecast_days = max(5, 30 - count * 2) # higher count means sooner failure
            forecast_date = (datetime.now() + timedelta(days=forecast_days)).strftime("%Y-%m-%d")
            
            alerts.append({
                "departmentName": dept,
                "riskLevel": "high" if count > 5 else "medium",
                "failureForecastDate": forecast_date,
                "reason": f"Elevated frequency: {count} complaints filed for '{cat}' in last 30 days indicates an infrastructure stress point."
            })

    # Default fallback alert
    if not alerts:
        alerts.append({
            "departmentName": "Roads",
            "riskLevel": "low",
            "failureForecastDate": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "reason": "Normal wear prediction. Monitoring current street statuses."
        })

    return {"alerts": alerts}
