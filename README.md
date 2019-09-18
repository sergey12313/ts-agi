# ding-dong2
node.js lib writed on typescript for Fast AGI (Asterisk Gateway Interface) server 

[Fork of ding-dong](https://github.com/antirek/ding-dong)


## Install
```
npm install ding-dong2

```

`````javascript

const { Agi } = require('ding-dong2');

const agi = new Agi();

agi.use(async (ctx, next) => {
  await ctx.streamFile('beep');
  await next();
  const { value: myVariable } = await ctx.getFullVariable('myVar');
  await ctx.sayAlpha(myVariable);
  await ctx.hangup();
});
agi.use(async ctx => {
  await ctx.setVariable('myVar', 'Hello World!!!');
});

agi.listen(3456);


`````

### Add to Asterisk extensions.conf

`````
[default]
exten = > 1000,1,AGI(agi://localhost:3456)
`````

## Links

[Asterisk AGI](https://wiki.asterisk.org/wiki/display/AST/Asterisk+17+AGI+Commands)