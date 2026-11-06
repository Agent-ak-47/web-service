import { pool } from '../db.js';

const SORT_COLUMNS = {
  price: 'price',
  date: 'date',
  title: 'title',
  location: 'location',
  durationMinutes: 'duration_minutes',
};

const LIST_COLUMNS =
  'id, title, location, description, date, start_time, duration_minutes, ' +
  'capacity, available_places, price, guide, active, image_url';

export async function listExcursions(filters) {
  const where = [];
  const params = [];

  if (filters.search) {
    where.push('(title LIKE ? OR location LIKE ? OR guide LIKE ?)');
    const like = `%${filters.search}%`;
    params.push(like, like, like);
  }

  if (filters.location) {
    where.push('location LIKE ?');
    params.push(`%${filters.location}%`);
  }

  if (filters.date) {
    where.push('date = ?');
    params.push(filters.date);
  }

  if (filters.fromDate) {
    where.push('date >= ?');
    params.push(filters.fromDate);
  }

  if (filters.toDate) {
    where.push('date <= ?');
    params.push(filters.toDate);
  }

  if (filters.minPrice !== null && filters.minPrice !== undefined) {
    where.push('price >= ?');
    params.push(filters.minPrice);
  }

  if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
    where.push('price <= ?');
    params.push(filters.maxPrice);
  }

  if (filters.maxDuration !== null && filters.maxDuration !== undefined) {
    where.push('duration_minutes <= ?');
    params.push(filters.maxDuration);
  }

  let sql = `SELECT ${LIST_COLUMNS} FROM excursions`;

  if (where.length > 0) {
    sql += ` WHERE ${where.join(' AND ')}`;
  }

  const column = SORT_COLUMNS[filters.sortBy] || 'date';
  const direction = filters.order === 'desc' ? 'DESC' : 'ASC';
  sql += ` ORDER BY ${column} ${direction}, id ASC`;

  const [rows] = await pool.query(sql, params);

  return rows;
}

export async function getExcursion(id) {
  const [rows] = await pool.query(
    `SELECT ${LIST_COLUMNS} FROM excursions WHERE id = ?`,
    [id],
  );

  return rows[0] ?? null;
}

export async function createExcursion(data) {
  const [result] = await pool.query(
    `INSERT INTO excursions (
       title, location, description, date, start_time, duration_minutes,
       capacity, available_places, price, guide, active, image_url
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      data.location,
      data.description,
      data.date,
      data.startTime,
      data.durationMinutes,
      data.capacity,
      data.availablePlaces,
      data.price,
      data.guide,
      data.active,
      data.imageUrl,
    ],
  );

  return getExcursion(result.insertId);
}

export async function updateExcursion(id, data) {
  const existing = await getExcursion(id);

  if (existing === null) return null;

  await pool.query(
    `UPDATE excursions SET
       title = ?, location = ?, description = ?, date = ?, start_time = ?,
       duration_minutes = ?, capacity = ?, available_places = ?, price = ?,
       guide = ?, active = ?, image_url = ?
     WHERE id = ?`,
    [
      data.title,
      data.location,
      data.description,
      data.date,
      data.startTime,
      data.durationMinutes,
      data.capacity,
      data.availablePlaces,
      data.price,
      data.guide,
      data.active,
      data.imageUrl,
      id,
    ],
  );

  return getExcursion(id);
}

export async function deleteExcursion(id) {
  const existing = await getExcursion(id);

  if (existing === null) return null;

  await pool.query('DELETE FROM excursions WHERE id = ?', [id]);

  return existing;
}

// ---------------------------------------------------------------------------
// The `/availability`, `/reserve` and `/release` trio. It is the exact same
// convention as the Flight and Package services, which is what lets the
// Reservation service treat all three catalogue types generically.
// ---------------------------------------------------------------------------

export async function checkAvailability(id) {
  const [rows] = await pool.query(
    'SELECT id, available_places, capacity FROM excursions WHERE id = ?',
    [id],
  );

  return rows[0] ?? null;
}

// Reserve is atomic: the availability check and the decrement happen in one
// InnoDB transaction (SELECT ... FOR UPDATE), and every movement is journaled
// in `excursion_capacity_movements`.
export async function reserve(id, quantity, reservationId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT id, available_places, capacity, active FROM excursions WHERE id = ? FOR UPDATE',
      [id],
    );

    const item = rows[0];

    if (!item) {
      await connection.rollback();

      return { status: 404, body: { code: 'NOT_FOUND' } };
    }

    if (!item.active) {
      await connection.rollback();

      return {
        status: 409,
        body: {
          code: 'INSUFFICIENT_AVAILABILITY',
          message: 'This excursion is not available.',
          details: { itemId: id },
        },
      };
    }

    if (item.available_places < quantity) {
      await connection.rollback();

      return {
        status: 409,
        body: {
          code: 'INSUFFICIENT_AVAILABILITY',
          message: `Only ${item.available_places} place(s) are left for this excursion.`,
          details: {
            itemId: id,
            requested: quantity,
            available: item.available_places,
          },
        },
      };
    }

    await connection.query(
      'UPDATE excursions SET available_places = available_places - ? WHERE id = ?',
      [quantity, id],
    );

    await connection.query(
      `INSERT INTO excursion_capacity_movements
         (excursion_id, reservation_id, delta, reason)
       VALUES (?, ?, ?, 'RESERVATION')`,
      [id, reservationId ?? null, -quantity],
    );

    await connection.commit();

    return {
      status: 200,
      body: {
        id,
        availableSeats: item.available_places - quantity,
        capacity: item.capacity,
      },
    };
  } catch (error) {
    await connection.rollback();

    throw error;
  } finally {
    connection.release();
  }
}

export async function release(id, quantity, reservationId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT id, available_places, capacity, active FROM excursions WHERE id = ? FOR UPDATE',
      [id],
    );

    const item = rows[0];

    if (!item) {
      await connection.rollback();

      return { status: 404, body: { code: 'NOT_FOUND' } };
    }

    const available = Math.min(item.capacity, item.available_places + quantity);

    await connection.query(
      'UPDATE excursions SET available_places = ? WHERE id = ?',
      [available, id],
    );

    await connection.query(
      `INSERT INTO excursion_capacity_movements
         (excursion_id, reservation_id, delta, reason)
       VALUES (?, ?, ?, 'RELEASE')`,
      [id, reservationId ?? null, quantity],
    );

    await connection.commit();

    return {
      status: 200,
      body: {
        id,
        availableSeats: available,
        capacity: item.capacity,
      },
    };
  } catch (error) {
    await connection.rollback();

    throw error;
  } finally {
    connection.release();
  }
}
