var movies = require('./movies');
var movies = require('./users');

function attach(server) {

  // Movies
  server.get('/movies', movies.list);
  server.get('/movies/:id', movies.details);
  server.post('/add', movies.add);

  server.get('/users', users.list);
  server.get('/users/:id', users.details);
  server.get('/users/:id/movies', users.movies);
}

module.exports = {
  attach: attach
};
