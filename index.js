// Reference to the airlock process
var airlock;

module.exports = function(timeout) {

	// If we don't have an airlock spun up already, create one now
	if (!airlock) {
		airlock = require('child_process').fork(path.resolve(__dirname, "airlock.js"), [timeout]);
	}

	// Return the airlock to the caller
	return airlock;
};

// Before we die, kill the airlock (which will kill the worker)
process.on('exit', function() {
	airlock && airlock.kill('SIGHUP');
});