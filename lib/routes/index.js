var movies = require('./movies');
var users = require('./users');
var authentication = require('./authentication');

function attach(server) {

  // Movies
  server.get('/movies', movies.list);
  server.get('/movies/:id', movies.details);
  server.post('/movies', movies.add);

  // Users
  server.get('/users', users.list);
  server.get('/users/:id', users.details);
  server.get('/users/:id/movies', users.movies);

  // Register / Login
  server.post('/register', authentication.register);
  server.post('/login', authentication.login);
}

module.exports = {
  attach: attach
};
