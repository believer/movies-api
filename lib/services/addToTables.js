var db     = require('../db').r;
var moment = require('moment');

function addToUser (userid, id) {
  db.table('seen')
    .getAll(userid, { index: 'user' })
    .update({
      movies: db
        .row('movies')
        .append(id)
    })
    .run(db.conn);
}

function updateUser (userid, id) {
  db.table('seen')
    .getAll(userid, { index: 'user' })
    .filter(db.row('movies').contains(function (movie) {
      return movie.eq(id);
    }))
    .run(db.conn)
    .then(function(cursor) { return cursor.toArray(); })
    .then(function (exists) {
      if (!exists.length) {
        addToUser(userid, id);
      }
    });
}


function view (userid, date, id) {
  date = date ? moment(date).format() : moment().format();

  db.table('views')
    .insert({
      date: date,
      movie: id,
      user: userid
    })
    .run(db.conn);
}

function addRating (userid, rating, id) {
  db.table('ratings')
    .insert({
      rating: rating,
      movie: id,
      user: userid
    })
    .run(db.conn);
}

function updateRating (userid, rating, id) {
  db.table('ratings')
    .getAll(userid, { index: 'user' })
    .filter(function (ratings) {
      return ratings('movie').eq(id);
    })
    .run(db.conn)
    .then(function(cursor) { return cursor.toArray(); })
    .then(function (exists) {
      if (!exists.length) {
        addRating(userid, rating, id);
      } else {
        db.table('ratings')
          .getAll(userid, { index: 'user' })
          .filter(db.row('movie').eq(id))
          .update({
            rating: rating
          })
          .run(db.conn);
      }
    });
}

module.exports = {
  user: addToUser,
  updateUser: updateUser,
  view: view,
  addRating: addRating,
  updateRating: updateRating
};
