// Fills the database with test data:  npm run seed
// Run it AFTER the migrations (npm run migration:run).
//
// Safe to run many times: every record is looked up first by what makes it
// unique (film title, hall name, film+hall+start time, booked seats) and is
// created only if it isn't there yet. So a second run creates nothing.
import AppDataSource from './data-source.js';
import { BookingSeat } from './bookings/entities/booking-seat.entity.js';
import { Booking } from './bookings/entities/booking.entity.js';
import { Film } from './films/entities/film.entity.js';
import { Hall } from './halls/entities/hall.entity.js';
import { Showing } from './showings/entities/showing.entity.js';
import type { EntityManager } from 'typeorm';

const FILMS = [
  {
    title: 'Seed: Shadows of Forgotten Ancestors',
    durationMinutes: 97,
    releaseYear: 1965,
  },
  { title: 'Seed: The Tribe', durationMinutes: 132, releaseYear: 2014 },
];

const HALLS = [
  { name: 'Seed: Big hall', rows: 10, seatsPerRow: 12 },
  { name: 'Seed: Small hall', rows: 4, seatsPerRow: 6 },
];

// Fixed dates far in the future: fixed, so a re-run finds the same showings;
// future, so they look like real upcoming showings to the API.
const SHOWINGS = [
  { film: 0, hall: 0, startsAt: '2030-06-01T17:00:00.000Z', price: 15000 },
  { film: 1, hall: 1, startsAt: '2030-06-02T10:00:00.000Z', price: 9000 },
  { film: 0, hall: 1, startsAt: '2030-06-03T19:30:00.000Z', price: 17500 },
  { film: 1, hall: 0, startsAt: '2030-06-04T15:00:00.000Z', price: 12500 },
];

// One booking: two seats on the first showing.
const BOOKING = {
  showing: 0,
  seats: [
    { row: 5, seat: 6 },
    { row: 5, seat: 7 },
  ],
};

async function findOrCreateFilm(
  m: EntityManager,
  data: (typeof FILMS)[number],
) {
  const existing = await m.findOneBy(Film, { title: data.title });
  if (existing) return { entity: existing, created: false };
  return { entity: await m.save(m.create(Film, data)), created: true };
}

async function findOrCreateHall(
  m: EntityManager,
  data: (typeof HALLS)[number],
) {
  const existing = await m.findOneBy(Hall, { name: data.name });
  if (existing) return { entity: existing, created: false };
  return { entity: await m.save(m.create(Hall, data)), created: true };
}

async function seed(): Promise<void> {
  await AppDataSource.initialize();
  const counts = { films: 0, halls: 0, showings: 0, bookings: 0 };

  // Everything in one transaction: if anything fails, nothing is half-seeded.
  await AppDataSource.transaction(async (m) => {
    const films: Film[] = [];
    for (const data of FILMS) {
      const { entity, created } = await findOrCreateFilm(m, data);
      films.push(entity);
      counts.films += Number(created);
    }

    const halls: Hall[] = [];
    for (const data of HALLS) {
      const { entity, created } = await findOrCreateHall(m, data);
      halls.push(entity);
      counts.halls += Number(created);
    }

    const showings: Showing[] = [];
    for (const s of SHOWINGS) {
      const key = {
        filmId: films[s.film].id,
        hallId: halls[s.hall].id,
        startsAt: new Date(s.startsAt),
      };
      let showing = await m.findOneBy(Showing, key);
      if (!showing) {
        showing = await m.save(m.create(Showing, { ...key, price: s.price }));
        counts.showings++;
      }
      showings.push(showing);
    }

    const showing = showings[BOOKING.showing];
    const alreadyBooked = await m.existsBy(BookingSeat, {
      showingId: showing.id,
      row: BOOKING.seats[0].row,
      seat: BOOKING.seats[0].seat,
    });
    if (!alreadyBooked) {
      const booking = await m.save(
        m.create(Booking, {
          showingId: showing.id,
          totalPrice: showing.price * BOOKING.seats.length,
        }),
      );
      await m.save(
        BOOKING.seats.map((s) =>
          m.create(BookingSeat, {
            ...s,
            bookingId: booking.id,
            showingId: showing.id,
          }),
        ),
      );
      counts.bookings++;
    }
  });

  console.log(
    `Seed finished. Created: ${counts.films} films, ${counts.halls} halls, ` +
      `${counts.showings} showings, ${counts.bookings} bookings ` +
      `(0 everywhere = data was already there).`,
  );
}

seed()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => AppDataSource.destroy());
