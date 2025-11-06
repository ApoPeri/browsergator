#!/usr/bin/env python3
"""
Update satellite catalog from CelesTrak TLE data.
This script fetches the latest active satellite data and updates the local catalog.
"""

import urllib.request
import urllib.error
import os
import sys
from datetime import datetime
from pathlib import Path

# Configuration
TLE_URL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle"
CATALOG_FILE = "fullcatalog.txt"
BACKUP_FILE = "fullcatalog_backup.txt"

def download_tle_data():
    """Download TLE data from CelesTrak"""
    try:
        print(f"📡 Downloading from: {TLE_URL}")
        
        # Create request with headers
        req = urllib.request.Request(
            TLE_URL,
            headers={
                'User-Agent': 'Mozilla/5.0 (compatible; BrowserGator/1.0; Satellite-Tracker)',
                'Accept': 'text/plain'
            }
        )
        
        with urllib.request.urlopen(req, timeout=30) as response:
            data = response.read().decode('utf-8')
            
        print(f"✅ Successfully downloaded TLE data")
        return data
        
    except urllib.error.URLError as e:
        print(f"❌ Network error: {e}")
        return None
    except Exception as e:
        print(f"❌ Download failed: {e}")
        return None

def parse_tle_data(data):
    """Parse TLE data and count satellites"""
    lines = data.strip().split('\n')
    satellite_count = len([line for line in lines if line.startswith('1 ')])
    return satellite_count, lines

def update_catalog(data):
    """Update the catalog file with new data"""
    try:
        # Create backup if existing file exists
        if os.path.exists(CATALOG_FILE):
            print(f"💾 Creating backup: {BACKUP_FILE}")
            with open(CATALOG_FILE, 'r', encoding='utf-8') as f:
                backup_data = f.read()
            with open(BACKUP_FILE, 'w', encoding='utf-8') as f:
                f.write(backup_data)
        
        # Add header with timestamp and source
        timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
        header = f"""# Satellite Catalog - Active Satellites
# Updated: {timestamp}
# Source: {TLE_URL}
# Format: TLE (Two-Line Elements)
# Satellites: Active spacecraft from CelesTrak

"""
        
        # Write new catalog
        with open(CATALOG_FILE, 'w', encoding='utf-8') as f:
            f.write(header)
            f.write(data)
        
        print(f"✅ Catalog updated: {CATALOG_FILE}")
        
    except Exception as e:
        print(f"❌ Failed to update catalog: {e}")
        return False
    
    return True

def main():
    """Main update function"""
    print("🛰️  BrowserGator Satellite Catalog Updater")
    print("=" * 50)
    
    # Download TLE data
    data = download_tle_data()
    if not data:
        print("❌ Failed to download TLE data")
        sys.exit(1)
    
    # Parse and validate data
    try:
        satellite_count, lines = parse_tle_data(data)
        print(f"📊 Parsed {satellite_count} satellites")
        
        if satellite_count == 0:
            print("⚠️  Warning: No satellites found in data")
            
    except Exception as e:
        print(f"❌ Failed to parse TLE data: {e}")
        sys.exit(1)
    
    # Update catalog
    if update_catalog(data):
        file_size = os.path.getsize(CATALOG_FILE)
        print(f"📦 Catalog size: {file_size:,} bytes")
        print(f"📋 Satellites: {satellite_count:,}")
        print(f"📅 Updated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
        print("\n✨ Catalog update completed successfully!")
        print(f"🌐 Use the catalog in: http://localhost:8000/index_daynight.html")
    else:
        print("❌ Failed to update catalog")
        sys.exit(1)

if __name__ == "__main__":
    main()
