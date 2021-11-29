/* 
Note:
the compiler treats spaces, commas, and parenthesis the same
therefore 
    printf(%i, *myNumber, 1) 
is the same as
    printf %i *myNumber 1
and is why
    if(1,==,1)
works as
    if(1 == 1)
and so does
    label(myLabel)
as
    label myLabel
*/
var run = require('./lib.js')

var mycode = `
type int myNumber = 0
type string myString = "Hello_World"

label loopStart
    printf(%i, *myNumber, *myNumber)
    ++ myNumber
    if(*myNumber != 10)
        jump(loopStart)
    endif

printf(%s, *myString, 80)

`
run(mycode)