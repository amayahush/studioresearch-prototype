"""Local server for the prototype that tells the browser never to cache, so edits show on reload."""
import http.server
import os
import socketserver

PORT = int(os.environ.get("PORT", "4173"))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd:
    print(f"Astra prototype at http://localhost:{PORT}")
    httpd.serve_forever()
