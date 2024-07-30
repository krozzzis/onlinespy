# Usage

Create file `settings.py` with content:
```python
# Get at https://core.telegram.org/api/obtaining_api_id
api_id = ... 
api_hash = "..."
```

Run bot:
```bash
poetry run python bot.py
```

Run webserver:
```bash
poetry run fastapi dev api.py
```

Open [http://127.0.0.1:8000/static/index.html](http://127.0.0.1:8000/static/index.html)
