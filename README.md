# SCAN Business Cards and Share

python scan
Web animations for touchscreen
connected via firebase


OK border detection
-> if card
TODO    GATE.status == SCANNING
OK    -> if bot blurry stable for x time

      -> extract blur

       -> if match
          -> GATE.status == OPEN
          -> GATE.activeCard == id
       -> else
OK          -> create new id
OK          -> extract color
OK            -> upload img
OK                -> GATE.status == OPEN
                -> GATE.activeCard == id
                -> CARD.isUploaded
OK            -> OCR
                -> CARD.infos... == OCR.
                -> CARD.isOCRed
                    -> Welcome...
                -> bridge to Odoo?
if not CARD.isRegistered then -> please register at desk?
-> off
OK    -> GATE.status == CLOSED
    -> GATE.activeCard == ''

-> send card to card

-> update/check email
-> fix name
-> Directory of participants
-> sync from odoo? list all ?

-> match linkedin

-> movements?
OK -> moveToTop
-> filter/search
-> share a drawing?

pip install --upgrade firebase-admin

----------------
set GOOGLE_APPLICATION_CREDENTIALS=serviceAccount.json
firebase functions:config:get > .runtimeconfig.json
set GOOGLE_APPLICATION_CREDENTIALS=C:\Users\bfrit\Documents\GitHub\OpenCV-Playing-Card-Detector\serviceAccount.json

businessCardExtractText({bucket: 'firebase-ptw.appspot.com', name: 'business-card-app/cards/0noGEr6QP1uvs7cu5isl.jpg', contentType: 'image/'})

----------------


This is a version of OpenCV-Playing-Card-Detector adjusted for recognition of Magic The Gathering cards. It wasn't tested on Raspberry Pi, only PC.

capture image:
- place the card on the black background
- once the camera is ready point it towards the card, try to catch only the card and white background, nothing else
- when the program captures the image of the card it will appear next to the video feed
- now you can save the image (use right click and "save as ..." for now)

recognize image:
- place the card on the black background
- once the camera is ready point it towards the card, try to catch only the card and white background, nothing else
- keep your camera steady as the progam tries the identify the card, the name of the closes match is shown on the right image, on the top of the card.

# OpenCV-Playing-Card-Detector
This is a Python program that uses OpenCV to detect and identify playing cards from a PiCamera video feed on a Raspberry Pi. Check out the YouTube video that describes what it does and how it works:

https://www.youtube.com/watch?v=m-QPjO-2IkA

## Usage
Download this repository to a directory and run CardDetector.py from that directory. Cards need to be placed on a dark background for the detector to work. Press 'q' to end the program.

The program was originally designed to run on a Raspberry Pi with a Linux OS, but it can also be run on Windows 7/8/10. To run on Windows, download and install Anaconda (https://www.anaconda.com/download/, Python 3.6 version), launch Anaconda Prompt, and execute the program by launching IDLE (type "idle" and press ENTER in the prompt) and opening/running the CardDetector.py file in IDLE. The Anaconda environment comes with the opencv and numpy packages installed, so you don't need to install those yourself. If you are running this on Windows, you will also need to change the program to use a USB camera, as described below.

The program allows you to use either a PiCamera or a USB camera. If using a USB camera, change line 38 in CardDetector.py to:
```
videostream = VideoStream.VideoStream((IM_WIDTH,IM_HEIGHT),FRAME_RATE,2,0).start()
```

The card detector will work best if you use isolated rank and suit images generated from your own cards. To do this, run Rank_Suit_Isolator.py to take pictures of your cards. It will ask you to take a picture of an Ace, then a Two, and so on. Then, it will ask you to take a picture of one card from each of the suits (Spades, Diamonds, Clubs, Hearts). As you take pictures of the cards, the script will automatically isolate the rank or suit and save them in the Card_Imgs directory (overwriting the existing images).


## Files
CardDetector.py contains the main script

Cards.py has classes and functions that are used by CardDetector.py

PiVideoStream.py creates a video stream from the PiCamera, and is used by CardDetector.py

Rank_Suit_Isolator.py is a standalone script that can be used to isolate the rank and suit from a set of cards to create train images

Card_Imgs contains all the train images of the card ranks and suits

## Dependencies
Python 3.6

OpenCV-Python 3.2.0 and numpy 1.8.2:
See https://www.pyimagesearch.com/2016/04/18/install-guide-raspberry-pi-3-raspbian-jessie-opencv-3/
for how to build and install OpenCV-Python on the Raspberry Pi

picamera library:
```
sudo apt-get update
sudo apt-get install python-picamera python3-picamera
```


