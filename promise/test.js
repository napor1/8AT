// npx promises-aplus-tests test.js
const ThePromise = require('./thenPromise');

ThePromise.deferred = function () {
  const obj = {};
  obj.promise = new ThePromise(function (resolve, reject) {
    obj.resolve = resolve;
    obj.reject = reject;
  });
  return obj;
};

module.exports = ThePromise;