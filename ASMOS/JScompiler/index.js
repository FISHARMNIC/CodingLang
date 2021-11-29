var run = require('./lib.js')

var mycode = `
type int myNumber = 0
type string myString = "Hello_World"
type char myChar = 'A'

label loopStart
    printLine(%i, *myNumber)
    ++ myNumber
    if (*myNumber != 10)
        jump(loopStart)
    endif

printLine(%s, *myString)

printLine(%c, *myChar)
++ myChar
printLine(%c, *myChar)
`
run(mycode)