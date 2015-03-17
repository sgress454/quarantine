/**
 * Coordinate quarantine of dangerous code using an airlock
 * @author sgress454
 */


/**
 * Module dependencies
 */
var path = require('path');


// Reference to the airlock process
var airlock;

// Allowable time for worker to run before timing out
var timeout = 250;


module.exports = function(_timeout) {

	// Set the timeout to whatever the user desires, or the default
	timeout = _timeout || timeout;

	// Return a reference to the "run function"
	return run;

};


/**
 * Given a context, script and cb, run the script in a sandbox
 * @param  {object}   context The context that the script should run in 
 * @param  {string}   script  The script to run
 * @param  {Function} cb      Callback to return results from the script execution
 */
function run(context, script, cb) {

	// If we don't have an airlock spun up already, create one now
	if (!airlock) {
		airlock = spinUpAirlock(timeout);
	}

	// Send the context and script into the airlock.  The airlock will pass
	// the script down to the worker and handle timeout
	airlock.send({
      context: context,
      script: script
	});

	// When a message is received from the airlock, handle accordingly
	airlock.on("message", returnResult);

	// If the airlock itself crashes, tell the caller
	airlock.on('exit', onExit);

	function onExit() {

		// Remove listeners added to the airlock for this run
		airlock.removeListener("message", returnResult);
		airlock.removeListener("exit", onExit);

		airlock = spinUpAirlock(timeout);
		var timeoutError = new Error("Airlock crashed!");
		timeoutError.code = 'E_AIRLOCK_CRASHED';
		return cb(timeoutError);

	}

	function returnResult(result) {

		// Remove listeners added to the airlock for this run
		airlock.removeListener("message", returnResult);
		airlock.removeListener("exit", onExit);

		// If we get the all clear, return the result of running the script
		if (result.status == 'ok') {
		  return cb(null, result.result);
		}

		// If the quarantine worker timed out, it means some really nasty
		// code got put in there
		if (result.status == 'worker_timeout') {
		  var timeoutError = new Error("Worker timed out!");
		  timeoutError.code = 'E_WORKER_TIMEOUT';
		  return cb(timeoutError);
		}

		// Otherwise it was just a regular error in the evaluated code
		return cb(new Error(result.result));
	}

}

// Before we die, kill the airlock (which will kill the worker)
process.on('exit', function() {
	airlock && airlock.kill('SIGHUP');
});

// Spin up a new airlock
function spinUpAirlock(timeout) {
  airlock = require('child_process').fork(path.resolve(__dirname, "airlock.js"), [timeout]);
  // If the airlock dies, respawn it
  airlock.on('exit', spinUpAirlock);
  return airlock;
}
