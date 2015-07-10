var db         = require('../db').r;
var request    = require('request');
var moment     = require('moment');
var hypermedia = require('../services/hypermedia');
var movie      = require('../services/movie');

function list (req, res, next) {
  var skip  = parseInt(req.query.skip, 10) || 0;
  var limit = parseInt(req.query.limit, 10) || 50;

  db.table('movies')
    .orderBy(db.asc('title'))
    .skip(skip)
    .limit(limit)
    .run(db.conn)
    .then(function (cursor) { return cursor.toArray(); })
    .then(function (movies) {
      var result = {
        movies: movies,
        _links: hypermedia.movies(skip, limit, 10000)
      };
      res.send(result);
      return next();
    })
    .catch(next);
}

function details (req, res, next) {
  db.table('movies')
    .get(req.params.id)
    .run(db.conn)
    .then(function (movies) {
      res.send(movies);
      return next();
    })
    .catch(next);
}

function addToUser (userid, date, rating, id) {
  date = date ? moment(date).format() : moment().format();

  db.table('seen')
    .getAll(userid, { index: 'user' })
    .update({
      movies: db.row('movies').append({
        id: id,
        dates: [{
          date: date
        }],
        rating: rating
      })
    })
    .run(db.conn);
}

function add (req, res, next) {
  var id     = req.params.id;
  var date   = req.params.date;
  var userid = req.params.userid;
  var rating = req.params.rating;

  if (!id) {
    res.send(400, {
      message: 'No IMDb ID'
    });
    return;
  }

  if (!rating) {
    res.send(400, {
      message: 'No rating'
    });
    return;
  }

  if (!userid) {
    res.send(400, {
      message: 'No user id'
    });
    return;
  }

  db.table('movies')
    .getAll(id, { index: 'imdb' })
    .run(db.conn)
    .then(function (cursor) { return cursor.toArray(); })
    .then(function (exists) {
      if (!exists.length) {
        movie(id)
          .then(function (movie) {
            db.table('movies')
              .insert(movie)
              .run(db.conn)
              .then(function (insert) {
                var id = insert.generated_keys[0];
                addToUser(userid, date, rating, id);
                res.send(200);
              });
          });
      } else {
        var existsId = exists[0].id;
        updateUser(userid, date, rating, existsId);
        res.send(200);
      }
    });
}

module.exports = {
  list: list,
  details: details,
  add: add
};
