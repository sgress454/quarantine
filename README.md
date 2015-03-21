# Quarantine

## Run dangerous, dirty code without (too much) fear.

### Usage:

```
var quarantine = require("quarantine")(timeoutInMilliseconds);
quarantine([context], stringifiedScript, [options], [callback])
```

### Examples:

##### Success

```
var quarantine = require("quarantine")(500);

quarantine({foo: "bar"}, "(function(){return foo;})()", console.log);
```

result: 

```
null 'bar'
```

##### Catching errors

```
var quarantine = require("quarantine")(500);

quarantine("(function(){require('fs');})()", console.log);
```

result: 

```
[Error: require is not defined]
```

##### Catching evil

```
var quarantine = require("quarantine")(500);

quarantine("(function(){while(true);})()", console.log);
```

result: 

```
{ [Error: Worker timed out!] code: 'E_WORKER_TIMEOUT' }
```

### Options

##### `numWorkers`

Specifies the number of worker processes to spawn.  More workers means less queueing, but be mindful of resources as each new worker is [spawned using `process.fork`](https://nodejs.org/api/child_process.html#child_process_child_process_fork_modulepath_args_options).

##### `requires`

An object specifying modules that should be made available inside the worker sandbox.  The object should map desired module name to *absolute path to the module*.  The modules will be required prior to the worker starting its task, and added to the sandbox in two ways: as locally scoped variables, and as acceptable arguments to the sandboxed `require()` function.  For example, if you do:

```
var quarantine = require('quarantine')(250, {requires: {"lodash": "/Users/sgress454/myApp/node_modules/lodash"}})
```

then you can send:

```
quarantine("(function(){var _ = require('lodash'); return _.camelCase('foo bar');})()");
```

or:

```
quarantine("(function(){return lodash.camelCase('foo bar');})()");
```
