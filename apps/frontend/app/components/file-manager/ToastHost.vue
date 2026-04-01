<script setup lang="ts">
const { message, kind } = useToast();
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-2 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="message"
      class="fixed bottom-6 left-1/2 z-[60] max-w-md -translate-x-1/2 rounded-lg px-4 py-2 text-sm font-medium shadow-lg"
      :class="{
        'bg-emerald-800 text-white': kind === 'success',
        'bg-red-800 text-white': kind === 'error',
        'bg-slate-800 text-white': kind === 'info',
      }"
      role="status"
    >
      {{ message }}
    </div>
  </Transition>
</template>
