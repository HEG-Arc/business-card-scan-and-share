import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from firebase_admin import storage
import tempfile
import cv2

APP_PATH = "business-card-app"

# Use a service account
cred = credentials.Certificate('serviceAccount.json')
firebase_admin.initialize_app(cred)
bucket = storage.bucket(name="firebase-ptw.appspot.com")
db = firestore.client()

config = {}
doc_ref = {}

sending = False

def update_config():
    global doc_ref
    doc_ref = db.collection("%s/data/gates" % APP_PATH).document('alpha')
    doc = doc_ref.get()
    config.update(doc.to_dict())

def set_config(update):
    global sending
    if sending:
        return
    sending = True
    doc_ref.update(update)
    sending = False

def create_remote_card():
    return db.collection("%s/data/cards" % APP_PATH).document()

def upload_card(card):
        f, filename = tempfile.mkstemp(prefix="business_card", suffix=".jpg")
        f, filename_match = tempfile.mkstemp(prefix="business_card_match", suffix=".jpg")
        cv2.imwrite(filename, card.warp)
        cv2.imwrite(filename_match, card.warp_match)
        aBlob = bucket.blob("%s/cards/%s.jpg" % (APP_PATH, card.id))
        aBlob.upload_from_filename(filename=filename)
        aBlob = bucket.blob("%s/cards/%s_match.jpg" % (APP_PATH, card.id))
        aBlob.upload_from_filename(filename=filename_match)
        # TODO cleanup fn
