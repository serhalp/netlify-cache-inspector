import { defineEventHandler, readBody } from 'h3'
import { createReport, parseRunIds } from '~server/reports'

export default defineEventHandler(async (event) => createReport(parseRunIds(await readBody(event))))
