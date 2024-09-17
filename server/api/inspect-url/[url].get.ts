export default defineEventHandler(async (event) => {
  const url = getRouterParam(event, "url", { decode: true });

  if (!url) {
    throw createError({
      statusCode: 400,
      message: "Please provide a URL to inspect",
    });
  }

  const startTime = Date.now();
  const { status, headers } = await $fetch.raw(url, {
    headers: {
      "x-nf-debug-logging": "1",
    },
  });
  const durationInMs = Date.now() - startTime;

  // TODO(serhalp) What about sites with an extra proxy on top? Maybe check for a debug response
  // header instead?
  if (headers.get("Server") !== "Netlify") {
    throw createError({
      statusCode: 400,
      message: "This tool can only be used with Netlify sites",
    });
  }

  return {
    status,
    headers: Object.fromEntries(headers),
    durationInMs,
  };
});
