#!/usr/bin/env python3
"""Tiny CORS-enabled sink: the browser POSTs rendered frames/audio, we write bytes."""
import os, sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

OUT = sys.argv[2] if len(sys.argv) > 2 else "/tmp/frames"
os.makedirs(OUT, exist_ok=True)


class H(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        # path is the filename, e.g. /f_000123.jpg
        name = os.path.basename(self.path.lstrip("/")) or "frame.bin"
        n = int(self.headers.get("Content-Length", 0))
        data = self.rfile.read(n)
        with open(os.path.join(OUT, name), "wb") as fh:
            fh.write(data)
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"ok")

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8998
    print(f"framesink :{port} -> {OUT}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", port), H).serve_forever()
