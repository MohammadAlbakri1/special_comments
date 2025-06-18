import express from 'express';
import pgclient from '../db.js';

const router = express.Router();

// GET /api/events - All events
router.get('/', async (req, res) => {
  try {
    const result = await pgclient.query('SELECT * FROM events ORDER BY date ASC');
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/events/:id - Single event by ID
router.get('/:id', async (req, res) => {
  const eventId = req.params.id;

  try {
    const result = await pgclient.query('SELECT * FROM events WHERE id = $1', [eventId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error fetching event:', err.message);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// POST /api/events - Create new event using image URL
router.post('/', async (req, res) => {
  const { title, description, location, date, organizer_id, image_url } = req.body;
  const userRole = req.headers['x-user-role'];

  if (userRole !== 'organizer' && userRole !== 'admin') {
    return res.status(403).json({ error: 'Only organizers or admins can create events' });
  }

  try {
    const query = `
      INSERT INTO events (title, description, location, date, organizer_id, image_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const values = [title, description, location, date, organizer_id, image_url];
    const result = await pgclient.query(query, values);

    res.status(201).json({
      message: 'Event created',
      event: result.rows[0]
    });
  } catch (err) {
    console.error('❌ Error creating event:', err.message);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// PUT /api/events/:id - Update event (Admin or event organizer only)
router.put('/:id', async (req, res) => {
  const eventId = req.params.id;
  const userRole = req.headers['x-user-role'];
  const userId = req.headers['x-user-id'];
  const { title, description, location, date, image_url } = req.body;

  if (userRole !== 'admin' && userRole !== 'organizer') {
    return res.status(403).json({ error: 'Access denied. Admins and organizers only.' });
  }

  try {
    // First, get the event to check ownership
    const eventResult = await pgclient.query('SELECT * FROM events WHERE id = $1', [eventId]);
    
    if (eventResult.rowCount === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventResult.rows[0];

    // Check permissions:
    // - Admins can update any event
    // - Organizers can only update their own events
    if (userRole === 'organizer' && event.organizer_id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Access denied. You can only update events you created.' });
    }

    // Update the event
    const query = `
      UPDATE events 
      SET title = $1, description = $2, location = $3, date = $4, image_url = $5
      WHERE id = $6
      RETURNING *;
    `;

    const values = [title, description, location, date, image_url, eventId];
    const result = await pgclient.query(query, values);

    res.json({ message: 'Event updated successfully', event: result.rows[0] });
  } catch (err) {
    console.error('❌ Error updating event:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/events/:id - Admin or event organizer only
router.delete('/:id', async (req, res) => {
  const eventId = req.params.id;
  const userRole = req.headers['x-user-role'];
  const userId = req.headers['x-user-id'];

  if (userRole !== 'admin' && userRole !== 'organizer') {
    return res.status(403).json({ error: 'Access denied. Admins and organizers only.' });
  }

  try {
    // First, get the event to check ownership
    const eventResult = await pgclient.query('SELECT * FROM events WHERE id = $1', [eventId]);
    
    if (eventResult.rowCount === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventResult.rows[0];

    // Check permissions:
    // - Admins can delete any event
    // - Organizers can only delete their own events
    if (userRole === 'organizer' && event.organizer_id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Access denied. You can only delete events you created.' });
    }

    // Delete the event
    const result = await pgclient.query('DELETE FROM events WHERE id = $1 RETURNING *', [eventId]);

    res.json({ message: 'Event deleted successfully', event: result.rows[0] });
  } catch (err) {
    console.error('❌ Error deleting event:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;