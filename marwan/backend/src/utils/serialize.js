// Maps a database row (snake_case columns) to the frozen camelCase JSON
// contract documented in md/09-frontend-server-db-contract.md § 3.2.
//
//   duration_minutes -> dureeMinutes   (French spelling kept in the contract)
//   available_places -> availableSeats
//   active           -> available
//   image_url        -> imageUrl
export function excursionJson(row) {
  return {
    id: Number(row.id),
    title: row.title ?? '',
    location: row.location ?? '',
    description: row.description ?? '',
    date: row.date ?? '',
    startTime: row.start_time ?? '',
    dureeMinutes: Number(row.duration_minutes ?? 0),
    capacity: Number(row.capacity ?? 0),
    availableSeats: Number(row.available_places ?? 0),
    price: Number(row.price ?? 0),
    guide: row.guide ?? '',
    imageUrl: row.image_url ?? '',
    available: Boolean(row.active),
  };
}

export function availabilityJson(row, id) {
  return {
    id: Number(row.id ?? id),
    availableSeats: Number(row.available_places ?? 0),
    capacity: Number(row.capacity ?? 0),
  };
}
