var db = require('../db').r;
var request = require('request');
var hypermedia = require('../services/hypermedia');
var movie = require('../services/movie');
var addToTables = require('../services/addToTables');
var _ = require('lodash');
var tmdb = require('../services/tmdb');

function list (req, res, next) {
  const skip  = parseInt(req.query.skip, 10) || 0;
  const limit = parseInt(req.query.limit, 10) || 50;

  db.table('movies')
    .orderBy(db.asc('title'))
    .skip(skip)
    .limit(limit)
    .run(db.conn)
    .then(cursor => cursor.toArray())
    .then(movies => {
      const result = {
        movies: movies,
        _links: hypermedia.movies(skip, limit, 10000)
      };

      res.send(result);
      return next();
    })
    .catch(next);
}

function details (req, res, next) {
  const id = req.params.id;

  db.table('movies')
    .get(id)
    .run(db.conn)
    .then(movies => {
      res.send(movies);
      return next();
    })
    .catch(next);
}

function add (req, res, next) {
  if (!req.params.id) {
    res.send(500, {
      message: 'No IMDb ID'
    });

    return next();
  }

  if (!req.params.rating) {
    res.send(500, {
      message: 'Rating can not be empty'
    });

    return next();
  }

  var id = req.params.id.match(/tt\d+/);
  var date = req.params.date;
  var userid = req.params.userid;
  var rating = parseInt(req.params.rating, 10);

  if (!id[0]) {
    res.send(500, {
      message: 'No IMDb ID'
    });

    return next();
  }

  if (!userid) {
    res.send(500, {
      message: 'No User ID'
    });

    return next();
  }

  id = id[0];

  db.table('movies')
    .getAll(id, { index: 'imdb' })
    .run(db.conn)
    .then(cursor => cursor.toArray())
    .then(exists => {
      if (!exists.length) {
        movie(id)
          .then(movieToInsert => {
            db.table('movies')
              .insert(movieToInsert)
              .run(db.conn)
              .then(insert => {
                const id = insert.generated_keys[0];

                if (userid) {
                  addToTables.user(userid, id);
                  addToTables.view(userid, date, id);
                }

                if (rating) {
                  addToTables.addRating(userid, rating, id);
                }

                res.send(insert);
              })
              .catch(err => console.error('Failed movie insert', err));
          })
          .catch(err => {
            console.error('Failed movie creation', err)
            
            if (err.status === 404) {
              res.send(404, { message: 'Movie not found in TMDb' })
            }
          });
      } else {
        var existsId = exists[0].id;

        if (userid) {
          addToTables.updateUser(userid, existsId);
          addToTables.view(userid, date, existsId);
        }

        if (rating) {
          addToTables.updateRating(userid, rating, existsId);
        }

        db.table('watchlist')
          .getAll(userid, { index: 'user' })
          .filter(movie => movie('movie').eq(existsId))
          .delete()
          .run(db.conn)
          .then(console.log.bind(console))
          .catch(console.error.bind(console))

        res.send(exists[0]);
      }
    })
    .catch(error => {
      res.send(500, error);
    })
}

function asyncEach(array, iterator, delay) {
    void function iteration(index) {
        if (index === array.length) return
        iterator(array[index], index)
        setTimeout(function () { iteration(index + 1) }, delay)
    }(0)
}

function update (req, res, next) {
  db.table('movies')
    .run(db.conn)
    .then(cursor => cursor.toArray())
    .then(movies => {
      asyncEach(movies, (dbMovie, i) => {
        movie(dbMovie.ids.imdb || dbMovie.ids.tmdb)
          .then(info => {
            var merged = _.merge(dbMovie, info);

            db.table('movies')
              .get(dbMovie.id)
              .update(merged)
              .run(db.conn)
              .then(added => {
                console.log(dbMovie.title, added);
              });
          })
          .catch(err => console.error(err))
      }, 10000);
    });
}

function year (req, res, next) {
  if (!req.params.year) {
    res.send(500, {
      message: 'No year provided'
    });

    return next();
  }

  const year = req.params.year;

  db.table('movies')
    .filter(movie => movie('year').eq(year))
    .run(db.conn)
    .then(cursor => cursor.toArray())
    .then(movies => {
      res.send(movies);
    });
}

function imdb (req, res, next) {
  if (!req.params.rating) {
    res.send(422, {
      message: 'No rating provided'
    });

    return next();
  }

  if (parseInt(req.params.rating, 10) > 10) {
    res.send(422, {
      message: 'Rating should be between 0 and 10'
    });

    return next();
  }

  const rating = parseInt(req.params.rating, 10);
  const votes = parseInt(req.params.votes, 10) >= 0 ? parseInt(req.params.votes, 10) : 5000;

  db.table('movies')
    .filter(movie => {
      var imdb = movie('ratings')('imdb');
      return imdb('rating').ge(rating).and(imdb('votes').ge(votes));
    })
    .run(db.conn)
    .then(cursor => cursor.toArray())
    .then(movies => {
      res.send(movies);
    });
}

function rottentomatoes (req, res, next) {
  if (!req.params.rating) {
    res.send(422, {
      message: 'No rating provided'
    });

    return next();
  }

  if (parseInt(req.params.rating, 10) > 10) {
    res.send(422, {
      message: 'Rating should be between 0 and 10'
    });

    return next();
  }

  const rating = parseInt(req.params.rating, 10);

  db.table('movies')
    .filter(movie => movie('ratings')('tomatoes')('rating').ge(rating))
    .run(db.conn)
    .then(cursor => cursor.toArray())
    .then(movies => {
      res.send(movies);
    });
}

module.exports = {
  list: list,
  details: details,
  add: add,
  update: update,
  imdb: { rating: imdb },
  rottentomatoes: { rating: rottentomatoes },
  year: year
};
