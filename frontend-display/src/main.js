import Vue from "vue";
import App from "./App.vue";

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
  mounted() {
    //eslint-disable-next-line
    particlesJS.load('app', 'particles.json');
  }
}).$mount("#app");
