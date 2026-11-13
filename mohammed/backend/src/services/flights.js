import { pool } from '../db.js';
import {
  availabilityAfterRelease,
  checkReserveAvailability,
} from '../domain/flight.js';

const SORT_COLUMNS = {
  price: 'price',
  departureTime: 'departure_time',
  arrivalTime: 'arrival_time',
  airline: 'airline',
  flightNumber: 'flight_number',
  availableSeats: 'available_seats',
  totalSeats: 'total_seats',
};

const LIST_COLUMNS =
  'id, airline, flight_number, departure_city, arrival_city, departure_time, ' +
  'arrival_time, total_seats, available_seats, price, active, image_url';

export async function listFlights(filters) {
  const where = [];
  const params = [];

  if (filters.search) {
    where.push('(airline LIKE ? OR flight_number LIKE ? OR departure_city LIKE ? OR arrival_city LIKE ?)');
    const like = `%${filters.search}%`;
    params.push(like, like, like, like);
  }

  if (filters.departureCity) {
    where.push('departure_city LIKE ?');
    params.push(`%${filters.departureCity}%`);
  }

  if (filters.arrivalCity) {
    where.push('arrival_city LIKE ?');
    params.push(`%${filters.arrivalCity}%`);
  }

  if (filters.airline) {
    where.push('airline LIKE ?');
    params.push(`%${filters.airline}%`);
  }

  if (filters.departureDate) {
    where.push('departure_time LIKE ?');
    params.push(`${filters.departureDate}%`);
  }

  if (filters.arrivalDate) {
    where.push('arrival_time LIKE ?');
    params.push(`${filters.arrivalDate}%`);
  }

  if (filters.minPrice !== null && filters.minPrice !== undefined) {
    where.push('price >= ?');
    params.push(filters.minPrice);
  }

  if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
    where.push('price <= ?');
    params.push(filters.maxPrice);
  }

  if (filters.quantity !== null && filters.quantity !== undefined) {
    where.push('available_seats >= ?');
    params.push(filters.quantity);
  }

  if (filters.active !== null && filters.active !== undefined) {
    where.push('active = ?');
    params.push(filters.active ? 1 : 0);
  }

  let sql = `SELECT ${LIST_COLUMNS} FROM flights`;

  if (where.length > 0) {
    sql += ` WHERE ${where.join(' AND ')}`;
  }

  const column = SORT_COLUMNS[filters.sortBy] || 'departure_time';
  const direction = filters.order === 'desc' ? 'DESC' : 'ASC';
  sql += ` ORDER BY ${column} ${direction}, id ASC`;

  const [rows] = await pool.query(sql, params);

  return rows;
}

export async function getFlight(id) {
  const [rows] = await pool.query(
    `SELECT ${LIST_COLUMNS} FROM flights WHERE id = ?`,
    [id],
  );

  return rows[0] ?? null;
}

export async function createFlight(data) {
  try {
    const [result] = await pool.query(
      `INSERT INTO flights (
         airline, flight_number, departure_city, arrival_city,
         departure_time, arrival_time, total_seats, available_seats,
         price, active, image_url
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.airline,
        data.flightNumber,
        data.departureCity,
        data.arrivalCity,
        data.departureTime,
        data.arrivalTime,
        data.totalSeats,
        data.availableSeats,
        data.price,
        data.active ? 1 : 0,
        data.imageUrl || null,
      ],
    );

    return { row: await getFlight(result.insertId) };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return {
        error: {
          status: 409,
          code: 'CONFLICT',
          message: 'A flight with this flight number and departure time already exists.',
        },
      };
    }
    throw error;
  }
}

export async function updateFlight(id, data) {
  const existing = await getFlight(id);

  if (existing === null) {
    return null;
  }

  try {
    await pool.query(
      `UPDATE flights SET
         airline = ?, flight_number = ?, departure_city = ?, arrival_city = ?,
         departure_time = ?, arrival_time = ?, total_seats = ?, available_seats = ?,
         price = ?, active = ?, image_url = ?
       WHERE id = ?`,
      [
        data.airline,
        data.flightNumber,
        data.departureCity,
        data.arrivalCity,
        data.departureTime,
        data.arrivalTime,
        data.totalSeats,
        data.availableSeats,
        data.price,
        data.active ? 1 : 0,
        data.imageUrl || null,
        id,
      ],
    );

    return { row: await getFlight(id) };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return {
        error: {
          status: 409,
          code: 'CONFLICT',
          message: 'A flight with this flight number and departure time already exists.',
        },
      };
    }
    throw error;
  }
}

export async function deleteFlight(id) {
  const existing = await getFlight(id);

  if (existing === null) {
    return null;
  }

  await pool.query('DELETE FROM flights WHERE id = ?', [id]);

  return existing;
}

// ---------------------------------------------------------------------------
// Availability and Reservation / Release inter-service endpoints
// ---------------------------------------------------------------------------

export async function checkAvailability(id) {
  const [rows] = await pool.query(
    'SELECT id, available_seats, total_seats, active FROM flights WHERE id = ?',
    [id],
  );

  return rows[0] ?? null;
}

export async function reserve(id, quantity, reservationId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT id, available_seats, total_seats, active FROM flights WHERE id = ? FOR UPDATE',
      [id],
    );

    const flight = rows[0];

    if (!flight) {
      await connection.rollback();

      return { status: 404, body: { code: 'NOT_FOUND' } };
    }

    const decision = checkReserveAvailability(flight, quantity);

    if (!decision.ok) {
      await connection.rollback();

      return {
        status: 409,
        body: {
          code: decision.code,
          message: decision.message,
          details: decision.details,
        },
      };
    }

    await connection.query(
      'UPDATE flights SET available_seats = available_seats - ? WHERE id = ?',
      [quantity, id],
    );

    await connection.query(
      `INSERT INTO flight_seat_movements
         (flight_id, reservation_id, delta, reason)
       VALUES (?, ?, ?, 'RESERVATION')`,
      [id, reservationId ?? null, -quantity],
    );

    await connection.commit();

    return {
      status: 200,
      body: {
        id,
        availableSeats: flight.available_seats - quantity,
        totalSeats: flight.total_seats,
        capacity: flight.total_seats,
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
      'SELECT id, available_seats, total_seats, active FROM flights WHERE id = ? FOR UPDATE',
      [id],
    );

    const flight = rows[0];

    if (!flight) {
      await connection.rollback();

      return { status: 404, body: { code: 'NOT_FOUND' } };
    }

    const available = availabilityAfterRelease(flight, quantity);

    await connection.query(
      'UPDATE flights SET available_seats = ? WHERE id = ?',
      [available, id],
    );

    await connection.query(
      `INSERT INTO flight_seat_movements
         (flight_id, reservation_id, delta, reason)
       VALUES (?, ?, ?, 'RELEASE')`,
      [id, reservationId ?? null, quantity],
    );

    await connection.commit();

    return {
      status: 200,
      body: {
        id,
        availableSeats: available,
        totalSeats: flight.total_seats,
        capacity: flight.total_seats,
      },
    };
  } catch (error) {
    await connection.rollback();

    throw error;
  } finally {
    connection.release();
  }
}
