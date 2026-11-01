import { defineEventHandler, readBody } from 'nuxt/server'
import { createReport, parseRunIds } from '~server/reports'

export default defineEventHandler(async (event) => createReport(parseRunIds(await readBody(event))))
