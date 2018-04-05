<template>
  <div :class="'gate ' + gate.status">
    <div class="gate-background" :style="{'background-image': bgImage}"></div>
    <div v-if="gate.status === CLOSED">
      <my-arrows></my-arrows>
      <h2>Scannez votre carte de visite.</h2>
    </div>
    <div v-if="gate.status === SCANNING">
      <h2>Identification en cours</h2>
    </div>
    <div v-if="gate.status === OPEN">
      {{gate.activeCard.id}}
    </div>
  </div>
</template>

<script>
import interact from "interactjs";
import Arrows from "@/components/Arrows";
const CLOSED = "CLOSED";
const SCANNING = "SCANNING";
const OPEN = "OPEN";

export default {
  props: ["gate"],
  data() {
    return {
      CLOSED,
      SCANNING,
      OPEN
    };
  },
  mounted() {
    this.dropzone = interact(this.$el).dropzone({
      // Require a 75% element overlap for a drop to be possible
      accept: ".card",
      overlap: 0.5,
      ondropactivate: event => {
        // add active dropzone feedback
        event.target.classList.add("drop-active");
      },
      ondragenter: event => {
        const draggableElement = event.relatedTarget;
        const dropzoneElement = event.target;
        // feedback the possibility of a drop
        dropzoneElement.classList.add("drop-target");
        draggableElement.classList.add("can-drop");
      },
      ondragleave: event => {
        // remove the drop feedback style
        event.target.classList.remove("drop-target");
        event.relatedTarget.classList.remove("can-drop");
      },
      ondrop: event => {
        event.relatedTarget.classList.remove("can-drop");
      },
      ondropdeactivate: event => {
        // remove active dropzone feedback
        event.target.classList.remove("drop-active");
        event.target.classList.remove("drop-target");
      }
    });
  },
  computed: {
    bgImage() {
      if (this.gate.status === OPEN && this.gate.activeCard) {
        return `url(https://firebasestorage.googleapis.com/v0/b/firebase-ptw.appspot.com/o/business-card-app%2Fcards%2F${
          this.gate.activeCard.id
        }.jpg?alt=media)`;
      }
      return "none";
    }
  },
  components: {
    "my-arrows": Arrows
  }
};
</script>

<style>
.gate {
  position: absolute;
  width: 255px;
  height: 165px;
  bottom: 0;
  left: 0;
  text-align: center;
}
.gate-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1
}
.gate.CLOSED .gate-background {
  background-color: rgba(255, 255, 255, 0.8);
}
.gate.SCANNING .gate-background,
.gate.OPEN .gate-background {
  background-color: rgba(255,255,255,0.8);
  background-repeat: no-repeat;
  background-size: contain;
  background-position: 50% 50%;
}
.gate.SCANNING .gate-background {
  animation-name: sharpen;
  animation-duration: 3s;
  animation-fill-mode: both;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}
.gate.OPEN .gate-background {
  animation: sharpenFull 0.5s both;
  animation-delay: 1s;
}
@keyframes sharpen {
  from {
    filter: blur(70px);
  }
  to {
    filter: blur(20px);
  }
}
@keyframes sharpenFull {
  from {
    filter: blur(20px);
  }
  to {
    filter: blur(0px);
  }
}

.drop-target {
  border: 6px solid rgba(0, 137, 182, 0.8);
}
</style>
