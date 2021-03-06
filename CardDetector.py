import cv2
import numpy as np
import time
import os
import Cards
import VideoStream
import datetime
import glob
import urllib.request
from collections import deque
from threading import Thread

from Config import config, update_config, set_config, upload_card, create_remote_card, db, APP_PATH
update_config()
print(config)
lastConfigUpdate = 0

path = os.path.dirname(os.path.abspath(__file__))
img_dir = 'Card_Imgs'
match_cards_lookup = {}

def sync_known_cards():
    os.chdir(os.path.join(path, img_dir))
    target_card_ids = [card.id for card in db.collection("%s/data/cards" % APP_PATH).where("isUploaded", "==", True).get()]
    stored_ids = [f.split("_match")[0] for f in glob.glob("*_match.jpg")]
    for id in stored_ids:
        if id not in target_card_ids:
            os.remove("%s_match.jpg" % id)
            if id in match_cards_lookup.keys():
                del match_cards_lookup[id]
            print("deleted", id)
    for id in target_card_ids:
        match_filepath = "%s_match.jpg" % id
        if id not in stored_ids:
            try:
                urllib.request.urlretrieve("https://firebasestorage.googleapis.com/v0/b/firebase-ptw.appspot.com/o/business-card-app%2Fcards%2F" +  id + "_match.jpg?alt=media", match_filepath)
                print("download", id)
            except Exception as e:
                print(e, id)
        if id not in match_cards_lookup.keys():
            print("loading", id)
            load_match_card(id, match_filepath)

def load_match_card(id, filepath):
    img = cv2.imread(filepath, cv2.IMREAD_GRAYSCALE)
    match_cards_lookup[id] = {"name": id,"img": img}

sync_known_cards()

### ---- INITIALIZATION ---- ###
# Define constants and initialize variables

# Camera settings
IM_WIDTH = 1920
IM_HEIGHT = 1080

FRAME_RATE = 10

# Initialize calculated frame rate because it's calculated AFTER the first time it's displayed
frame_rate_calc = 1
freq = cv2.getTickFrequency()

# Define font to use
font = cv2.FONT_HERSHEY_SIMPLEX

# Initialize camera object and video feed from the camera. The video stream is set up
# as a seperate thread that constantly grabs frames from the camera feed.
# See VideoStream.py for VideoStream class definition
# IF USING USB CAMERA INSTEAD OF PICAMERA,
# CHANGE THE THIRD ARGUMENT FROM 1 TO 2 IN THE FOLLOWING LINE:
videostream = VideoStream.VideoStream(
    (IM_WIDTH, IM_HEIGHT), FRAME_RATE, 2, config["DEVICE_NUM"]).start()
time.sleep(1)  # Give the camera time to warm up

cam_quit = 0  # Loop control variable

WANT_TO_CLOSE = "WANT_TO_CLOSE"
CLOSED = "CLOSED"
SCANNING = "SCANNING"
OPEN = "OPEN"
status = CLOSED
current_match_card = None

status_length = 10
status_history = deque([], status_length)

def handle_closing():
    global status, current_match_card
    if status_history.count(WANT_TO_CLOSE) == status_length :
        status=CLOSED
        current_match_card = None
        set_config({"status": CLOSED, "activeCard": ""})

# Begin capturing frames
while cam_quit == 0:

    # Grab frame from video stream
    image = videostream.read()

    # Start timer (for calculating frame rate)
    t1 = cv2.getTickCount()

    # Pre-process camera image (gray, blur, and threshold it)
    pre_proc = Cards.preprocess_image(image)
    # cv2.imshow("pre_proc", pre_proc)

    # Find and sort the contours of all cards in the image (query cards)
    cnts_sort, cnt_is_card = Cards.find_cards(pre_proc)

    annotatedImage = image.copy()
    # If there are no contours, do nothing
    if len(cnts_sort) != 0:
        print("found contours")
        cards = []
        # For each contour detected:
        for i in range(len(cnts_sort)):
            if cnt_is_card[i] == 1:
                print("found card")
                if status == CLOSED:
                    status=SCANNING
                    set_config({"status":SCANNING})
                card = Cards.preprocess_card(cnts_sort[i], image)
                if card.bluriness > config["BLURINESS_THRESHOLD"]:
                    # if last match validate if still same
                    print("Blur ok")
                    if current_match_card is not None:
                        print("checking current card")
                        card.best_rank_match, card.rank_diff = Cards.match_card(
                        card, current_match_card)
                    else:
                        print("checking all cards")
                        card.best_rank_match, card.rank_diff = Cards.match_card(
                            card, match_cards_lookup)
                    # handle if no match => new?
                    if card.best_rank_match == "Unknown":
                        print("found unknown")
                        r_card = create_remote_card()
                        card.id = r_card.id
                        card.best_rank_match = card.id
                        cv2.imwrite(os.path.join(path, img_dir, "%s_match.jpg" % card.id), card.warp_match)
                        match_cards_lookup[card.id] = {"img": card.warp_match, "name": card.id}
                        upload_card(card)
                        r_card.set({"isUploaded": True})
                        # TODO: handle duplicate after OCR?
                    card.id = card.best_rank_match
                # Draw center point and match result on the image.
                annotatedImage = Cards.draw_results(annotatedImage, card)
                cards.append(card)
        # Draw card contours on image (have to do contours all at once or
        # they do not show up properly for some reason)
        if len(cards) != 0:
            if cards[0].id != "" and (status == CLOSED or status == SCANNING):
                current_match_card = {}
                current_match_card[card.id] = {"name": card.id, "img": card.warp_match}
                set_config({"status": OPEN, "activeCard": db.collection("%s/data/cards" % APP_PATH).document(cards[0].id)})
                status=OPEN
            if status == WANT_TO_CLOSE:
                status = OPEN
            temp_cnts = [card.contour for card in cards]
            cv2.drawContours(annotatedImage, temp_cnts, -1, (255, 0, 0), 2)
            # cv2.imshow("warp", cards[0].warp)
            # cv2.imshow("warp_match", cards[0].warp_match)
        else:
            print("no cards")
            if status != CLOSED:
                status = WANT_TO_CLOSE
    else:
        print("no contours")
        if status != CLOSED:
            status = WANT_TO_CLOSE
    status_history.append(status)
    print(status)
    handle_closing()
    # Draw framerate in the corner of the image. Framerate is calculated at the end of the main loop,
    # so the first time this runs, framerate will be shown as 0.
    cv2.putText(annotatedImage, "FPS: "+str(int(frame_rate_calc)),
                (10, 26), font, 0.7, (255, 0, 255), 2, cv2.LINE_AA)

    # Finally, display the image with the identified cards!
    cv2.imshow("Card Detectors", annotatedImage)

    # Calculate framerate
    t2=cv2.getTickCount()
    time1=(t2-t1)/freq
    frame_rate_calc=1/time1
    lastConfigUpdate=lastConfigUpdate + time1
    if lastConfigUpdate > 10:
        print("update conf %s" % datetime.datetime.now())
        update_config()
        lastConfigUpdate = 0
        sync_known_cards()

    # Poll the keyboard. If 'q' is pressed, exit the main loop.
    key=cv2.waitKey(1) & 0xFF
    if key == ord("q"):
        cam_quit=1
    if key == ord("s"):
        cv2.imwrite(os.path.join(path, img_dir, "last.jpg"), cards[0].warp)
        cv2.imwrite(os.path.join(path, img_dir, "last_match.jpg"),
                    cards[0].warp_match)


# Close all windows and close the PiCamera video stream.
cv2.destroyAllWindows()
videostream.stop()
