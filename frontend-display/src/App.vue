<template>
  <div id="app">
    <div id="dnd" ref="dnd">
      <!-- <my-logo style="top: 0;left: 0;"></my-logo> -->
      <button type="button" id="start-draw"
            v-on:click="showDraw=true"><i class="ion ion-image"></i>
    </button>
      <my-card v-if="!(card.odoo && card.odoo.registration && (card.odoo.registration.state == 'draft' || card.odoo.registration.state == 'cancel'))" v-for="card in sortedCards" :key="card.id" :card="card" @dragstart="moveToTop(card)"></my-card>
      <!--
        <my-gate v-for="gate in gates" :key="gate.id" :gate="gate"></my-gate>
      -->
      <!--
      <div id="subscribe">
        <h1>Expérience client, adaptation continue et service proactif</h1>
        <h2>Digital Business Lunsch #2, jeudi 24 mai, 12h</h2>
      </div>
      -->
      <my-draw v-if="showDraw" :history="drawHistory" @close="showDraw=false"></my-draw>
    </div>
    <pop-in-text v-if="showCongrats" v-model="showCongrats" @done="waitNextQueueTick"></pop-in-text>
  </div>
</template>

<script>
import Card from "@/components/Card";
import Gate from "@/components/Gate";
import Logo from "@/components/Logo";
import Draw from "@/components/Draw";
import PopInText from "@/components/PopInText";
import { db, DB_APP_ROOT } from "@/main";

const dequeueTimeout = 1000;

export default {
  name: "app",
  data() {
    return {
      cards: [],
      sortedCards: [],
      gates: [],
      welcomeQueue: [],
      drawHistory: JSON.parse(localStorage.getItem("drawHistory") || "[]"),
      showDraw: false,
      showCongrats: false,
      currentWelcomeRef: ""
    };
  },
  firestore() {
    return {
      cards: db.collection(`${DB_APP_ROOT}/data/cards`),
      gates: db.collection(`${DB_APP_ROOT}/data/gates`)
    };
  },
  mounted() {
    //eslint-disable-next-line
    particlesJS.load("app", "particles.json");
    this.$refs.dnd.onmousemove = e => {
      const e2 = new Event("mousemove");
      e2.offsetX = e.clientX;
      e2.offsetY = e.clientY;
      const particlesCanvas = document.querySelector(".particles-js-canvas-el");
      if (particlesCanvas) {
        particlesCanvas.dispatchEvent(e2);
      }
    };
    this.$refs.dnd.ontouchmove = e => {
      const e2 = new Event("mousemove");
      e2.offsetX = e.changedTouches[0].clientX;
      e2.offsetY = e.changedTouches[0].clientY;
      const particlesCanvas = document.querySelector(".particles-js-canvas-el");
      if (particlesCanvas) {
        particlesCanvas.dispatchEvent(e2);
      }
    };

    //listen to welcome and queue theme
    db.collection(`${DB_APP_ROOT}/data/welcome_queue`).onSnapshot(snapshot => {
      snapshot.docChanges.forEach(change => {
        if (change.type === "added") {
          change.doc
            .data()
            .card.get()
            .then(cardSnap => {
              const card = cardSnap.data();
              card.ref = change.doc.ref;
              this.welcomeQueue.push(card);
            });
        }
      });
    });

    // start dequeue loop
    this.dequeue();
  },
  methods: {
    moveToTop(card) {
      this.sortedCards.splice(this.sortedCards.indexOf(card), 1);
      this.sortedCards.push(card);
    },
    waitNextQueueTick() {
      this.showCongrats = false;
      if (this.currentWelcomeRef) {
        this.currentWelcomeRef.delete();
        this.currentWelcomeRef = "";
      }
      setTimeout(this.dequeue, dequeueTimeout);
    },
    dequeue() {
      const welcomeCard = this.welcomeQueue.shift();
      if (welcomeCard) {
        this.currentWelcomeRef = welcomeCard.ref;
        if (welcomeCard.odoo) {
          if (welcomeCard.odoo.registration) {
            const card = this.cards.find(
              c =>
                c.odoo &&
                c.odoo &&
                c.odoo.registration &&
                c.odoo.registration.id === welcomeCard.odoo.registration.id
            );
            if (card && card.welcomeDone) {
              card.centered = true;
              this.moveToTop(card);
              this.waitNextQueueTick();
            } else {
              this.showCongrats = welcomeCard.odoo.registration
                ? welcomeCard.odoo.registration.name
                : welcomeCard.odoo.partner.name;
              db.collection(`${DB_APP_ROOT}/data/cards`).doc(card.id).update({
                welcomeDone: true
              });
            }
          }
        } else {
          this.showCongrats = welcomeCard.name;
        }
      } else {
        this.waitNextQueueTick();
      }
    }
  },
  watch: {
    cards: {
      deep: true,
      handler: function() {
        const cardIds = this.cards.map(c => c.id);
        const sortedCardsIds = this.sortedCards.map(c => c.id);
        // handle adds
        this.cards.forEach(c => {
          if (!c.isHidden && !sortedCardsIds.includes(c.id)) {
            this.sortedCards.push(c);
          }
        });
        // handle removes
        this.sortedCards.forEach(sc => {
          if (!cardIds.includes(sc.id)) {
            this.sortedCards.splice(this.sortedCards.indexOf(sc), 1);
          } else {
            // replace
            this.$set(
              this.sortedCards,
              this.sortedCards.indexOf(sc),
              this.cards.find(c => c.id === sc.id)
            );
          }
        });
      }
    }
  },
  components: {
    "my-card": Card,
    "my-gate": Gate,
    "my-logo": Logo,
    "my-draw": Draw,
    PopInText
  }
};
</script>

<style lang="scss">
@import url("https://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css");

#subscribe {
  position: absolute;
  bottom: 0;
  left: 300px;
  height: 120px;
  width: 100%;
  background-color: #008ac9;
  font-weight: 300;
  padding-left: 20px;
}

#subscribe h2 {
  color: black;
}

button {
  appearance: none;
  border: 0;
  border-radius: 0;
  box-shadow: 0;
  width: 40px;
  height: 60px;
  display: inline-block;
  background-color: transparent;
  color: rgb(140, 140, 140);
  font-size: 22px;
  transition: all 0.15s;
  cursor: pointer;
  outline: 0;
  position: relative;

  .size-icon,
  .color-icon {
    position: absolute;
    top: 10px;
    right: 0;
  }

  .color-icon {
    width: 5px;
    height: 5px;
    border-radius: 50%;
  }

  .size-icon {
    font-size: 6px;
    text-align: right;
  }

  &:hover {
    opacity: 0.8;
  }

  &:active,
  &.active {
    color: white;
  }

  &.disabled {
    color: rgb(50, 50, 50);
    cursor: not-allowed;
  }
}

* {
  box-sizing: border-box;
}

#start-draw,
#start-draw:hover {
  font-size: 50px;
  top: calc(50% - 50px);
  left: calc(50% - 50px);
  border: 2px solid;
  border-radius: 50%;
  height: 100px;
  width: 100px;
  background-color: #173160;
  opacity: 1;
}

html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  touch-action: none;
  overflow: hidden;
}
#app {
  font-family: "League-Gothic", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: white;
  background-color: #173160;
  width: 100%;
  height: 100%;
  touch-action: none;
}
#dnd {
  width: 100%;
  height: 100%;
  padding: 3em;
  position: absolute;
  z-index: 1;
}
#app canvas {
  position: absolute;
  top: 0;
  left: 0;
}

.box {
  width: 400px;
  height: 400px;
  background-color: red;
  position: absolute;
  z-index: 20;
  top: 0;
  left: 0;
}
</style>
