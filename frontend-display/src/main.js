import Vue from "vue";
import App from "./App.vue";
import VueFire from "vuefire";
import firebase from "firebase/app";
import "firebase/firestore";

// Initialize Firebase
const config = {
  apiKey: "AIzaSyAauSkomxxlcgMqlYABWkzuEvHkxaT0xHc",
  authDomain: "ptw.firebaseapp.com",
  databaseURL: "https://ptw.firebaseio.com",
  projectId: "firebase-ptw",
  storageBucket: "firebase-ptw.appspot.com",
  messagingSenderId: "281865054216"
};

window.addEventListener("contextmenu", function(e) { e.preventDefault(); })

firebase.initializeApp(config);
export const DB_APP_ROOT = "business-card-app";
export const db = firebase.firestore();

Vue.config.productionTip = false;
Vue.use(VueFire);

new Vue({
  render: h => h(App),
  data() {
    return {
      gates: [],
      companies: []
    }
  },
  firestore() {
    return {
      gates: db.collection(`${DB_APP_ROOT}/data/gates`),
      companies: db.collection(`${DB_APP_ROOT}/data/companies`)
    };
  },
  methods: {
    company(id) {
      return this.companies.find(c => c.id === `p${id}`) || {};
    }
  },
  computed: {
    debug() {
      return this.gates[0].activeCard && this.gates[0].activeCard.special === "DEBUG";
    }
  }
}).$mount("#app");
