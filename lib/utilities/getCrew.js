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
function getCrew (job) {
  var crew = crews[job];
  return crew ? crew() : null;
};

module.exports = function (data) {
  var crew = {
    director: [],
    writer: [],
    music: []
  };

  data.forEach(function (person) {
    var crewType = getCrew(person.job);
    if (crewType) { crew[crewType].push(person.name); }
  });

  return crew;
};
