<template>
  <div class="congrats" @click="$emit('input', false)">
    <animated-star :trigger="trigger" v-for="(i, index) in stars" :key="index"></animated-star>
    <h1 ref="h1">
        Bienvenue!<br/>
        {{value}}
    </h1>
  </div>
</template>

<script>
import { TweenMax, Back } from "gsap";
import { random } from "@/utils";
import AnimatedStar from "@/components/AnimatedStar";

export default {
  props: ["value"],
  data() {
    return {
      stars: new Array(30),
      trigger: false
    };
  },
  mounted() {
    this.animate();
  },
  methods: {
    animate() {
      this.reset();
      this.animateText();
      this.animateBlobs();
      setTimeout(() => {
        this.$emit("done");
      }, 4000);
    },
    animateText() {
      TweenMax.from(this.$refs.h1, 1.2, {
        scale: 0,
        opacity: 0,
        rotation: Math.random() > 0.5 ? random(15, 30) : random(-30, -15),
        ease: Back.easeOut.config(4),
        onStart: () => {
          this.$refs.h1.style.display = "block";
        }
      });
    },
    animateBlobs() {
      this.trigger = {
        xSeed: random(550, 580),
        ySeed: random(220, 270)
      };
    },
    reset() {
      this.trigger = false;
      this.$refs.h1.style.display = "none";
      TweenMax.set(this.$refs.h1, { scale: 1, opacity: 1, rotation: 0 });
    }
  },
  components: {
    AnimatedStar
  }
};
</script>

<style scoped>
@import url(https://fonts.googleapis.com/css?family=Sigmar+One);

.congrats {
  position: absolute;
  top: 0;
  bottom: 0;
  text-align: center;
  left: 0;
  right: 0;
  background-color: rgba(12, 13, 14, 0.6);
  z-index: 99;
  display: flex;
  align-items: center;
  justify-content: center;
}

h1 {
  transform-origin: 50% 50%;
  font-size: 80px;
  font-family: "Sigmar One", cursive;
  cursor: pointer;
  text-align: center;
  width: 100%;
  display: none;
}
</style>
