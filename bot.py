from pyrogram import Client, idle
from pyrogram.handlers import UserStatusHandler
from pyrogram.enums import UserStatus
from pymongo import MongoClient, ASCENDING
from datetime import datetime
import signal
import sys
import asyncio
import os
from pprint import pp
from loguru import logger
import settings


app = None
usernames: dict[str, str] = dict()
names: dict[str, str] = dict()
mongodb = None


"""
Handles user's get online/offline event.
"""
def on_status(client, user):
    global mongodb

    if user.id not in usernames or user.status == None:
        return

    online = user.status == UserStatus.ONLINE

    username = usernames[user.id]

    db = mongodb['onlinespy']
    onlines = db.onlines

    entry = {
        "username": username,
        "date": datetime.now(),
        "online": online,
    }

    onlines.insert_one(entry)
    o = "ONLINE" if online else "OFFLINE"
    logger.info(f"Write to db (username: `{username}` status: {o})")


def set_offlines():
    global usernames, names, mongodb

    for id in usernames:
        db = mongodb['onlinespy']
        onlines = db.onlines

        username = usernames[id]

        entry = {
            "username": username,
            "date": datetime.now(),
            "online": False,
        }

        onlines.insert_one(entry)
        logger.info(f"FORCE Write to db (username: `{username}` status: OFFLINE)")
        

def on_exit():
    global mongodb
    logger.info("Exit handler! Setting offline for all users")
    set_offlines()
    mongodb.close()


async def init_usernames():
    global mongodb, app, usernames, names

    contacts = app.get_contacts()
    for user in await contacts:
        username = user.username
        name = " ".join(x for x in [user.first_name, user.last_name] if x is not None)

        names[user.id] = name
        usernames[user.id] = username
        if user.photo and user.username:
            if not os.path.isfile(f"static/photo/{username}.jpg"):
                logger.info(f"Downloading photo for `{username}`")
                await app.download_media(user.photo.small_file_id, file_name=f"static/photo/{username}.jpg")
            else:
                logger.info(f"Skip downloading photo for `{username}` cause already downloaded")

        nms = mongodb['onlinespy'].names
        profile = {
            "id": user.id,
            "username": username,
            "name": name,
            "phone": user.phone_number,
        }
        try:
            nms.insert_one(profile)
        except Exception:
            logger.info(f"Skip adding (id: {user.id} username: `{username}` name: `{name}`)")
        else:
            logger.info(f"Added to runtime memory (id: {user.id} username: `{username}` name: `{name}`)")



async def run():
    global app

    logger.info("Started telegram bot")


    app = Client("Clowny", api_id=settings.api_id, api_hash=settings.api_hash)

    app.add_handler(UserStatusHandler(on_status))

    await app.start()
    
    await init_usernames()

    await idle()
    on_exit()

    await app.stop()


def main():
    global mongodb

    logger.add("logs/bot_{time}.log", format="[{time}/{level}] {message}")

    mongodb = MongoClient("mongodb://localhost:27017/")
    # mongodb['onlinespy'].onlines.drop()

    asyncio.run(run())


if __name__ == "__main__":
    main()
