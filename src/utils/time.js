function nowIso() {
  return new Date().toISOString();
}

function minutesFromNowIso(minutes) {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

module.exports = {
  nowIso,
  minutesFromNowIso
};
