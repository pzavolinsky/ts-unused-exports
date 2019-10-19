const getExportsString = analysis => Object.values(analysis)
  .reduce((acc, ex) => [...acc, ...ex], []);

module.exports = {
  getExportsString,
}
