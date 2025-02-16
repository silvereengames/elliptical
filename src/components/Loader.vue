<script setup>
import { nextTick, onMounted, ref } from "vue";
import {showMain} from "@/assets/store";

const isLoading = ref(true);
const showLoader = ref(true);
const loadError = ref(false);
let startTime = Date.now();

onMounted(() => {
  // Check if the page is fully loaded
  window.addEventListener("load", () => {
    let endTime = Date.now();
    let loadTime = endTime - startTime;
    console.log(`Page loaded in ${loadTime}ms.`);
    isLoading.value = false;
    setTimeout(() => {
      nextTick(() => {
        showLoader.value = false;
      });
    }, 500);
    showMain.value = true;
  });
});
</script>

<template>
  <div id="loader" :class="{ 'fade-out': !isLoading }" v-if="showLoader"
    class="fixed top-0 left-0 w-screen h-screen flex flex-col justify-center items-center bg-gray-900 z-50">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="animate-spin w-48 h-48">
      <defs>
        <linearGradient id="meteoconsHurricaneFill0" x1="175.8" x2="336.2" y1="117" y2="395"
          gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#d4d7dd" />
          <stop offset=".5" stop-color="#d4d7dd" />
          <stop offset="1" stop-color="#bec1c6" />
        </linearGradient>
      </defs>
      <path fill="none" stroke="url(#meteoconsHurricaneFill0)" stroke-linecap="round" stroke-miterlimit="10"
        stroke-width="24"
        d="M344 256a88 88 0 1 1-88-88a88 88 0 0 1 88 88ZM200 116.9l-3.8 7.7A269.7 269.7 0 0 0 169 267h0m143.1 128l3.8-7.7A269.7 269.7 0 0 0 343.2 245h0">
        <animateTransform additive="sum" attributeName="transform" dur="1.5s" repeatCount="indefinite" type="rotate"
          values="1440 256 256; 0 256 256" />
      </path>
    </svg>
    <p class="text-white animate-pulse">Loading Elliptical...</p>
    <p class="text-gray-600 p-5">Version 0.15</p>
  </div>
</template>