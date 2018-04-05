<template>
  <div class="draw">
    <div class="app-wrapper">
      <canvas class="draw-canvas" ref="canvas"></canvas>
      <div class="cursor" id="cursor"></div>
      <button type="button" class="close-draw"
                  v-on:click="close"
                  title="close"><i class="ion ion-close"></i>
          </button>
      <div class="controls">
        <div class="btn-row">
          <div class="history" title="history">
            {{ history.length }}
          </div>
        </div>
        <div class="btn-row">
          <button type="button"
                  v-on:click="removeHistoryItem"
                  v-bind:class="{ disabled: !history.length }" title="Undo">
            <i class="ion ion-reply"></i>
          </button>
          <button type="button"
                  v-on:click="removeAllHistory"
                  v-bind:class="{ disabled: !history.length }" title="Clear all">
            <i class="ion ion-trash-a"></i>
          </button>
        </div>

        <div class="btn-row">
          <button title="Pick a brush size"
                  v-on:click="popups.showSize = !popups.showSize"
                  v-bind:class="{ active: popups.showSize }">
            <i class="ion ion-android-radio-button-on"></i>
            <span class="size-icon">
              {{ size }}
            </span>
          </button>

          <div class="popup" v-if="popups.showSize">
            <div class="popup-title">
              Brush size
            </div>
            <label v-for="sizeItem in sizes" class="size-item">
              <input type="radio" name="size" v-model="size" v-bind:value="sizeItem">
              <span class="size"
                    v-bind:style="{width: sizeItem + 'px', height: sizeItem + 'px'}"
                    v-on:click="popups.showSize = !popups.showSize"></span>
            </label>
          </div>
        </div>

        <div class="btn-row">
          <button title="Pick a color"
                  v-on:click="popups.showColor = !popups.showColor"
                  v-bind:class="{ active: popups.showColor }">
            <i class="ion ion-android-color-palette"></i>
            <span class="color-icon"
                  v-bind:style="{backgroundColor: color}">
            </span>
          </button>

          <div class="popup" v-if="popups.showColor">
            <div class="popup-title">
              Brush color
            </div>
            <label v-for="colorItem in colors" class="color-item">
              <input type="radio"
                    name="color"
                    v-model="color"
                    v-bind:value="colorItem">
              <span v-bind:class="'color color-' + colorItem"
                    v-bind:style="{backgroundColor: colorItem}"
                    v-on:click="popups.showColor = !popups.showColor"></span>
            </label>
          </div>
        </div>

      </div>
	  </div>
  </div>
</template>

<script>
// https://codepen.io/Lewitje/pen/MVommB
export default {
  props: {
    history: {
      default: [],
      type: Array
    }
  },
  data() {
    return {
      color: "#13c5f7",
      popups: {
        showColor: false,
        showSize: false,
        showWelcome: true,
        showSave: false,
        showOptions: false
      },
      options: {
        restrictY: false,
        restrictX: false
      },
      save: {
        name: "",
        saveItems: []
      },
      size: 12,
      colors: [
        "#d4f713",
        "#13f7ab",
        "#13f3f7",
        "#13c5f7",
        "#138cf7",
        "#1353f7",
        "#2d13f7",
        "#7513f7",
        "#a713f7",
        "#d413f7",
        "#f713e0",
        "#f71397",
        "#f7135b",
        "#f71313",
        "#f76213",
        "#f79413",
        "#f7e013"
      ],
      sizes: [6, 12, 24, 48],
      weights: [2, 4, 6],
      mouseDown: false,
      mouseX: 0,
      mouseY: 0,
      c: undefined,
      ctx: undefined
    };
  },
  mounted() {
    this.c = this.$refs.canvas;
    this.ctx =  this.c.getContext('2d');
		this.setSize();
		this.listen();
		this.redraw();
  },
  methods: {
    close() {
      this.$emit('close');
    },
    removeHistoryItem() {
      this.history.splice(this.history.length - 2, 1);
      this.redraw();
    },
    removeAllHistory() {
      this.history.splice(0);
      this.redraw();
    },
    listen() {
      this.c.addEventListener("mousedown", e => {
        this.mouseDown = true;
        this.mouseX = e.offsetX;
        this.mouseY = e.offsetY;
        this.setDummyPoint();
      });

      this.c.addEventListener("mouseup", () => {
        if (this.mouseDown) {
          this.setDummyPoint();
        }
        this.mouseDown = false;
      });

      this.c.addEventListener("mouseleave", () => {
        if (this.mouseDown) {
          this.setDummyPoint();
        }
        this.mouseDown = false;
      });

      this.c.addEventListener("mousemove", e => {
        this.moveMouse(e);

        if (this.mouseDown) {
          this.mouseX = this.mouseX;
          this.mouseY = this.mouseY;

          if (!this.options.restrictX) {
            this.mouseX = e.offsetX;
          }

          if (!this.options.restrictY) {
            this.mouseY = e.offsetY;
          }

          var item = {
            isDummy: false,
            x: this.mouseX,
            y: this.mouseY,
            c: this.color,
            r: this.size
          };

          this.history.push(item);
          this.draw(item, this.history.length);
        }
      });

      window.addEventListener("resize", () => {
        this.setSize();
        this.redraw();
      });
    },
    setSize() {
      this.c.width = window.innerWidth;
      this.c.height = window.innerHeight - 60;
    },
    moveMouse(e) {
      let x = e.offsetX;
      let y = e.offsetY;

      var cursor = document.getElementById("cursor");

      cursor.style.transform = `translate(${x - 10}px, ${y - 10}px)`;
    },
    getDummyItem() {
      var lastPoint = this.history[this.history.length - 1];

      return {
        isDummy: true,
        x: lastPoint ? lastPoint.x : 0,
        y: lastPoint ? lastPoint.y : 0,
        c: null,
        r: null
      };
    },
    setDummyPoint() {
      var item = this.getDummyItem();
      this.history.push(item);
      this.draw(item, this.history.length);
    },
    redraw() {
      this.ctx.clearRect(0, 0, this.c.width, this.c.height);
      this.drawBgDots();

      if (!this.history.length) {
        return true;
      }

      this.history.forEach((item, i) => {
        this.draw(item, i);
      });
    },
    drawBgDots() {
      var gridSize = 50;
      this.ctx.fillStyle = "rgba(0, 0, 0, .2)";

      for (var i = 0; i * gridSize < this.c.width; i++) {
        for (var j = 0; j * gridSize < this.c.height; j++) {
          if (i > 0 && j > 0) {
            this.ctx.beginPath();
            this.ctx.rect(i * gridSize, j * gridSize, 2, 2);
            this.ctx.fill();
            this.ctx.closePath();
          }
        }
      }
    },
    draw(item, i) {
      this.ctx.lineCap = "round";
      this.ctx.lineJoin = "round";

      var prevItem = this.history[i - 2];

      if (i < 2) {
        return false;
      }

      if (!item.isDummy && !this.history[i - 1].isDummy && !prevItem.isDummy) {
        this.ctx.strokeStyle = item.c;
        this.ctx.lineWidth = item.r;

        this.ctx.beginPath();
        this.ctx.moveTo(prevItem.x, prevItem.y);
        this.ctx.lineTo(item.x, item.y);
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (!item.isDummy) {
        this.ctx.strokeStyle = item.c;
        this.ctx.lineWidth = item.r;

        this.ctx.beginPath();
        this.ctx.moveTo(item.x, item.y);
        this.ctx.lineTo(item.x, item.y);
        this.ctx.stroke();
        this.ctx.closePath();
      }
    }
  }
};

</script>

<style lang="scss">


$prim: rgb(0, 149, 255);
.close-draw {
  position: absolute;
  right: 0;
}
.draw {
  z-index: 999;
  position: absolute;
  width: 100%;
  top: 0;
  left: 0;
  height: 100%;

}

.text-faded {
  opacity: 0.5;
}

.cursor {
  position: fixed;
  top: 0;
  left: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 3px solid rgb(30, 30, 30);
  pointer-events: none;
  user-select: none;
  mix-blend-mode: difference;
  opacity: 0;
  transition: opacity 1s;
}

.draw-canvas {
  width: 100%;
  height: calc(100vh - 60px);
  background-color: white;
  cursor: none;

  &:hover + .cursor {
    opacity: 1;
  }

  &:active + .cursor {
    border-color: rgb(60, 60, 60);
  }
}

.controls {
  position: fixed;
  z-index: 5;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background-color: rgb(10, 10, 10);
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
}

.stat {
  font-size: 20px;
  margin-bottom: 15px;
}

.btn-row {
  position: relative;
  margin-bottom: 5px;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  padding: 0 15px;
  border-radius: 4px;
}

.popup {
  position: absolute;
  width: 300px;
  bottom: 58px;
  padding: 30px;
  left: calc(50% - 150px);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  background-color: white;
  color: rgb(30, 30, 30);
  border-radius: 10px 10px 0 0;
  border: 1px solid rgb(220, 220, 220);
  border-bottom-width: 0;
  opacity: 0;
  animation: popup 0.5s forwards cubic-bezier(0.2, 2, 0.4, 1);
  z-index: 2;
  overflow: hidden;
  max-height: 80vh;
  overflow-y: auto;

  .popup-title {
    flex: 0 0 100%;
    text-align: center;
    font-size: 16px;
    color: black;
    opacity: 0.5;
    margin-bottom: 10px;
  }

  button {
    height: 80px;
    width: 80px;
    text-align: center;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.4);

    i {
      display: block;
      font-size: 30px;
      margin-bottom: 5px;
      color: rgba(0, 0, 0, 0.2);
    }

    &.disabled {
      color: rgba(0, 0, 0, 0.2);

      i {
        color: rgba(0, 0, 0, 0.1);
      }
    }

    &.active,
    &:active {
      color: rgba(0, 0, 0, 0.4);

      i {
        color: $prim;
      }
    }
  }
}

@keyframes popup {
  from {
    opacity: 0;
    transform: translateX(40px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.fade-up {
  opacity: 0;
  animation: fade-up 1s forwards cubic-bezier(0.2, 2, 0.4, 1);
}

@keyframes fade-up {
  from {
    transform: translateY(80px);
    opacity: 0;
  }
  to {
    transform: none;
    opacity: 1;
  }
}

.form {
  flex: 0 0 100%;

  input {
    display: block;
    appearance: none;
    border: 0;
    box-shadow: 0;
    outline: 0;
    background-color: rgb(240, 240, 240);
    border-radius: 4px;
    padding: 10px 15px;
    width: 100%;
    margin-bottom: 4px;
  }
}



.history {
  width: 30px;
  height: 30px;
  background-color: rgb(30, 30, 30);
  border-radius: 50%;
  text-align: center;
  line-height: 30px;
  font-size: 12px;
  overflow: hidden;
  color: rgb(140, 140, 140);
}

.color-item {
  position: relative;
  display: inline-block;
  cursor: pointer;
  width: 60px;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;

  input {
    position: absolute;
    opacity: 0;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
  }

  input:checked + .color {
    opacity: 1;
    border: 2px solid $prim;
  }

  .color {
    display: block;
    width: 30px;
    height: 30px;
    background-color: white;
    border-radius: 50%;

    &:hover {
      opacity: 0.8;
    }
  }
}

@keyframes pulsate {
  0%,
  100% {
    transform: none;
  }
  50% {
    transform: scale(1.15);
  }
}

.size-item {
  width: 40px;
  height: 60px;
  display: inline-flex;
  position: relative;
  justify-content: center;
  align-items: center;
  vertical-align: top;
  cursor: pointer;

  input {
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    opacity: 0;
  }

  .size {
    background-color: rgb(140, 140, 140);
    display: inline-block;
    border-radius: 50%;
    transition: all 0.15s;
    transform: translate(-50%, -50%) scale(0.6);
    position: absolute;
    top: 50%;
    left: 50%;

    &:hover {
      opacity: 0.8;
    }
  }

  input:checked + .size {
    background-color: $prim;
  }
}

.saves {
  flex: 0 0 calc(100% + 60px);
  margin: 30px -30px -30px;
  padding: 30px;
  background-color: rgb(240, 240, 240);
  max-height: 250px;
  overflow-y: auto;

  .save-item {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
