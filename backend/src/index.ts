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

// Export the app for Vercel
export default app;
