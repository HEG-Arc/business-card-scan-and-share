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

