# Job Ingestion System - Testing & Verification Guide

## Overview

The job ingestion system automatically pulls and normalizes job postings from three sources:

- **Adzuna** (US job postings)
- **USAJobs** (Government jobs)
- **Greenhouse** (Company-specific job boards)

---

## Prerequisites

### 1. Environment Variables Setup

Add these to your `.env` file before testing:

```bash
# Adzuna Credentials (required)
JOB_INGESTION_ADZUNA_APP_ID=3218b4fc
JOB_INGESTION_ADZUNA_APP_KEY=22cfc679f11a14847868e8a083f69c76

# USAJobs Credentials (required)
JOB_INGESTION_USAJOBS_API_KEY=WaoXr2BjsolWxrld9JleGZ9NUM8fzVzoKlbpTeYOWNE=
JOB_INGESTION_USAJOBS_USER_AGENT=jwade16-job-ingestion

# Greenhouse (required - comma-separated company slugs)
JOB_INGESTION_GREENHOUSE_COMPANIES=stripe,github,airbnb

# Optional: Tuning parameters
JOB_INGESTION_DEFAULT_PER_PAGE=100
JOB_INGESTION_DEFAULT_MAX_PAGES=5
JOB_INGESTION_DEFAULT_CONCURRENCY=2
JOB_INGESTION_RETRY_ATTEMPTS=3
JOB_INGESTION_RETRY_BASE_DELAY_MS=500
```

### 2. Start the Backend

```bash
npm run start:dev
```

Wait for logs showing:

```
[NestFactory] Starting Nest application...
[InstanceLoader] JobIngestionModule dependencies initialized
[RoutesResolver] JobIngestionController {/v1/job-ingestion}: routes registered
[NestApplication] Nest application successfully started
```

---

## Test Methods

### Method 1: Manual API Testing (Postman / cURL)

#### A. Sync All Sources

**POST Request:**

```
http://localhost:3000/v1/job-ingestion/sync/all
```

**cURL:**

```bash
curl -X POST http://localhost:3000/v1/job-ingestion/sync/all
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "All sources synced successfully",
  "data": [
    {
      "source": "adzuna",
      "fetched": 150,
      "inserted": 145,
      "updated": 5,
      "skipped": 0,
      "pagesProcessed": 2,
      "errors": [],
      "startedAt": "2026-03-24T10:30:00.000Z",
      "finishedAt": "2026-03-24T10:35:00.000Z"
    },
    {
      "source": "usajobs",
      "fetched": 500,
      "inserted": 490,
      "updated": 10,
      "skipped": 0,
      "pagesProcessed": 1,
      "errors": [],
      "startedAt": "2026-03-24T10:35:01.000Z",
      "finishedAt": "2026-03-24T10:38:00.000Z"
    },
    {
      "source": "greenhouse",
      "fetched": 45,
      "inserted": 44,
      "updated": 1,
      "skipped": 0,
      "pagesProcessed": 1,
      "errors": [],
      "startedAt": "2026-03-24T10:38:01.000Z",
      "finishedAt": "2026-03-24T10:38:15.000Z"
    }
  ]
}
```

#### B. Sync Single Source

**POST Request:**

```
http://localhost:3000/v1/job-ingestion/sync?source=adzuna
```

**cURL:**

```bash
curl -X POST "http://localhost:3000/v1/job-ingestion/sync?source=adzuna"
```

Test other sources:

```bash
curl -X POST "http://localhost:3000/v1/job-ingestion/sync?source=usajobs"
curl -X POST "http://localhost:3000/v1/job-ingestion/sync?source=greenhouse"
```

#### C. Check Sync Status

**GET Request:**

```
http://localhost:3000/v1/job-ingestion/status
```

**cURL:**

```bash
curl -X GET http://localhost:3000/v1/job-ingestion/status
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Job ingestion status retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "source": "adzuna",
      "lastRunStartedAt": "2026-03-24T10:30:00.000Z",
      "lastRunCompletedAt": "2026-03-24T10:35:00.000Z",
      "lastSuccessfulSyncAt": "2026-03-24T10:35:00.000Z",
      "status": "succeeded",
      "lastError": null,
      "lastPage": 2,
      "lastMetrics": {
        "fetched": 150,
        "inserted": 145,
        "updated": 5,
        "skipped": 0,
        "pagesProcessed": 2,
        "errors": []
      },
      "createdAt": "2026-03-20T00:00:00.000Z",
      "updatedAt": "2026-03-24T10:35:00.000Z"
    }
  ]
}
```

#### D. Get Single Source Status

```bash
curl -X GET "http://localhost:3000/v1/job-ingestion/status?source=usajobs"
```

---

### Method 2: Monitor Server Logs

While running `npm run start:dev`, watch the console for sync logs:

```
[JobIngestionScheduler] Starting daily job ingestion sync...
[JobIngestionService] Syncing source: adzuna
[AdzunaClient] Fetching page 1 (100 per page)
[AdzunaClient] Fetching page 2 (100 per page)
[JobIngestionService] Adzuna: fetched=200, inserted=195, updated=5, skipped=0
[JobIngestionService] Syncing source: usajobs
[UsaJobsClient] Fetching page 1 (500 per page)
[JobIngestionService] USAJobs: fetched=500, inserted=490, updated=10, skipped=0
[JobIngestionService] Syncing source: greenhouse
[GreenhouseClient] Fetching company: stripe
[JobIngestionService] Greenhouse: fetched=45, inserted=44, updated=1, skipped=0
[JobIngestionScheduler] Daily job ingestion sync completed. Runs: 3
```

---

### Method 3: Check MongoDB Data

Connect to MongoDB and inspect the job postings:

**Using MongoDB Compass or shell:**

```javascript
// Count total jobs by source
db.job_postings.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]);

// Sample job record
db.job_postings.findOne({ source: 'adzuna' });

// Check sync state
db.job_sync_states.find();
```

**Expected output:**

```javascript
// job_postings collection
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "source": "adzuna",
  "externalJobId": "12345678",
  "title": "Software Engineer",
  "companyName": "TechCorp",
  "location": "New York, NY",
  "description": "Looking for senior engineers...",
  "applyUrl": "https://adzuna.com/apply/12345678",
  "postedAt": ISODate("2026-03-20T10:00:00Z"),
  "salaryMin": 120000,
  "salaryMax": 180000,
  "salaryCurrency": "USD",
  "lastSeenAt": ISODate("2026-03-24T10:35:00Z"),
  "createdAt": ISODate("2026-03-20T00:00:00Z"),
  "updatedAt": ISODate("2026-03-24T10:35:00Z")
}

// job_sync_states collection
{
  "_id": ObjectId("507f1f77bcf86cd799439013"),
  "source": "adzuna",
  "lastRunStartedAt": ISODate("2026-03-24T10:30:00Z"),
  "lastRunCompletedAt": ISODate("2026-03-24T10:35:00Z"),
  "lastSuccessfulSyncAt": ISODate("2026-03-24T10:35:00Z"),
  "status": "succeeded",
  "lastPage": 2,
  "createdAt": ISODate("2026-03-20T00:00:00Z"),
  "updatedAt": ISODate("2026-03-24T10:35:00Z")
}
```

---

## Testing Scenarios

### Scenario 1: First Run (Fresh Database)

**Expected Behavior:**

- All jobs are `inserted` (inserted count = fetched)
- `updated` = 0
- `skipped` = 0

**Test Command:**

```bash
curl -X POST http://localhost:3000/v1/job-ingestion/sync/all
```

### Scenario 2: Second Run (Same Jobs)

**Expected Behavior:**

- Existing jobs are `updated` (not re-inserted)
- `inserted` = 0 or very low (only new ones)
- Dedupe prevents duplicates

**Test Command (run immediately after Scenario 1):**

```bash
curl -X POST http://localhost:3000/v1/job-ingestion/sync/all
```

**Compare metrics:**

- First run: inserted=695, updated=0
- Second run: inserted=0, updated=695 (or similar)

### Scenario 3: Daily Auto Sync

**Expected Behavior:**

- At 00:00 UTC every day, sync runs automatically
- No manual trigger needed
- Check `job_sync_states.lastSuccessfulSyncAt`

**Verification:**

```bash
# Check sync status
curl -X GET http://localhost:3000/v1/job-ingestion/status

# Confirm lastSuccessfulSyncAt matches midnight UTC
```

---

## Error Testing

### Test 1: Missing Credentials

Remove `JOB_INGESTION_ADZUNA_APP_ID` from `.env`, restart, and run:

```bash
curl -X POST "http://localhost:3000/v1/job-ingestion/sync?source=adzuna"
```

**Expected Response (500):**

```json
{
  "success": false,
  "message": "Adzuna credentials are missing",
  "errors": ["Adzuna API credentials not configured"]
}
```

### Test 2: API Failure Handling

Intentionally provide wrong API key and run:

```bash
curl -X POST "http://localhost:3000/v1/job-ingestion/sync?source=usajobs"
```

**Expected:**

- Retry logic activates (3 attempts by default)
- Error logged and sync continues with other sources
- Status records `lastError` field

---

## Performance Metrics

### Expected Processing Times

| Source     | Avg. Time | Records | Throughput |
| ---------- | --------- | ------- | ---------- |
| Adzuna     | 4-6s      | 150-200 | ~35/sec    |
| USAJobs    | 2-4s      | 500     | ~150/sec   |
| Greenhouse | 1-2s      | 40-50   | ~30/sec    |
| **Total**  | **8-12s** | **700** | **60/sec** |

---

## Client Delivery Checklist

- ✅ Environment variables documented
- ✅ API endpoints documented with cURL examples
- ✅ Expected response formats shown
- ✅ MongoDB schema documented
- ✅ Sync status monitoring explained
- ✅ Error handling demonstrated
- ✅ Performance benchmarks provided
- ✅ Daily automatic sync scheduled
- ✅ Idempotent upsert prevents duplicates
- ✅ Retry/backoff built in
- ✅ Logs for debugging included

---

## Next Steps

1. **Test all three endpoints** (Adzuna, USAJobs, Greenhouse)
2. **Verify MongoDB records** match response metrics
3. **Run twice** to confirm idempotent upsert behavior
4. **Monitor logs** for any errors
5. **Show status endpoint** to client for real-time visibility

---

## Support & Monitoring

### View Live Logs

```bash
npm run start:dev
```

### Check Database Size

```javascript
db.job_postings.stats();
db.job_sync_states.stats();
```

### Reset Data (for testing)

```javascript
db.job_postings.deleteMany({});
db.job_sync_states.deleteMany({});
```
