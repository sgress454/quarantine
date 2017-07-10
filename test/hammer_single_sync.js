var assert = require('assert');
var async = require('async');
var deasync = require('deasync');

var fibFn = "(function fibonacci(n) {if (n < 2){return 1;}else{return fibonacci(n-2) + fibonacci(n-1);}})";

var quarantine;
var iterator = [];
for (var i = 50; i > 0; i--) {iterator.push(i);}

describe('Single worker :: ', function () {

  before(function() {
    quarantine = require('../')(12, {numWorkers: 1});
  });

  after(function() {
    quarantine.kill();
  });

  describe('Hammering the worker (sync) with 50 requests ::', function() {

    describe('Given a simple, correct Javascript function', function() {

      it ('the workers should return "ok" with the correct result', function(done) {

        async.each(iterator, function(i, cb) {

          try {
            var result = deasync(function(cb){return quarantine("(function(){return "+i.toString()+";})()", cb);})();
            assert.equal(result, i);
            return cb();
          } catch (e) {
            return cb(e);
          }
  
        }, done);

      });

      it.only ('even if the main loop is blocked', function(done) {

        async.parallel([
          function(cb) {
            async.each(iterator, function(i, cb) {
              try {
                var result = deasync(function(cb){return quarantine("(function(){return "+i.toString()+";})()", cb);})();
                assert.equal(result, i);
                return cb();
              } catch (e) {
                return cb(e);
              }
      
            }, cb);            
          },
          function(cb) {
            (function fibonacci(n) {if (n < 2){return 1;}else{return fibonacci(n-2) + fibonacci(n-1);}})(40);  
            return cb();            
          }
        ], done);


      });


    });  

    describe('Given a Javascript function with an error', function() {

      it ('the workers should return an error', function(done) {

        async.each(iterator, function(i, cb) {
  
          var script = "(function(){return foo"+i+";})()";
          quarantine(script, function(err, result) {
            assert(err);
            assert.equal(err.message, "foo"+i+" is not defined");
            return cb();
          });
          
        }, done);

      });

    });  

    describe('Given a Javascript function that takes longer than 250 ms to complete', function() {

      it ('quarantine should respond with 50 timeout errors', function(done) {

        this.timeout(500 * 51);

        async.each(iterator, function(i, cb) {
  
          var script = "(function(){return foo"+i+";})()";
          quarantine(fibFn + "(100)", function(err, result) {
            assert(err);
            assert.equal (err.code, "E_WORKER_TIMEOUT");
            return cb();
          });
          
        }, done);

      });

    }); 
  });
  
});

