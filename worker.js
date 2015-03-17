/**
 * Heroic runner of possibly deadly code
 * @author sgress454
 */

// Node built-in sandboxing
var vm = require('vm');
var _ = require('lodash');

// Options for the worker
var options = {};

// If we received an argument, try to parse it as JSON
if (process.argv[2]) {
  try {
    options = JSON.parse(process.argv[2]);
  } catch (e) {
    options = {};
  }  
}

// If `options` isn't  a plain object, make it an empty one
if (!_.isPlainObject(options) || options === null) {
  options = {};
}

// If `options.requires` isn't a plain object, make it an empty one
if (!_.isPlainObject(options.requires) || options.requires === null) {
  options.requires = {};
}

// Attempt to require any modules that were passed in via options.require
// and add them to the default context
var defaultContext = {};
_.each(options.requires, function(path, contextKey) {
  try {
    defaultContext[contextKey] = require(path);  
  } catch(e) {}
});

// Add a `require` function to the default context that will just return
// the module from the context if we have it.
defaultContext.require = function(module) {
  if (defaultContext[module]) {return defaultContext[module];}
  throw new Error("Module " + module + "not included in Sandbox requires!");
};

// Register a handler for instructions from the airlock
process.on("message", function(options) {

  // Get the context we should run the script in
  var context = _.extend({}, defaultContext, options.context);

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