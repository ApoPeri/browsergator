#!/usr/bin/env python3
"""
Simple HTTP server to host the browsergator day/night shader visualization.
Run this script and open http://localhost:8000 in your browser.
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

# Set the port
PORT = 8000

# Get the directory where this script is located
SCRIPT_DIR = Path(__file__).parent
os.chdir(SCRIPT_DIR)

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers to allow cross-origin requests
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # Add cache control for development
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        # Custom logging to show the files being served
        print(f"[{self.log_date_time_string()}] {format % args}")

def main():
    try:
        # Create the server
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print(f"🌍 BrowserGator Day/Night Shader Server")
            print(f"📍 Serving directory: {SCRIPT_DIR}")
            print(f"🔗 Open your browser and go to: http://localhost:{PORT}")
            print(f"📄 Main file: http://localhost:{PORT}/index_daynight.html")
            print(f"⏹️  Press Ctrl+C to stop the server")
            print("-" * 50)
            
            # Start the server
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        sys.exit(0)
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} is already in use. Try a different port:")
            print(f"   python server.py --port 8001")
        else:
            print(f"❌ Error starting server: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Check for custom port argument
    if len(sys.argv) > 1:
        if "--port" in sys.argv:
            try:
                port_idx = sys.argv.index("--port") + 1
                if port_idx < len(sys.argv):
                    PORT = int(sys.argv[port_idx])
            except (ValueError, IndexError):
                print("⚠️  Invalid port number, using default port 8000")
    
    main()
