import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import pgclient from './db.js';

import eventRoutes from './routes/events.js';
import userRoutes from './routes/users.js';
import ticketRoutes from './routes/tickets.js';
import weatherRoutes from './routes/weather.js';

const app = express();
dotenv.config();

app.use(cors());
app.use(express.json());

app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/weather', weatherRoutes); // if needed

const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.send('✅ Event Management API is running');
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

pgclient.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err);
  });
