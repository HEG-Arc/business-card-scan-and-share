const functions = require("firebase-functions");
const gcs = require('@google-cloud/storage')();
const vision = require('@google-cloud/vision');
const language = require("@google-cloud/language");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

const DB_ROOT = "business-card-app";

exports.businessCardExtractText = functions.storage
  .object()
  .onFinalize((object, context) => {
    const file = gcs.bucket(object.bucket).file(object.name);
    const filePath = object.name;
    const filePathSplit = filePath.split("/");
    const fileName = filePathSplit.pop();

    // Exit if this is triggered on a file that is not an image.
    if (!object.contentType.startsWith("image/")) {
      console.log("This is not an image.");
      return "";
    }

    // Exit if the image is already a thumbnail.
    if (fileName.includes("_match")) {
      console.log("ignore _match files");
      return "";
    }

    if (filePath.indexOf(DB_ROOT) === -1) {
      console.log(`not a ${DB_ROOT} app`);
      return "";
    }
    const vClient = new vision.ImageAnnotatorClient();
    return vClient
      .textDetection(`gs://${object.bucket}/${object.name}`)
      .then(results => {
        if (!results || results.length === 0) {
          return;
        }
        const detections = results[0].textAnnotations;
        const lClient = new language.LanguageServiceClient();
        if (!detections || detections.length === 0) {
          return;
        }
        const text = detections[0].description
        const document = {
          content: text,
          type: "PLAIN_TEXT"
        };
        return lClient
          .analyzeEntities({
            document: document
          })
          .then(results => {
            if (!results || results.length === 0) {
              return;
            }
            const entities = results[0].entities;
            const dbRef = db.collection(`${DB_ROOT}/data/cards`).doc(fileName.slice(0, fileName.length - 4));
            return dbRef.update({
              rawText: text,
              isOCRed: true,
              entities,
              detections
            });
          })
          .catch(err => {
            return console.error("ERROR:", err);
          });
      })
      .catch(err => {
        return console.error("ERROR:", err);
      });
  });

const Odoo = require('./odoo');

const odoo = new Odoo({
  host: 'economie.digital',
  port: 443,
  database: 'digital',
  username: 'ocr_bc', //functions.config().odoo.username,
  password: '', //functions.config().odoo.password,
  protocol: 'https'
});

exports.importRegistrations = functions.https.onRequest((req, res) => {
  if (!req.query.hasOwnProperty('id')) {
    return "NEED an odoo event id"
  }
  // get list from db
  return db.collection(`${DB_ROOT}/data/cards`).get().then(snapshot => {
    const cards = [];
    snapshot.forEach((doc) => {
      const card = doc.data();
      card.id = doc.id;
      cards.push(card);
    });
    const existing = cards.filter(c => c.hasOwnProperty('odoo')).map(c => c.odoo.registration.id);

    // get list from odoo
    return odoo.connect().then(() => {
      return odoo.search_read('event.registration', {
        limit: 100,
        fields: ['attendee_partner_id', 'email', 'x_company', 'name', 'state', 'date_open'],
        domain: [
          ['event_id', '=', parseInt(req.query.id)]
        ]
      }).then(registrations => {
        return Promise.all(registrations.map(r => {
          if (!existing.includes(r.id)) {
            console.log('create', r.id)
            return db.collection(`${DB_ROOT}/data/cards`).add({
              isUploaded: false,
              odoo: {
                registration: r
              }
            });
          } else {
            // update registration state
            const card = cards.find( c =>  c.odoo && c.odoo.registration &&  c.odoo.registration.id === r.id)
            console.log('update', r.id);
            return db.collection(`${DB_ROOT}/data/cards`).doc(card.id).update({
              'odoo.registration' : r
            });
          }
        })).then(() => {
          res.send('done');
        });
      });
    });
  });
});

exports.importTracks = functions.https.onRequest((req, res) => {
  if (!req.query.hasOwnProperty('id')) {
    return "NEED an odoo event id"
  }
  // get all tracks
  // create list of res_partners and their tracks
  // populate res_partner from db
  // get list from db
  // create/replace
});
