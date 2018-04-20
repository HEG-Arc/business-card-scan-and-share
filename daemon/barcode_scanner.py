#!/usr/bin/python
# -*- coding: UTF-8 -*-
# barcode-reader.py
#
# Copyright (C) 2018 HES-SO//HEG Arc
#
# Author(s): Cédric Gaspoz <cedric.gaspoz@he-arc.ch>, Boris Fritscher <boris.fritscher@he-arc.ch>
#
# This file is part of DBL.
#
# DBL is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# DBL is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with DBL. If not, see <http://www.gnu.org/licenses/>.

import logging
import time
import requests
from evdev import InputDevice, ecodes, list_devices, categorize

logging.basicConfig()

READER_DEVICE = "Datalogic Scanning, Inc. Handheld Barcode Scanner"

HOST = '192.168.1.1'
API_URL = 'http://%s/game/api/scan-code/' % HOST

def get_device():
    dev = None
    devices = map(InputDevice, list_devices())
    for device in devices:
        if device.name == READER_DEVICE:
            dev = InputDevice(device.fn)
    return dev

while True:
    print "Starting"
    logging.info("Getting the device...")
    dev = get_device()

    if dev:
        logging.info("We got the device...")
        print "We got the device..."
        dev.grab()
        logging.info("Starting the Barcode Reader daemon...")
        while True:
            barcode = ""
            caps = False
            try:
                for event in dev.read_loop():
                    if event.type == ecodes.EV_KEY:
                        data = categorize(event)
                        if data.scancode == 42:
                            # Shift event
                            if data.keystate == 1:
                                caps = True
                            if data.keystate == 0:
                                caps = False
                        if data.keystate == 1:  # Down events only
                            if caps:
                                key_lookup = u'{}'.format(CAPSCODES.get(data.scancode)) or u'UNKNOWN:[{}]'.format(data.scancode)  # Lookup or return UNKNOWN:XX
                            else:
                                key_lookup = u'{}'.format(SCANCODES.get(data.scancode)) or u'UNKNOWN:[{}]'.format(data.scancode)  # Lookup or return UNKNOWN:XX
                            if (data.scancode != 42) and (data.scancode != 28):
                                barcode += key_lookup
                            if data.scancode == 28:
                                # Enter event
                                logging.info("Scan: %s" % barcode)
                                print "Scan: %s" % barcode
                                # We have a Barcode from player.url (http://gestionair.ch/a128)
                                try:
                                    code = barcode.split('/')[-1]
                                    player_id = code[len(EVENT_ID):]
                                except IndexError:
                                    player_id = "0"
                                logging.info("Scanned player_id: %s" % player_id)
                                url = "%s%s" % (API_URL, player_id)
                                print url
                                r = requests.get(url)
                                # TODO: Do something with the response code

            except IOError:
                logging.error("IOError")
                break
    time.sleep(2)


logging.info("Terminating the Barcode Reader daemon...")