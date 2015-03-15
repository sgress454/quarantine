/**
 * Heroic runner of possibly deadly code
 * @author sgress454
 */

// Node built-in sandboxing
var vm = require('vm');

// Register a handler for instructions from the airlock
process.on("message", function(options) {

  // Get the context we should run the script in
  var context = options.context;

  // Get the script we're being ordered to run
  var script = options.script;

  // Try to protect ourselves using try/catch
  try {

    // Attempt to run the script
    var result = vm.runInContext(script, vm.createContext(context));

    // If successful, send back the all-clear and the result
    process.send({
      status: "ok",
      result: result
    });
  } 

  catch (e) {

    // If the script failed, send back an error status and message
    process.send({
      status: "script_error",
      result: e.message
    });
  }

});