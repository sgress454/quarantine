var assert = require('assert');
var fibFn = "(function fibonacci(n) {if (n < 2){return 1;}else{return fibonacci(n-2) + fibonacci(n-1);}})";
var deasync = require('deasync');
var quarantine;

describe('Single worker :: ', function () {

  before(function() {
    quarantine = require('../')(250, {numWorkers: 1});
  });

  after(function() {
    quarantine.kill();
  });

  describe('Basic usage (sync) ::', function() {

    describe('Given a simple, correct Javascript function', function() {

      it ('the worker should return "ok" with the correct result', function(done) {

        try {
          var result = deasync(function(cb){return quarantine("(function(){return 123;})()", cb);}) ();
          assert.equal(result, 123);
          return done();
        } catch (e) {
          return done(e);
        }

      });

      it ('even when the main loop is blocked', function(done) {
        setTimeout(function() {
          try {
            var result = deasync(function(cb){return quarantine("(function fibonacci(n) {if (n < 2){return 1;}else{return fibonacci(n-2) + fibonacci(n-1);}})(20)", cb);})();
            assert.equal(result, 10946);
            return done();
          } catch (e) {
            return done(e);
          }
        },1);
        setTimeout(function() {
          (function fibonacci(n) {if (n < 2){return 1;}else{return fibonacci(n-2) + fibonacci(n-1);}})(40);
        },2);
      });


    });  

    xdescribe('Given a Javascript function with an error', function() {

      it ('the worker should return "ok" with the correct result', function(done) {

        quarantine("(function(){return foo;})()", function(err, result) {

          assert (err);
          assert.equal (err.message, "foo is not defined");
          return done();

        });

      });

    });  

    xdescribe('Given a Javascript function that takes longer than 250 ms to complete', function() {

      it ('quarantine should respond with a timeout error', function(done) {

        quarantine(fibFn + "(100)", function(err, result) {
          assert (err);
          assert.equal (err.code, "E_WORKER_TIMEOUT");
          return done();

        });

      });

    }); 

    xdescribe('Passing in context', function() {

      it ('the worker should return "ok" with the correct result', function(done) {

        quarantine({foo: 123}, "(function(){return foo;})()", function(err, result) {
          assert (!err);
          assert.equal(result, 123);
          return done();

        });

      });

    });  

  });

  xdescribe("Overriding timeout to 1000ms", function() {

    describe('Given a Javascript function that takes longer than 250 ms to complete', function() {

      it ('quarantine should respond with the correct result', function(done) {
        this.timeout(5000);
        quarantine(fibFn + "(40)", {timeout: 5000}, function(err, result) {
          assert (!err);
          assert.equal (result, 165580141);
          return done();

        });

      });

    }); 
  });
  
});

