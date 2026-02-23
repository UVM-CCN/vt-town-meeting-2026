#!/usr/bin/env python3
"""
Geocode addresses in Vermont polling places CSV file.
Uses Nominatim (OpenStreetMap) geocoding service with rate limiting.
"""

import pandas as pd
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter
import time
from pathlib import Path

# File paths
INPUT_FILE = "Data/clean-tabula-2025_vermont_election_polling_places.csv"
OUTPUT_FILE = "Data/geocoded_polling_places.csv"

def geocode_addresses():
    """Read CSV, geocode addresses, and save results."""
    
    # Read the input CSV
    print(f"Reading {INPUT_FILE}...")
    df = pd.read_csv(INPUT_FILE)
    
    # Initialize geocoder with a user agent
    print("Initializing geocoder...")
    geolocator = Nominatim(user_agent="vt-town-meeting-geocoder")
    
    # Add rate limiting (1 request per second to be respectful to the service)
    geocode = RateLimiter(geolocator.geocode, min_delay_seconds=1)
    
    # Add columns for lat/lon
    df['latitude'] = None
    df['longitude'] = None
    df['geocode_status'] = None
    
    # Geocode each address
    print(f"Geocoding {len(df)} addresses...")
    for idx, row in df.iterrows():
        address = row['STREET ADDRESS']
        
        if pd.isna(address) or address.strip() == '':
            df.at[idx, 'geocode_status'] = 'no_address'
            print(f"  {idx+1}/{len(df)}: {row['TOWN']} - No address")
            continue
        
        # Add Vermont to the address for better results
        full_address = f"{address}, Vermont"
        
        try:
            location = geocode(full_address)
            
            if location:
                df.at[idx, 'latitude'] = location.latitude
                df.at[idx, 'longitude'] = location.longitude
                df.at[idx, 'geocode_status'] = 'success'
                print(f"  {idx+1}/{len(df)}: {row['TOWN']} - Success ({location.latitude:.4f}, {location.longitude:.4f})")
            else:
                df.at[idx, 'geocode_status'] = 'not_found'
                print(f"  {idx+1}/{len(df)}: {row['TOWN']} - Not found")
                
        except Exception as e:
            df.at[idx, 'geocode_status'] = f'error: {str(e)}'
            print(f"  {idx+1}/{len(df)}: {row['TOWN']} - Error: {e}")
    
    # Save results
    print(f"\nSaving results to {OUTPUT_FILE}...")
    df.to_csv(OUTPUT_FILE, index=False)
    
    # Print summary
    success_count = (df['geocode_status'] == 'success').sum()
    not_found_count = (df['geocode_status'] == 'not_found').sum()
    no_address_count = (df['geocode_status'] == 'no_address').sum()
    error_count = len(df) - success_count - not_found_count - no_address_count
    
    print("\n" + "="*60)
    print("GEOCODING SUMMARY")
    print("="*60)
    print(f"Total addresses: {len(df)}")
    print(f"Successfully geocoded: {success_count}")
    print(f"Not found: {not_found_count}")
    print(f"No address provided: {no_address_count}")
    print(f"Errors: {error_count}")
    print("="*60)

if __name__ == "__main__":
    geocode_addresses()
