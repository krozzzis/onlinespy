from loguru import logger
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pymongo import MongoClient
from datetime import datetime, timedelta


app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/get_users")
async def get_users():
    result = []
    for user in app.database.names.find():
        if user['username'] and ((user['username'], user['name'])) not in result:
            result.append((user['username'], user['name']))
    return result


@app.get("/get_name/{username}")
async def get_name(username: str):
    user = app.database.names.find_one({"username": username})
    return user['name']


@app.get("/online/{year}/{month}/{day}/{username}")
async def root(year: int, month: int, day: int, username: str):
    result = []
    start = datetime(year, month, day)
    end = start + timedelta(days=1)
    for event in app.database.onlines.find({
        "username": username,
        "date": {
            "$gte": start,
            "$lt": end,
        },
    }):
        entry = {
            "time": event['date'].timestamp(),
            "online": event['online'],
        }
        result.append(entry)
    if not result:
        return {"status": "nothing"}
    else:
        return {"status:": "ok", "events": result}


@app.on_event("startup")
def startup_db_client():
    app.mongodb_client = MongoClient("mongodb://localhost:27017/")
    app.database = app.mongodb_client['onlinespy']


@app.on_event("shutdown")
def shutdown_db_client():
    app.mongodb_client.close()


def main():
    global app, mongodb

    logger.add("logs/api_{time}.log", format="[{time}/{level}] {message}")

    logger.info("Started api server")

    

if __name__ == '__main__':
    main()
