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
    const existing = cards.filter(c => c.hasOwnProperty('odoo') && c.odoo.hasOwnProperty('registration')).map(c => c.odoo.registration.id);

    // get list from odoo
    return odoo.connect().then(() => {
      return odoo.search_read('event.registration', {
        limit: 100,
        fields: ['attendee_partner_id', 'email', 'x_company', 'name', 'state', 'date_open', 'date_closed'],
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
            }).then((ref) => {
              return [ref, r];
            });
          } else {
            // update registration state
            const card = cards.find( c =>  c.odoo && c.odoo.registration &&  c.odoo.registration.id === r.id)
            console.log('update', r.id);
            const ref = db.collection(`${DB_ROOT}/data/cards`).doc(card.id);
            return ref.update({
              'odoo.registration' : r
            }).then(() => {
              return [ref, r];
            })
          }
        }).map(res => {
          return res.then(([cardRef, registration]) => {
            if (registration.attendee_partner_id) {
              odoo.search_read('res.partner', {
                limit: 1,
                fields: ['image', 'name', 'parent_id', 'function'],
                domain: [
                  ['id', '=', registration.attendee_partner_id[0]]
                ]
              }).then(partners => {
                return cardRef.update({
                  'odoo.partner': partners[0]
                });
            });
          }
            return;
          });
        })).then(() => {
          res.send('done');
        });
      });
    });
  }).catch((e) => {
    console.log(e);
  });
});

exports.importCompanies = functions.https.onRequest((req, res) => {
  return odoo.connect().then(() => {
    return odoo.search_read('res.partner', {
      limit: 100,
      fields: ['name', 'website', 'image', 'child_ids'],
      domain: [
        ['is_company', '=', true]
      ]
    }).then(companies => {
      return Promise.all(companies.map(c => {
        console.log(c.id);
        return db.collection(`${DB_ROOT}/data/companies`).doc(`p${c.id}`).set(c);
      }));
    });
  }).then(() => {
    res.send('done');
  });
});

exports.importSpeakersAndExpertsFromTracks = functions.https.onRequest((req, res) => {
  if (!req.query.hasOwnProperty('id')) {
    return "NEED an odoo event id"
  }
  // get all tracks for event
  return odoo.connect().then(() => {
    // TODO would be better to have speacker with their tracks
    return odoo.search_read('event.track', {
      limit: 100,
      fields: ['speaker_ids', 'name', 'tag_ids'],
      domain: [['event_id', '=', parseInt(req.query.id)], ['speaker_ids', '!=', false]]
    }).then(tracks => {
      // create list of res_partners and their tracks
      const partners = {};
      let experts = [];
      tracks.forEach(track => {
        if (track.name === 'Experts') {
          experts = track.speaker_ids;
        }
        track.speaker_ids.forEach(speakerId => {
          if (!partners.hasOwnProperty(speakerId)) {
            partners[speakerId] = {
              id: speakerId,
              tracks: []
            };
          }
          partners[speakerId].tracks.push({
            id: track.id,
            name: track.name
          });
        });
      });
      // get res_partner from db
      return odoo.get('res.partner', {
          ids: Object.keys(partners).map(id => parseInt(id)),
          fields: ['image', 'name', 'parent_id', 'function']
      }).then(odooPartners => {
        // get list from db
        return db.collection(`${DB_ROOT}/data/cards`).get().then(snapshots => {
          const cards = [];
          snapshots.forEach((doc) => {
            const card = doc.data();
            card.id = doc.id;
            cards.push(card);
          });
          const existing = cards.filter(c => c.hasOwnProperty('odoo') && c.odoo.hasOwnProperty('partner')).map(c => c.odoo.partner.id);
          return Promise.all(odooPartners.map(partner => {
            // create replace cards
            if (!existing.includes(partner.id)) {
              console.log('create', partner.id)
              return db.collection(`${DB_ROOT}/data/cards`).add({
                isUploaded: false,
                special: experts.includes(partner.id) ? 'EXPERT' : '',
                odoo: {
                  partner: partner,
                  tracks: partners[partner.id].tracks
                }
              });
            } else {
              // update partner state
              const card = cards.find( c =>  c.odoo && c.odoo.partner &&  c.odoo.partner.id === partner.id);
              console.log('update', partner.id);
              const ref = db.collection(`${DB_ROOT}/data/cards`).doc(card.id);
              return ref.update({
                'odoo.partner' : partner,
                'odoo.tracks': partners[partner.id].tracks,
                'special': experts.includes(partner.id) ? 'EXPERT' : ''
              });
            }
          })).then(() => {
            res.send('done');
          });
        });
      });
    }).catch((e) => {
      return console.log(e);
    });
  });
});

// Listen for any change on cards events
exports.onNewCardsEventInvite = functions.firestore
  .document(`${DB_ROOT}/data/cards/{cardId}/events/{eventId}`).onCreate((snap, context) => {
    return odoo.connect().then(() => {
    return snap.ref.parent.parent.get().then(cardSnap => {
      const card = cardSnap.data();
      // invite to event
      odoo.context['registration_force_draft'] = true;
        const reg =  {
          state: 'draft',
          origin: 'OCR_BC',
            event_id: parseInt(context.params.eventId),
          name: card.odoo.registration.name,
          email: card.odoo.registration.email,
          x_company: card.odoo.registration.x_company,
        };
        if (card.odoo.registration.attendee_partner_id) {
          reg.attendee_partner_id = card.odoo.registration.attendee_partner_id[0]
        }
        return odoo.create('event.registration', reg).then(() => {
        // TODO: odoo mail cron is 5min....
        return snap.ref.update({state: 'draft'})
      });
    });
    });
    //TODO Odoo callback /webhook to get confirmed regs?
  });
