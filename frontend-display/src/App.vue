<template>
  <div id="app">
    <div id="dnd" ref="dnd">
      <my-logo style="transform: rotate(180deg); top: 0; left: 0;"></my-logo>
      <my-logo style="bottom: 0;right: 0;"></my-logo>
      <my-card v-for="card in sortedCards" :key="card.id" :card="card" @dragstart="moveToTop(card)"></my-card>
      <my-gate v-for="gate in gates" :key="gate.id" :gate="gate"></my-gate>
    </div>
  </div>
</template>

<script>
import Card from "@/components/Card";
import Gate from "@/components/Gate";
import Logo from "@/components/Logo";
import { db, DB_APP_ROOT } from "@/main";

export default {
  name: "app",
  data() {
    return {
      cards: [],
      sortedCards: [],
      gates: []
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
    particlesJS.load('app', 'particles.json');
    this.$refs.dnd.onmousemove = (e) => {
      const e2 = new Event("mousemove");
      e2.offsetX = e.clientX;
      e2.offsetY = e.clientY;
      if (this.$refs.dnd.nextSibling) {
        this.$refs.dnd.nextSibling.dispatchEvent(e2);
      }
    };
  },
  methods: {
    moveToTop(card) {
      this.sortedCards.splice(this.sortedCards.indexOf(card), 1);
      this.sortedCards.push(card);
    }
  },
  watch: {
    cards() {
      this.cards.forEach(c => {
        if (!this.sortedCards.includes(c)) {
          this.sortedCards.push(c);
        }
      });
      // TODO Handle removal
    }
  },
  components: {
    "my-card": Card,
    "my-gate": Gate,
    "my-logo": Logo
  }
};
</script>

<style>
* {
  box-sizing: border-box;
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
  font-family: "Avenir", Helvetica, Arial, sans-serif;
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
</style>
