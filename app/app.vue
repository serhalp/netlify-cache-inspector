<template>
  <NuxtRouteAnnouncer />

  <header>
    <h1>Netlify Cache Inspector</h1>

    <p class="subheading">
      Inspect and compare cache headers for requests to Netlify sites
    </p>
  </header>

  <main>
    <RequestForm />
  </main>
</template>

<style>
body {
  /* Override weird default from Netlify Examples style */
  text-align: left;
}
</style>
<style scoped>
header {
  text-align: center;
}

.subheading {
  font-size: 1.5em;
}

main {
  margin-top: 3em;
}
</style>
