var db = require('../db').r;
var hypermedia = require('../services/hypermedia');
var compileStats = require('../services/stats');

function addRatings (stats) {
  return new Promise(function (resolve, reject) {
    var ratingsArray = {
      ratings: [0,0,0,0,0,0,0,0,0,0,0]
    };

    db.table('ratings')
      .run(db.conn)
      .then(function (cursor) { return cursor.toArray(); })
      .then(function (ratings) {
        ratings.forEach(function (rating, i) {
          // Rating distribution
          ratingsArray.ratings[rating.rating]++;

          if (i === ratings.length -1) {
            resolve(_.merge(ratingsArray, stats));
          }
        });
      });

  });
}

function latest(req, res, next) {
  var id = req.params.id;
  var skip  = parseInt(req.query.skip, 10) || 0;
  var limit = parseInt(req.query.limit, 10) || 50;

  db.table('views')
    .getAll(id, { index: 'user' })
    .orderBy(db.desc('date'))
    .skip(skip)
    .limit(limit)
    .merge(function (movie) {
    	return {
      	dates: db.table('views')
        	.getAll(movie('movie'), { index: 'movie' })
          .filter(function (views) {
          	return views('user')
            	.eq(id);
            })
          .pluck('date')
          .coerceTo('array')
       };
    })
    .merge(function (movie) {
      return {
        rating: db.table('ratings')
          .getAll(movie('movie'), { index: 'movie' })
          .filter(function (ratings) {
          	return ratings('user')
  						.eq(id);
           })
           .pluck('rating')
           .coerceTo('array')('rating')
           .reduce(function (left, right) {
           	 return left.add(right);
           })
      };
    })
    .merge(function (movie) {
      return db.table('movies')
        .get(movie('movie'));
    })
    .run(db.conn)
    .then(function (cursor) { return cursor.toArray(); })
    .then(function (movies) {
      var result = {
        skip: skip,
        limit: limit,
        movies: movies
      };

      res.send(result);
      return next();
    })
    .catch(next);
}

function list(req, res, next) {
  db.table('users')
    .limit(50)
    .run(db.conn)
    .then(function (cursor) { return cursor.toArray(); })
    .then(function (movies) {
      res.send(movies);
      return next();
    })
    .catch(next);
}

function details(req, res, next) {
  db.table('users')
    .get(req.params.id)
    .run(db.conn)
    .then(function (movies) {
      res.send(movies);
      return next();
    })
    .catch(next);
}

function movies(req, res, next) {
  var skip  = parseInt(req.query.skip, 10) || 0;
  var limit = parseInt(req.query.limit, 10) || 50;
  var id    = req.params.id;

  db.table('seen')
    .getAll(id, { index:'user' })
    .map(function (user) {
      return {
        user: user('user'),
        id: user('id'),
        meta: {
          skip: skip,
          limit: limit,
          total: user('movies').count()
        },
        movies: user('movies')
          .skip(skip)
          .limit(limit)
          .map(function (movie) {
            return {
              id: movie
            };
          })
          .merge(function (movie) {
            return {
              totalViews: db.table('views')
                  .getAll(movie('id'), { index: 'movie' })
                  .count(),
              averageRating: db.table('ratings')
                  .getAll(movie('id'), { index: 'movie' })
                  .avg('rating')
            };
          })
          .merge(function (movie) {
            return {
              dates: db.table('views')
                .getAll(movie('id'), { index: 'movie' })
                .filter(function (views) {
          			  return views('user').eq(id);
                })
                .pluck('date')
                .coerceTo('array')
            };
          })
          .merge(function (movie) {
            return {
              rating: db.table('ratings')
                .getAll(movie('id'), { index: 'movie' })
                .filter(function (ratings) {
                  return ratings('user').eq(id);
                })
               	.pluck('rating')
               	.coerceTo('array')('rating')
                .reduce(function (left, right) {
                  return left.add(right);
                })
            };
          })
          .merge(function (movie) {
            return db.table('movies')
              .get(movie('id'));
          })
      };
  })
  .run(db.conn)
  .then(function (cursor) { return cursor.toArray(); })
  .then(function (user) {
    user = user[0];
    user._links = hypermedia.user(id, skip, limit, user.meta.movies);
    res.send(user);
    return next();
  })
  .catch(next);
}

function stats(req, res, next) {
  var id = req.params.id;

  db.table('seen')
    .getAll(id, { index:'user' })
    .map(user => {
      return {
        user: user('user'),
        id: user('id'),
        movies: user('movies')
          .map(movie => ({ id: movie }))
          .merge(movie => {
            return {
              dates: db.table('views')
                .getAll(movie('id'), { index: 'movie' })
                .filter(views => views('user').eq(id))
                .pluck('date')
                .coerceTo('array')
            };
          })
          .merge(movie => {
            return {
              rating: db.table('ratings')
                .getAll(movie('id'), { index: 'movie' })
                .filter(ratings => ratings('user').eq(id))
               	.pluck('rating')
               	.coerceTo('array')('rating')
                .reduce((left, right) => left.add(right))
            };
          })
          .merge(movie => db.table('movies').get(movie('id')))
      };
  })
  .run(db.conn)
  .then(cursor => cursor.toArray())
  .then(movies => {
    res.send(compileStats(movies[0].movies));
    return next();
  })
  .catch(next);
}

module.exports = {
  latest: latest,
  list: list,
  details: details,
  movies: movies,
  stats: stats
};
