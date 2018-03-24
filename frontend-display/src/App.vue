<template>
  <div id="app">
    <div id="dnd" ref="dnd">
      <h1>Title </h1>
      <my-card v-for="card in cards" :key="card.id" :card="card"></my-card>
      <my-gate></my-gate>
    </div>
  </div>
</template>

<script>
import Card from "@/components/Card";
import Gate from "@/components/Gate";
/*
import Stomp from "stompjs";
const client = Stomp.overWS("ws://localhost:15674");
//disable unsupported heart-beat
client.heartbeat.outgoing = 0;
client.heartbeat.incoming = 0;
client.debug = debug;
client.connect('guest', 'guest', onConnect, failureConnect, '/');
client.subscribe('/exchange/gestionair/simulation', (message) => {
                    try {
                        this.handleEvent(JSON.parse(message.body));
                    } catch (e) {
                        console.log('error', e);
                        console.log(message.body);
                    }
                });
  client.send("/queue/test", {priority: 9}, "Hello, STOMP");
*/
export default {
  name: "app",
  data() {
    return {
      cards: [
        {
          id: "pmi"
        }
      ]
    };
  },
  mounted() {
    this.$refs.dnd.onmousemove = (e) => {
      const e2 = new Event("mousemove");
      e2.offsetX = e.clientX;
      e2.offsetY = e.clientY;
      this.$refs.dnd.nextSibling.dispatchEvent(e2);
    };
  },
  components: {
    "my-card": Card,
    "my-gate": Gate
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
}
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: white;
  background-color: #000;
  width: 100%;
  height: 100%;
  touch-action: none;
}
#dnd {
  width: 100%;
  height: 100%;
  padding: 3em;
}
#app canvas {
  position: absolute;
  top: 0;
  left: 0;
}
</style>
