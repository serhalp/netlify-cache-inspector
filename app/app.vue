<template>
  <NuxtRouteAnnouncer />

  <header>
    <h1>
      <NuxtLink
        to="/"
        class="home-link"
      >
        Netlify Cache Inspector
      </NuxtLink>
    </h1>

    <p class="subheading">
      Inspect and compare cache headers for requests to Netlify sites
    </p>
  </header>

  <main>
    <NuxtPage />
  </main>
</template>

<style>
body {
  /* Override weird default from Netlify Examples style */
  text-align: left;
}

main {
  /* Override very airy defaults from Netlify Examples style, not great for a utility app */
  margin-top: 3em;
  padding-bottom: 3em;
}
</style>

<style scoped>
header {
  text-align: center;
}

.subheading {
  font-size: 1.5em;
}

.home-link {
  text-decoration: none;
  color: inherit;
}

.home-link:hover,
.home-link:focus {
  text-decoration: underline;
  cursor: pointer;
}
</style>
