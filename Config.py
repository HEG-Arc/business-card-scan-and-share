import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

# Use a service account
cred = credentials.Certificate('serviceAccount.json')
firebase_admin.initialize_app(cred)

db = firestore.client()

config = {}
doc_ref = {}

def update_config():
    global doc_ref
    doc_ref = db.collection('business-card-app/data/gates').document('alpha')
    doc = doc_ref.get()
    config.update(doc.to_dict())

def set_config(update):
    doc_ref.update(update)
