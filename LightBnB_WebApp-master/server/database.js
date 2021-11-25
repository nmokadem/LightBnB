const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */

const getUserWithEmail = function(email) {
  const query = `SELECT * FROM users WHERE email = $1`;
  const params = [email];
  return pool.query(query, params)
  .then(res => res.rows[0])
  .catch((err => console.error('query error', err.stack)));
}


exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */

const getUserWithId = function(id) {
  const query = `SELECT * FROM users WHERE id = $1`;
  const params = [id];
  return pool.query(query, params)
  .then(res => res.rows[0])
  .catch((err => console.error('query error', err.stack)));
}


exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */

const addUser =  function(user) {
  const query = `
     INSERT INTO users (name, email, password)
     VALUES ($1, $2, $3) RETURNING *;`;
  const params = [user.name, user.email, user.password];

  return pool.query(query,params)
  .then(res => res.rows[0])
  .catch((err => console.error('query error', err.stack)));
}

exports.addUser = addUser;


/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  const query = `
    SELECT reservations.*, properties.*, AVG(property_reviews.rating) as average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    JOIN users ON reservations.guest_id = users.id
    WHERE users.id = $1 AND 
          reservations.end_date < NOW()::date
    GROUP BY reservations.id, properties.id
    ORDER BY reservations.start_date
    LIMIT $2;`;
  const params = [guest_id,limit];

  return pool.query(query, params)
  .then(res => res.rows)
  .catch((err => console.error('query error', err.stack)));
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
    // 1
    const params = [];
    // 2
    let query = `
    SELECT properties.*, avg(property_reviews.rating) as average_rating
    FROM properties
    LEFT JOIN property_reviews ON properties.id = property_id
    `;
  
    // 3
    // option = city
    if (options.city) {
      params.push(`%${options.city}%`);
      query += `WHERE city LIKE $${params.length} `;
    }

    // option = owner_id
    if (options.owner_id) {
      params.push(`${options.owner_id}`);

      if (params.length > 2) {
        query += `AND owner_id = $${params.length} `;
      } else {
        query += `WHERE owner_id = $${params.length} `;
      }
    }

    // option = minimum price
    if (options.minimum_price_per_night) {
      params.push(options.minimum_price_per_night * 100);

      if (params.length >= 2) {
        query += `AND cost_per_night >= $${params.length} `;
      } else {
        query += `WHERE cost_per_night >= $${params.length} `;
      }
    }

    // option = maximum price
    if (options.maximum_price_per_night) {
      params.push(options.maximum_price_per_night * 100);

      if (params.length >= 2) {
        query += `AND cost_per_night <= $${params.length} `;
      } else {
        query += `WHERE cost_per_night <= $${params.length} `;
      }
    }

    //option == minimum rating 
    if (options.minimum_rating) {
      params.push(options.minimum_rating);

      if (params.length >= 2) {
        query += `AND rating >= $${params.length} `;
      } else {
        query += `WHERE rating >= $${params.length} `;
      }
    }
  
    // 4
    params.push(limit);
    query += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $${params.length};
    `;
  
    // 5
    console.log(query, params);
  
    // 6
    return pool.query(query, params)
    .then(res => res.rows);
}
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  // const propertyId = Object.keys(properties).length + 1;
  // property.id = propertyId;
  // properties[propertyId] = property;
  // return Promise.resolve(property);
  const query = `
  INSERT INTO properties (owner_id, title, description,
    thumbnail_photo_url, cover_photo_url,
    cost_per_night,
    street, city, province, post_code, country,
    parking_spaces, number_of_bathrooms, number_of_bedrooms)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *;`;

  const params = [property.owner_id, property.title, property.description,
                property.thumbnail_photo_url, property.cover_photo_url,
                property.cost_per_night, 
                property.street, property.city, property.province, property.post_code, property.country,
                property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms];

return pool.query(query,params)
.then(res => {
  res.rows[0]})
.catch((err => console.error('query error', err.stack)));

}
exports.addProperty = addProperty;




  