############## Python-OpenCV Playing Card Detector ###############
#
# Author: Evan Juras
# Date: 9/5/17
# Description: Python script to detect and identify playing cards
# from a PiCamera video feed.
#

# Import necessary packages

import cv2
import numpy as np
import time
import os
import Cards
import VideoStream
import datetime
from collections import deque
from threading import Thread

from Config import config, update_config, set_config, upload_card, create_remote_card
update_config()
print(config)
lastConfigUpdate = 0

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

# Load the train rank and suit images
path = os.path.dirname(os.path.abspath(__file__))
img_dir = 'Card_Imgs'
train_ranks = Cards.load_ranks(os.path.join(path, img_dir))

### ---- MAIN LOOP ---- ###
# The main loop repeatedly grabs frames from the video stream
# and processes them to find and identify playing cards.

cam_quit = 0  # Loop control variable

WANT_TO_CLOSE = "WANT_TO_CLOSE"
CLOSED = "CLOSED"
SCANNING = "SCANNING"
OPEN = "OPEN"
status = CLOSED

status_length = 50
status_history = deque([], status_length)

is_uploaded = False

def handle_closing():
    global is_uploaded, status
    if status_history.count(WANT_TO_CLOSE) == status_length :
        status=CLOSED
        set_config({"status": CLOSED})
        is_uploaded = False

# Begin capturing frames
while cam_quit == 0:

    # Grab frame from video stream
    image = videostream.read()

    # Start timer (for calculating frame rate)
    t1 = cv2.getTickCount()

    # Pre-process camera image (gray, blur, and threshold it)
    pre_proc = Cards.preprocess_image(image)
    cv2.imshow("pre_proc", pre_proc)

    # Find and sort the contours of all cards in the image (query cards)
    cnts_sort, cnt_is_card = Cards.find_cards(pre_proc)

    annotatedImage = image.copy()
    # If there are no contours, do nothing
    if len(cnts_sort) != 0:

        cards = []
        # For each contour detected:
        for i in range(len(cnts_sort)):
            if (cnt_is_card[i] == 1):
                card = Cards.preprocess_card(cnts_sort[i], image)
                if card.bluriness > config["BLURINESS_THRESHOLD"]:
                    # Find the best rank and suit match for the card.
                    card.best_rank_match, card.rank_diff = Cards.match_card(
                        card, train_ranks)
                    # TODO if no match upload
                    if not is_uploaded:
                        r_card = create_remote_card()
                        card.id = r_card.id
                        is_uploaded = True
                        upload_card(card)
                        r_card.set({"isUploaded": True})
                # Draw center point and match result on the image.
                annotatedImage = Cards.draw_results(annotatedImage, card)
                cards.append(card)
        # Draw card contours on image (have to do contours all at once or
        # they do not show up properly for some reason)
        if (len(cards) != 0):
            if (status == CLOSED):
                status=OPEN
                set_config({"status": OPEN})
            temp_cnts=[]
            for i in range(len(cards)):
                temp_cnts.append(cards[i].contour)
            cv2.drawContours(annotatedImage, temp_cnts, -1, (255, 0, 0), 2)
            cv2.imshow("warp", cards[0].warp)
            cv2.imshow("warpMatch", cards[0].warpMatch)
        else:
            if status != CLOSED:
                status=WANT_TO_CLOSE
    else:
        if status != CLOSED:
            status=WANT_TO_CLOSE
    status_history.append(status)
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
        lastConfigUpdate=0

    # Poll the keyboard. If 'q' is pressed, exit the main loop.
    key=cv2.waitKey(1) & 0xFF
    if key == ord("q"):
        cam_quit=1
    if key == ord("s"):
        cv2.imwrite(os.path.join(path, img_dir, "last.jpg"), cards[0].warp)
        cv2.imwrite(os.path.join(path, img_dir, "last_match.jpg"),
                    cards[0].warpMatch)


# Close all windows and close the PiCamera video stream.
cv2.destroyAllWindows()
videostream.stop()
