import express from 'express';
import cors from 'cors';

// Initialize Express App
const app = express();

// Middleware
app.use(cors()); // Allow requests from any origin
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('AI UX Agent Backend is running!');
});

app.get('/api', (req, res) => {
  res.send('AI UX Agent Backend is running!');
});

const runTestHandler = async (req: express.Request, res: express.Response) => {
  // This is a temporary diagnostic endpoint.
  // It checks the status of the environment variable and returns it directly.
  const token = process.env.BROWSERLESS_TOKEN;
  const tokenStatus = token ? 'LOADED' : 'MISSING OR UNDEFINED';
  const tokenValueCheck = token === '2TeqCwywXGDKLareb25cbb9d8b25c5a6a96c1af2a30b9ee95' ? 'MATCHES PROVIDED KEY' : 'DOES NOT MATCH';

  res.status(500).json({
    error: 'DIAGNOSTIC-MODE',
    details: `Token Status: ${tokenStatus}. Value Check: ${tokenValueCheck}.`
  });
};

app.post('/api/run-test', runTestHandler);

// Export the app for Vercel
export default app;
