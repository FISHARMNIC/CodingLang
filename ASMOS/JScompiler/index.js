var run = require('./lib.js')
var fs = require("fs")


var mycode = fs.readFileSync(String(process.argv[2]),{encoding: "utf-8"})
//console.log(mycode)
run(mycode)
/*

*/