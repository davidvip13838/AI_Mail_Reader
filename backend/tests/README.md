# Backend API Tests

This directory contains tests to verify that all API connections are working correctly.

## Running Tests

### Run all tests:
```bash
npm test
```

### Run tests in watch mode:
```bash
npm run test:watch
```

### Run a specific test file:
```bash
npm test -- gmail.test.js
npm test -- openai.test.js
npm test -- elevenlabs.test.js
npm test -- integration.test.js
npm test -- mongodb.test.js
```

## Test Files

### `gmail.test.js`
Tests Gmail API connection:
- ✅ Environment variables configuration
- ✅ OAuth2 client setup
- ✅ Authorization URL generation
- ⚠️  Gmail API connection (requires `GMAIL_ACCESS_TOKEN` in .env)

### `openai.test.js`
Tests OpenAI API connection:
- ✅ Environment variables configuration
- ✅ API connection and test request
- ✅ Email summarization format

### `elevenlabs.test.js`
Tests ElevenLabs API connection:
- ✅ Environment variables configuration
- ✅ API connection and voice listing
- ✅ Text-to-speech generation

### `integration.test.js`
Tests full workflow integration:
- ✅ All environment variables
- ✅ API key formats
- ✅ Workflow simulation

### `mongodb.test.js`
Tests MongoDB connection and database operations:
- ✅ MongoDB connection status
- ✅ Database name verification
- ✅ Create, Read, Update operations
- ✅ User model schema validation
- ✅ Password hashing verification
- ✅ Unique email constraint
- ✅ Required fields validation

## Setup for Full Testing

### MongoDB Connection Test

The MongoDB test requires a MongoDB instance to be running. Set this in your `.env` file:

```env
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/ai-mail-reader-test
```

**Note:** The test uses a separate test database (`ai-mail-reader-test`) to avoid interfering with your main database. All test data is automatically cleaned up after tests.

### Gmail Connection Test

To run all tests including the Gmail connection test, add this to your `.env` file:

```env
# Optional: For testing Gmail API connection
GMAIL_ACCESS_TOKEN=your_access_token_here
```

**Note:** The Gmail connection test is skipped by default. To enable it:
1. Get a Gmail access token (by authenticating through the app)
2. Add it to your `.env` file as `GMAIL_ACCESS_TOKEN`
3. Remove `.skip` from the test in `gmail.test.js`

## Expected Output

When all APIs are correctly configured, you should see:

```
✅ MongoDB: Connected successfully
✅ Gmail API: Environment variables configured
✅ OpenAI API: Connected successfully
✅ ElevenLabs API: Connected successfully
✅ Integration: All environment variables configured
```

## Troubleshooting

### Tests failing with "API key not configured"
- Make sure your `.env` file exists in the `backend/` directory
- Verify all API keys are set and don't contain placeholder values
- Check that API keys start with correct prefixes (e.g., `sk-` for OpenAI)

### Tests timing out
- Check your internet connection
- Verify API endpoints are accessible
- Some tests have 30-second timeouts for API calls

### MongoDB connection failed
- Make sure MongoDB is running locally, or
- Update `MONGODB_URI` in `.env` to point to your MongoDB Atlas cluster
- Check that the connection string format is correct
- Verify network connectivity to MongoDB server

### Gmail test skipped
- This is normal - the Gmail test requires an active access token
- To enable it, add `GMAIL_ACCESS_TOKEN` to your `.env` file

