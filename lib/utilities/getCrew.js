var crews = {
  Director: function () { return 'director'; },
  Writing: function () {  return 'writer'; },
  Screenplay: function () { return 'writer'; },
  Writer: function () { return 'writer'; },
  Music: function () {  return 'music'; },
  'Original Music Composer': function () {  return 'music'; }
};

/**
 * Collect the crew members of a movie
 * @param  {string} job - Type of job
 * @return {[type]}     [description]
 */
module.exports = function (job) {
  var crew = crews[job];
  return crew ? crew() : null;
};
