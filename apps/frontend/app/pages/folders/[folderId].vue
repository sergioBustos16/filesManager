<script setup lang="ts">
definePageMeta({ middleware: ['auth'], ssr: false });
const route = useRoute();
const folderId = route.params.folderId as string;
await navigateTo({ path: '/folders', query: { folder: folderId } }, { replace: true });
</script>

<template>
  <div />
</template>
