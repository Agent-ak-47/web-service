export function formatIso(val) {
  if (!val) return '';

  if (val instanceof Date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${val.getFullYear()}-${pad(val.getMonth() + 1)}-${pad(val.getDate())}T${pad(val.getHours())}:${pad(val.getMinutes())}:${pad(val.getSeconds())}`;
  }

  const str = String(val).trim();
  return str.replace(' ', 'T');
}

export function flightJson(row) {
  return {
    id: Number(row.id),
    airline: row.airline ?? '',
    flightNumber: row.flight_number ?? '',
    departureCity: row.departure_city ?? '',
    arrivalCity: row.arrival_city ?? '',
    departureTime: formatIso(row.departure_time),
    arrivalTime: formatIso(row.arrival_time),
    totalSeats: Number(row.total_seats ?? 0),
    availableSeats: Number(row.available_seats ?? 0),
    price: Number(row.price ?? 0),
    imageUrl: row.image_url ?? '',
    active: Boolean(row.active),
  };
}

export function availabilityJson(row, id) {
  const availableSeats = Number(row.available_seats ?? 0);
  const totalSeats = Number(row.total_seats ?? 0);

  return {
    id: Number(row.id ?? id),
    availableSeats,
    totalSeats,
    capacity: totalSeats,
  };
}
