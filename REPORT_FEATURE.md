# Report Permalinks Feature Implementation

## Overview
This implementation adds the ability to generate permalinks for sets of runs (reports), allowing users to share multiple runs together.

## How it works

### 1. First Run Submission
- User submits a URL for inspection on the main page
- API creates a new report with the run ID
- Returns the run data + new report ID
- UI shows the run and displays the report permalink

### 2. Additional Run Submissions
- User submits another URL while on the same page
- API receives the current report ID in the request
- Creates a new immutable report containing all previous run IDs + new run ID
- Returns the run data + new report ID
- UI updates to show the new report permalink

### 3. Viewing Report Permalinks
- Users can visit `/report/{reportId}` to view a specific report
- API fetches the report (containing run IDs) and loads all individual runs
- Page displays all runs in the report and sets up context for additional runs
- New runs submitted from this page will create new reports extending this one

## Key Features

### Immutable Reports
- Each new run creates a new report (no mutation of existing reports)
- Prevents shared permalinks from being modified by subsequent users

### Data Storage
- Reports store only run IDs (not full run data) to minimize duplication
- Individual runs are still stored separately and loaded when needed
- Uses the same caching headers as individual runs (`max-age=31536000, immutable`)

### UI Integration
- Report permalink displayed in a styled box with copy-to-clipboard functionality
- Permalink only shown when runs exist and a report has been created
- Clear button resets both runs and current report

## API Endpoints

### `POST /api/inspect-url`
**Request:**
```json
{
  "url": "https://example.com",
  "currentReportId": "abc12345" // optional
}
```

**Response:**
```json
{
  "runId": "def67890",
  "url": "https://example.com",
  "status": 200,
  "headers": { ... },
  "durationInMs": 150,
  "reportId": "ghi13579" // new report ID
}
```

### `GET /api/reports/{reportId}`
**Response:**
```json
{
  "reportId": "ghi13579",
  "createdAt": 1703123456789,
  "runs": [
    {
      "runId": "def67890",
      "url": "https://example.com",
      "status": 200,
      "headers": { ... },
      "durationInMs": 150
    }
  ]
}
```

## Routes

- `/` - Main page for starting new reports
- `/run/{runId}` - View individual run (clears report context)
- `/report/{reportId}` - View specific report and continue adding runs

## Testing

- Added comprehensive tests for useRunManager report functionality
- Updated existing tests to handle new API parameters
- All tests pass and build succeeds

## Implementation Files

### New Files
- `app/types/report.ts` - Report type definitions
- `app/pages/report/[reportId].vue` - Report viewing page
- `server/api/reports/[reportId].ts` - Report API endpoint
- `app/composables/useRunManager.report.test.ts` - Report functionality tests

### Modified Files
- `server/db.ts` - Added report storage functions
- `server/api/inspect-url.post.ts` - Added report creation/updating
- `app/composables/useRunManager.ts` - Added report tracking
- `app/components/RunDisplay.vue` - Added permalink display
- `app/types/run.ts` - Added optional reportId to ApiRun
- Various page components - Updated to pass currentReportId

## Example Flow

1. User visits `/` and submits `https://example.com`
2. System creates run `abc12345` and report `report789`
3. UI shows permalink: `https://site.netlify.app/report/report789`
4. User submits `https://test.com`  
5. System creates run `def67890` and new report `report999` containing `[abc12345, def67890]`
6. UI updates permalink to: `https://site.netlify.app/report/report999`
7. User shares the permalink with colleague
8. Colleague visits `/report/report999` and sees both runs
9. Colleague can add more runs, creating new reports that extend the original