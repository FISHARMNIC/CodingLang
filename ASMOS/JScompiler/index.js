var run = require('./lib.js')

var mycode = `
type int myNumber = 7

type string correct = "correct"
type string incorrect = "incorrect"

extif(*myNumber > 10 || *myNumber < 5)
    printLine(%s, *correct)
else
    printLine(%s, *incorrect)
endif
`
run(mycode)
/*

*/