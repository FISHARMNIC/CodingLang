
.intel_syntax
.org 0x100
.global kernel_entry

_lineNumber: .long 0
myNumber: .long 0
myString: .asciz "Hello_World"
myChar: .short 'A'
.include "./data.s"

.section .text
kernel_entry:
loopStart:
put_int [myNumber]
new_line
inc_var myNumber
cmpb [myNumber], 10
jne FAKE0
jmp FAKE1
FAKE0:
jmp loopStart
jmp FAKE1
FAKE1:
put_string [myString]
new_line
put_char [myChar]
new_line
inc_var myChar
put_char [myChar]
new_line
   ret
