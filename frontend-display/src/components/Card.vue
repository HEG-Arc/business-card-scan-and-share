<template>
  <div class="card" :class="animation + ' ' + card.special + ' ' + (card.odoo && card.odoo.registration ? card.odoo.registration.state : '')"
   :style="{left: `${left}%`, top: `${top}%`, transform}">
   <div class="scale">
    <div class="flipper" :class="{flipped: flipped}">
      <div class="side side-scan" :style="{'background-image': card.isUploaded ? 'url(https://firebasestorage.googleapis.com/v0/b/firebase-ptw.appspot.com/o/business-card-app%2Fcards%2F' + card.id + '.jpg?alt=media)' : ''}">
        <svg class="ocr-debug" viewBox="0 0 850 550" v-if="card.detections && $root.debug">
          <path v-for="d in card.detections.slice(1)" :d="d|toPath">
            <title>{{d.description}}</title>
          </path>
        </svg>
        <span class="flip-button" @click="flipped=!flipped"><i class="ion ion-loop"></i></span>
      </div>
      <div class="side side-data">
          <div v-if="card.special === 'EVENT'">
            <h2>{{card.name}}</h2>
            <h3>{{card.date | date}}</h3>
          </div>
          <div v-if="card.odoo">
            <img class="profile-pic" :src="'data:image/jpeg;base64,' + card.odoo.partner.image" v-if="card.odoo.partner && card.odoo.partner.image">
            <img class="company-pic" :src="'data:image/jpeg;base64,' + $root.company(card.odoo.partner.parent_id[0]).image" v-if="card.odoo.partner && card.odoo.partner.parent_id">
            <h2>{{card.odoo.registration ? card.odoo.registration.name : card.odoo.partner.name}}</h2>
            <h3>{{card.odoo.registration ? card.odoo.registration.x_company : card.odoo.partner.function}}</h3>
          </div>
          <p style="color:green">{{person}}</p>
          <p style="color:red">{{email}}</p>
          <p style="color:yellow">{{phones}}</p>
          <p style="color:blue">{{npaCity}}</p>

          <p style="color:yellow">{{oraganization}}</p>
          <p v-if="card.entities">{{card.entities.map(e => `${e.name} {${e.type}\}`)}} </p>
          <p>{{card.rawText}}</p>
          <span v-if="card.isUploaded" class="flip-button" @click="flipped=!flipped"><i class="ion ion-loop"></i></span>
      </div>
    </div>
   </div>
  </div>
</template>

<script>
import interact from "interactjs";
import moment from "moment";
import { db, DB_APP_ROOT } from "../main";
const reEmail = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const rePhone = /(.):?([\d +()]{7,18})/g;
const reNpaCity = /(\d{4}) ([^\n]+)/;
export default {
  name: "Card",
  props: ["card"],
  data() {
    return {
      x: 0,
      y: 0,
      animationSettings: {},
      speed: 0.2,
      dx: (Math.random() - 0.5) * 0.2,
      dy: (Math.random() - 0.5) * 0.2,
      left: parseInt(Math.random() * 80),
      top: parseInt(Math.random() * 80),
      angle: parseInt(Math.random() * 40 - 20),
      dragging: false,
      animation: "",
      flipped: this.card.isUploaded ? false : true
    };
  },
  firestore() {
    return {
      animationSettings: db.collection(`${DB_APP_ROOT}/data/settings`).doc("animation")
    };
  },
  mounted() {
    const anim = () => {
      if (this.animationSettings.autoMove && !this.dragging) {
        this.left = this.left + this.dx;
        if (this.left < 0 || this.left > 82) {
          this.dx = this.dx * -1;
        }
        this.top = this.top + this.dy;
        if (this.top < 0 || this.top > 82) {
          this.dy = this.dy * -1;
        }
      }
      requestAnimationFrame(anim);
    };
    // requestAnimationFrame(anim);
    interact(this.$el)
      .draggable({
        // enable inertial throwing
        inertia: true,
        // keep the element within the area of it's parent
        restrict: {
          restriction: "parent",
          endOnly: true,
          elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
        },
        // enable autoScroll
        autoScroll: false,
        onstart: () => {
          this.dragging = true;
          this.x = this.$el.offsetLeft;
          this.y = this.$el.offsetTop;
        },
        // call this function on every dragmove event
        onmove: event => {
          this.x += event.dx;
          this.y += event.dy;
          this.left =
            parseFloat(this.x) / this.$el.parentElement.offsetWidth * 100;
          this.top =
            parseFloat(this.y) / this.$el.parentElement.offsetHeight * 100;
          this.$emit("dragstart");
        },
        // call this function on every dragend event
        onend: event => {
          this.dragging = false;
          if (event.relatedTarget) {
            this.animation = "zoomOutDown";
            setTimeout(() => {
              // if gate has special delete card
              if (event.relatedTarget.__vue__.gate.activeCard && event.relatedTarget.__vue__.gate.activeCard.special === 'DELETE') {
                db.collection(`${DB_APP_ROOT}/data/cards`).doc(this.card.id).delete();
                // TODO cloud function trigger cleanup storage?
              } else {
                if(!(this.card.special && this.card.special === 'EXPERT')) {
                  // TODO customize EVENT ID detection
                  db.collection(`${DB_APP_ROOT}/data/cards/${this.card.id}/events`).doc('2').set({
                    state: 'invite'
                  });
                  // TODO make something better
                  db.collection(`${DB_APP_ROOT}/data/cards`).doc(this.card.id).update({
                    special: 'EVENT2'
                  });
                }

                // match can be an event card or a contact
                this.animation = "zoomIn";
                this.left = parseInt(Math.random() * 40 + 20);
                this.top = parseInt(Math.random() * 40 + 20);
                this.angle = parseInt(Math.random() * 40 - 20);
                setTimeout(() => {
                  this.animation = "";
                }, 1000);
              }
            }, 1000);
          }
        }
      })
      .gesturable({
        onmove: event => {
          this.angle += event.da;
        }
      })
      .resizable(false);
  },
  computed: {
    transform() {
      return `rotateZ(${this.angle}deg)`;
    },
    email() {
      return this.card.rawText ? this.card.rawText.match(reEmail) : "";
    },
    phones() {
      return this.card.rawText ? this.card.rawText.match(rePhone) : "";
    },
    npaCity() {
      return this.card.rawText ? this.card.rawText.match(reNpaCity) : "";
    },
    person() {
      if (this.card.entities) {
        const personnes = this.card.entities
          .filter(e => e.type === "PERSON")
          .map(e => e.name);
        if (personnes.length > 0) {
          return personnes[0];
        }
      }
    },
    oraganization() {
      if (this.card.entities) {
        const orgs = this.card.entities
          .filter(e => e.type === "ORGANIZATION")
          .map(e => e.name);
        if (orgs.length > 0) {
          return orgs[0];
        }
      }
    }
  },
  watch: {
    'card.isUploaded': function() {
      if(!this.card.isUploaded) {
        this.flipped = true;
      }
    },
    'animationSettings.speed': function() {
      this.dx = (Math.random() - 0.5) * this.animationSettings.speed;
      this.dy = (Math.random() - 0.5) * this.animationSettings.speed;
    }
  },
  filters: {
    toPath(d) {
      if (!(d.boundingPoly && d.boundingPoly.vertices)) {
        return "";
      }
      return (
        "M" +
        d.boundingPoly.vertices.map(d => `${d.x} ${d.y}`).join(" L") +
        " Z"
      );
    },
    date(value) {
      if (value) {
        return moment(String(value)).format('DD MMM, hh:mm');
      }
    }
  },
  methods: {}
};
</script>

<style>
.card,
.side {
  width: 255px;
  height: 165px;
}

.profile-pic {
  border-radius: 50%;
  border: 2px solid white;
  width: 54px;
  height: 54px;
  top: 6px;
  left: 6px;
  position: absolute;
  background-color: white;
}

.company-pic {
  max-width: 90px;
  max-height: 40px;
  bottom: 0;
  left: 0;
  position: absolute;
  background-size: contain;
}

.card.open{
  z-index: -1;
  pointer-events: none;
}

.card.ope .scale {
  transform: scale3d(0.3, 0.3, 0.3) !important;
}

.card {
  position: absolute;
  z-index: 10;
  -webkit-animation-duration: 1s;
  animation-duration: 1s;
  -webkit-animation-fill-mode: both;
  animation-fill-mode: both;
  perspective: 1000px;
}

.flipper {
  transition: 0.6s;
  transform-style: preserve-3d;
  position: relative;
}

.side {
  backface-visibility: hidden;
  position: absolute;
  top: 0;
  left: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
}

.side-data {
  color: white;
  background-color: #0089b6;
  transform: rotateY(180deg);
  background-image: url('../assets/DBL-Network.svg');
  background-repeat: no-repeat;
  background-size: 80px;
  background-position: bottom 10px right 10px;
  padding: 4px;
}

.card.EXPERT .side-data {
  color: white;
  background-color: red;
}

.card.EVENT2 .scale {
  transform: scale3d(0.6, 0.6, 0.6) translate3d(0, -60px, 0);
}

.card.EVENT2 .scale:after {
  content: 'DBL#2';
  background-color: green;
  color: white;
  position: absolute;
  padding: 5px;
  top: -10px;
  right: -10px;
}

.side-data h2,
.side-data h3 {
  font-weight: normal;
  text-align: center;
}

.side-scan {
  background-color: #fff;
  background-repeat: no-repeat;
  background-size: 255px 165px;
}

.flipped {
  transform: rotateY(180deg);
}

.flip-button {
  position: absolute;
  top: 2px;
  right: 2px;
  cursor: pointer;
}

@keyframes zoomOutDown {
  40% {
    opacity: 1;
    transform: scale3d(0.475, 0.475, 0.475) translate3d(0, -60px, 0);
    animation-timing-function: cubic-bezier(0.55, 0.055, 0.675, 0.19);
  }

  to {
    opacity: 0;
    transform: scale3d(0.1, 0.1, 0.1) translate3d(0, 2000px, 0);
    transform-origin: center bottom;
    animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1);
  }
}

.zoomOutDown {
  animation-name: zoomOutDown;
}

.ocr-debug {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.ocr-debug path {
  fill: none;
  stroke: red;
  stroke-width: 4;
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale3d(0.3, 0.3, 0.3);
  }

  50% {
    opacity: 1;
  }
}

.zoomIn {
  animation-name: zoomIn;
}
</style>
