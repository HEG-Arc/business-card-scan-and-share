<template>
  <div :class="'card ' + animation"
   :style="{left: `${left}%`, top: `${top}%`, transform, 'background-image': 'url(https://firebasestorage.googleapis.com/v0/b/firebase-ptw.appspot.com/o/business-card-app%2Fcards%2F' + card.id + '.jpg?alt=media)'}">
    <p v-if="card.entities">{{card.entities.map(e => `${e.name} {${e.type}\}`)}} </p>
    <p>{{card.rawText}}</p>
    <p style="color:red">{{email}}</p>
    <p style="color:yellow">{{phones}}</p>
    <p style="color:blue">{{npaCity}}</p>
    <p style="color:red">{{person}}</p>
    <p style="color:yellow">{{oraganization}}</p>
    <svg class="ocr-debug" viewBox="0 0 850 550" v-if="card.detections">
      <path v-for="d in card.detections" :d="d|toPath">
        <title>{{d.description}}</title>
      </path>
    </svg>
  </div>
</template>

<script>
import interact from "interactjs";
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
      dx: 0,
      left: 0,
      top: 0,
      angle: 0,
      dragging: false,
      animation: ""
    };
  },
  mounted() {
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
          this.dx = event.dx;
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
            // TODO: send MATCH to backend
            this.animation = "zoomOutDown";
            setTimeout(() => {
              this.animation = "zoomIn";
              this.left = 50;
              this.top = 50;
              setTimeout(() => {
                this.animation = "";
              }, 1000);
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
    }
  },
  methods: {}
};
</script>

<style>
.card {
  position: absolute;
  background-color: #fff;
  background-repeat: no-repeat;
  background-size: contain;
  color: green;
  width: 255px;
  height: 165px;
  z-index: 10;
  -webkit-animation-duration: 1s;
  animation-duration: 1s;
  -webkit-animation-fill-mode: both;
  animation-fill-mode: both;
  box-shadow: 0px 0px 25px rgba(59, 59, 59, 0.55);
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
  display: none;
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
