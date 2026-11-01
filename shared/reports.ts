// Shared by client and server so both agree on ID formats and report size limits

export const MAX_RUNS_PER_REPORT = 100

// Matches the IDs we generate; also keeps arbitrary input out of blob keys
export const RUN_ID_PATTERN = /^[a-z0-9]{8}$/
export const REPORT_ID_PATTERN = /^[a-z0-9]{12}$/
