import express from 'express';
import pgclient from '../db.js';

const router = express.Router();

// POST /api/tickets/claim - Claim a ticket
router.post('/claim', async (req, res) => {
  const { user_id, event_id } = req.body;

  if (!user_id || !event_id) {
    return res.status(400).json({ error: 'Missing user_id or event_id' });
  }

  try {
    const result = await pgclient.query(
      `INSERT INTO tickets (user_id, event_id, claimed_at)
       VALUES ($1, $2, NOW())
       RETURNING *;`,
      [user_id, event_id]
    );

    res.status(201).json({
      message: 'Ticket claimed!',
      ticket: result.rows[0],
    });
  } catch (err) {
    console.error('❌ Error claiming ticket:', err.message);
    res.status(500).json({ error: 'Could not claim ticket' });
  }
});

// GET /api/tickets/:userId
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pgclient.query(
      `SELECT tickets.id AS ticket_id, tickets.claimed_at, events.*
       FROM tickets
       JOIN events ON tickets.event_id = events.id
       WHERE tickets.user_id = $1
       ORDER BY tickets.claimed_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching user tickets:', err.message);
    res.status(500).json({ error: 'Failed to retrieve tickets' });
  }
});

export default router;
