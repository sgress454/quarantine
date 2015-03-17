/**
 * Coordinate quarantine of dangerous code using a worker
 * @author sgress454
 */

/**
 * Module dependencies
 */
var path = require('path');
var fork = require('child_process').fork;

// Reference to the worker process
var worker;

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

	// Make context optional
	if (typeof context !== 'object') {
		cb = script;
		script = context;
		context = {};
	}

	// Make sure context is always at least an empty object
	if (context === null) {
		context = {};
	}

	// Make cb optional
	if (typeof cb !== 'function') {
		cb = function(){};
	}

	// Spin up a worker if we don't have one
	if (!worker) {spinUpWorker();}

	// Handle messages coming back from the worker
	worker.on("message", handleWorkerMessage);
	// Handle the worker dying an untimely death
	worker.on("exit", handleWorkerExit);

	// Set up a timeout--if the worker takes to long, we'll
	// tell the caller that it failed and respawn it
	var selfDestruct = setTimeout(function() {

		// Remove all the handlers from this (possibly locked, about to be dead) worker
		worker.removeListener("message", handleWorkerMessage);
		worker.removeListener("exit", handleWorkerExit);

		// Kill the worker with extreme prejudice--it'll be respawned automatically
		// by the handler bound in spinUpWorker()
		worker.kill('SIGKILL');

		// Let the caller know it didn't work out
		var timeoutError = new Error("Worker timed out!");
		timeoutError.code = 'E_WORKER_TIMEOUT';
		return cb(timeoutError);

	}, timeout);

	// Give the worker its marching orders
	worker.send({context: context, script: script});

	// Handler a return message from the worker
	function handleWorkerMessage(result) {

		// Clear the self-destruct
		clearTimeout(selfDestruct);

		// Clear the current handlers from the worker
		worker.removeListener("message", handleWorkerMessage);
		worker.removeListener("exit", handleWorkerExit);

		// If we get the all clear, return the result of running the script
		if (result.status == 'ok') {
		  return cb(null, result.result);
		}

		// Otherwise it was just a regular error in the evaluated code
		return cb(new Error(result.result));

	}  

	// Handle the worker dying in the line of duty.
	// 
	// Note that it'll be automatically respawned by the on('exit') event handler
	// inside of spinUpWorker
	function handleWorkerExit() {

		// Clear the self-destruct timeout; worker already died
		clearTimeout(selfDestruct);

		// Clear the current handlers from the worker
		worker.removeListener("message", handleWorkerMessage);
		worker.removeListener("exit", handleWorkerExit);

		// Return an error to the caller
		var workerError = new Error("Worker died!");
		workerError.code = 'E_WORKER_DEATH';
		return cb(workerError);

	}

}

// Spin up a new worker
function spinUpWorker(timeout) {
  worker = fork(path.resolve(__dirname, "worker.js"));
  // If the worker dies, respawn it
  worker.on('exit', spinUpWorker);
  return worker;
}

// Before quarantine dies, kill the worker
process.on('exit', function() {
	if (worker) {worker.kill('SIGHUP');}
});

