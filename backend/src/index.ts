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
  // This is a temporary diagnostic endpoint that reports the token status in the main error field.
  const token = process.env.BROWSERLESS_TOKEN;
  const tokenStatus = token ? 'LOADED' : 'MISSING OR UNDEFINED';
  const tokenValueCheck = token === '2TeqCwywXGDKLareb25cbb9d8b25c5a6a96c1af2a30b9ee95' ? 'AND IT MATCHES' : 'BUT IT DOES NOT MATCH';

  const diagnosticMessage = `DIAGNOSTIC RESULT: Token is ${tokenStatus} ${tokenValueCheck} the key you provided.`;

  res.status(500).json({
    error: diagnosticMessage,
    details: diagnosticMessage
  });
};

app.post('/api/run-test', runTestHandler);

// Export the app for Vercel
export default app;
