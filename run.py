#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
桥见川渝 · 本地 AI 代理（零第三方依赖，Python 标准库）

作用：
  1. 把当前目录作为静态网站 serve 出来（浏览器打开 http://localhost:8000）
  2. 代理 POST /api/ai 请求到 DeepSeek，key 只存在本机、绝不下发到浏览器

用法：
  1. 把 DeepSeek API key 填入同目录 key.txt（第一行）
  2. 双击 run-ai.bat（或命令行执行 python run.py）
  3. 浏览器打开 http://localhost:8000

没填 key 时网站也能跑「兜底模式」（词典识别 + 免费机翻），只是没有 AI 改稿。
"""

import json
import os
import sys
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler, HTTPServer

HOST = "127.0.0.1"
PORT = 8000
AUTH_PASSWORD = "77522"
DEEPSEEK_URL = "https://api.deepseek.com/chat/completions"
ROOT = os.path.dirname(os.path.abspath(__file__))

# Windows 控制台可能用 GBK，统一 UTF-8 输出避免报错
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


def load_key():
    p = os.path.join(ROOT, "key.txt")
    if os.path.exists(p):
        try:
            with open(p, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        return line
        except Exception:
            pass
    return ""


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")

    def _json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path.startswith("/api/ai/health"):
            self._json(200, {"ok": True, "service": "qiaojian-ai"})
            return
        self._serve_static()

    def do_POST(self):
        if self.path == "/api/ai":
            self._handle_ai()
            return
        self._json(404, {"ok": False, "error": "not found"})

    def _handle_ai(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception:
            self._json(400, {"ok": False, "error": "请求体解析失败"})
            return

        if payload.get("password") != AUTH_PASSWORD:
            self._json(403, {"ok": False, "error": "访问密码错误"})
            return

        key = payload.get("key") or load_key()
        if not key:
            self._json(500, {"ok": False, "error": "未填写 DeepSeek API key"})
            return

        body = {
            "model": payload.get("model", "deepseek-v4-flash"),
            "messages": payload.get("messages", []),
            "temperature": payload.get("temperature", 0.3),
            "response_format": {"type": "json_object"},
            "stream": False,
        }
        req = urllib.request.Request(
            DEEPSEEK_URL,
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer " + key,
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            content = data["choices"][0]["message"]["content"]
            self._json(200, {"ok": True, "content": content})
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8", errors="ignore")
            self._json(e.code, {"ok": False, "error": "DeepSeek error: " + err[:300]})
        except Exception as e:
            self._json(500, {"ok": False, "error": "call failed: " + str(e)})

    def _serve_static(self):
        path = self.path.split("?")[0]
        if path == "/":
            path = "/index.html"
        filepath = os.path.normpath(os.path.join(ROOT, path.lstrip("/")))
        if not filepath.startswith(ROOT) or not os.path.isfile(filepath):
            self._json(404, {"ok": False, "error": "not found"})
            return
        ext = os.path.splitext(filepath)[1].lower()
        ctype = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".svg": "image/svg+xml",
            ".png": "image/png",
            ".jpg": "image/jpeg",
        }.get(ext, "application/octet-stream")
        try:
            with open(filepath, "rb") as f:
                data = f.read()
        except Exception:
            self._json(404, {"ok": False, "error": "read failed"})
            return
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self._cors()
        self.end_headers()
        self.wfile.write(data)


def main():
    key = load_key()
    print("=" * 48)
    print("  Qiaojian Chuanyu - local AI proxy")
    print("  Open http://localhost:8000 in your browser")
    print("=" * 48)
    if key:
        print("  [OK] DeepSeek key loaded -> AI mode enabled")
    else:
        print("  [!!] key.txt not found -> fallback mode only")
        print("       (create key.txt with your DeepSeek API key)")
    print("  Press Ctrl+C to stop\n")
    server = HTTPServer((HOST, PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        server.server_close()


if __name__ == "__main__":
    main()
