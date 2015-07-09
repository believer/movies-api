function movies (skip, limit, total) {
  var hypermedia = {};
  var base = 'http://localhost:3000/movies';

  if (skip < total) {
    hypermedia['next'] = {
      href: base + '?skip=' + (skip + 50)
    };
  }

  if (skip > 0) {
    hypermedia['prev'] = {
      href: base + '?skip=' + (skip - 50)
    };
  }

  return hypermedia;
}

function user (userid, skip, limit, total) {
  var hypermedia = {};
  var base = 'http://localhost:3000/users/' + userid + '/movies';

  if (skip < total && total > limit) {
    hypermedia['next'] = {
      href: base + '?skip=' + (skip + 50)
    };
  }

  if (skip > 0) {
    hypermedia['prev'] = {
      href: base + '?skip=' + (skip - 50)
    };
  }

  return hypermedia;
}

module.exports = {
  movies: movies,
  user: user
};
