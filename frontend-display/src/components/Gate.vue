<template>
  <div class="gate">

  </div>
</template>

<script>
import interact from "interactjs";
export default {
  mounted() {
    this.dropzone = interact(this.$el).dropzone({
      // Require a 75% element overlap for a drop to be possible
      accept: ".card",
      overlap: 0.75,
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
  }
};
</script>

<style>
.gate {
  border: 2px solid blue;
  position: absolute;
  width: 200px;
  height: 200px;
  bottom: 0;
  left: 0;
}
.drop-target {
  background-color: #dcedc8 !important;
}

</style>
