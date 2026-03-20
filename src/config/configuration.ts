const configuration = () => ({
  port: Number.parseInt(process.env.PORT || '3000', 10),
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nest-template',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'secretKey',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  },
  jobIngestion: {
    adzuna: {
      baseUrl:
        process.env.JOB_INGESTION_ADZUNA_BASE_URL ||
        'https://api.adzuna.com/v1/api/jobs',
      country: process.env.JOB_INGESTION_ADZUNA_COUNTRY || 'us',
      appId: process.env.JOB_INGESTION_ADZUNA_APP_ID,
      appKey: process.env.JOB_INGESTION_ADZUNA_APP_KEY,
    },
    usajobs: {
      baseUrl:
        process.env.JOB_INGESTION_USAJOBS_BASE_URL ||
        'https://data.usajobs.gov/api/search',
      apiKey: process.env.JOB_INGESTION_USAJOBS_API_KEY,
      userAgent:
        process.env.JOB_INGESTION_USAJOBS_USER_AGENT || 'jwade16-job-ingestion',
    },
    greenhouse: {
      baseUrl:
        process.env.JOB_INGESTION_GREENHOUSE_BASE_URL ||
        'https://boards-api.greenhouse.io/v1/boards',
      companies: process.env.JOB_INGESTION_GREENHOUSE_COMPANIES || 'stripe',
    },
    sync: {
      defaultPerPage: Number.parseInt(
        process.env.JOB_INGESTION_DEFAULT_PER_PAGE || '100',
        10,
      ),
      defaultMaxPages: Number.parseInt(
        process.env.JOB_INGESTION_DEFAULT_MAX_PAGES || '10',
        10,
      ),
      defaultConcurrency: Number.parseInt(
        process.env.JOB_INGESTION_DEFAULT_CONCURRENCY || '2',
        10,
      ),
      retryAttempts: Number.parseInt(
        process.env.JOB_INGESTION_RETRY_ATTEMPTS || '3',
        10,
      ),
      retryBaseDelayMs: Number.parseInt(
        process.env.JOB_INGESTION_RETRY_BASE_DELAY_MS || '500',
        10,
      ),
      adzuna: {
        perPage: Number.parseInt(
          process.env.JOB_INGESTION_ADZUNA_PER_PAGE || '100',
          10,
        ),
        maxPages: Number.parseInt(
          process.env.JOB_INGESTION_ADZUNA_MAX_PAGES || '10',
          10,
        ),
        concurrency: Number.parseInt(
          process.env.JOB_INGESTION_ADZUNA_CONCURRENCY || '2',
          10,
        ),
      },
      usajobs: {
        perPage: Number.parseInt(
          process.env.JOB_INGESTION_USAJOBS_PER_PAGE || '500',
          10,
        ),
        maxPages: Number.parseInt(
          process.env.JOB_INGESTION_USAJOBS_MAX_PAGES || '10',
          10,
        ),
        concurrency: Number.parseInt(
          process.env.JOB_INGESTION_USAJOBS_CONCURRENCY || '2',
          10,
        ),
      },
      greenhouse: {
        perPage: Number.parseInt(
          process.env.JOB_INGESTION_GREENHOUSE_PER_PAGE || '100',
          10,
        ),
        maxPages: Number.parseInt(
          process.env.JOB_INGESTION_GREENHOUSE_MAX_PAGES || '10',
          10,
        ),
        concurrency: Number.parseInt(
          process.env.JOB_INGESTION_GREENHOUSE_CONCURRENCY || '1',
          10,
        ),
      },
    },
  },
});

export default configuration;
