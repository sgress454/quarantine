# Quarantine

## Run dangerous, dirty code without (too much) fear.

### Usage:

```
var timeout = 500;
var quarantine = require("quarantine")(timeout);

quarantine.on("message", console.log);

quarantine.send({
	context: {foo: "bar"},
	script: "(function(){return foo;})()"
});
```

returns: 

```
{
	status: "ok",
	result: "bar"
}
```

### Catching errors

```
var timeout = 500;
var quarantine = require("quarantine")(timeout);

quarantine.on("message", console.log);

quarantine.send({
	script: "(function(){require('fs');})()"
});
```

returns: 

```
{
	status: 'script_error',
	result: 'require is not defined' 
}
```

### Catching evil

```
var timeout = 500;
var quarantine = require("quarantine")(timeout);

quarantine.on("message", console.log);

quarantine.send({
	script: "(function(){while(true);})()"
});
```

returns: 

```
{
	status: 'worker_timeout'
}
```
