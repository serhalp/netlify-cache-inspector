declare global {
  const hljs: {
    highlightElement: (element: HTMLElement) => void
  }
}

// oxlint-disable-next-line unicorn/require-module-specifiers -- standard TS pattern for ambient declarations
export {}
