/**
 * Communication channel between the world and the untrusted code.
 * @author sgress454
 */

var fork = require('child_process').fork;

var path = require('path');

// Get the arguments passed in
var args = process.argv;

// Get the timeout value for the worker
var timeout = parseInt(args.pop()) || 500;

// Handle to the worker
var worker = spinUpWorker();

// Wait for events
process.on("message", function(options) {

  // Set up an event listener on the worker
  worker.on("message", handleWorkerMessage);

  // Set up a timeout--if the worker takes to long, we'll
  // tell the caller that it failed and respawn it
  var selfDestruct = setTimeout(function() {

    // Remove this handler from the (possibly locked) worker
    worker.removeListener("message", handleWorkerMessage);

    // Kill the worker with extreme prejudice
    worker.kill('SIGKILL');

    // Like the phoenix, it is reborn
    worker = spinUpWorker();

    // Let the caller know it didn't work out
    process.send({status: "worker_timeout"});
  }, timeout);

  // Give the worker its marching orders
  worker.send(options);

  // Handler a return message from the worker
  function handleWorkerMessage(result) {

    // Clear the self-destruct
    clearTimeout(selfDestruct);

    // Clear this handler from the worker
    worker.removeListener("message", handleWorkerMessage);

    // Send the caller the result
    process.send(result);
  }  

});

// Spin up a new worker
function spinUpWorker() {
  return fork(path.resolve(__dirname, "worker.js"));
}

// Before we die, kill the worker
process.on('close', function() {
  worker && worker.kill('SIGHUP');
});