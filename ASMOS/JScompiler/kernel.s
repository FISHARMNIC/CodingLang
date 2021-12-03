
.intel_syntax
.org 0x100
.global kernel_entry

_lineNumber: .long 0
myNumber: .long 7
correct: .asciz "correct"
incorrect: .asciz "incorrect"
.include "./data.s"

.section .text
kernel_entry:
cmpb [myNumber], 10
jg AUTO0
cmpb [myNumber], 5
jl AUTO0
jmp AUTO1
AUTO0:
put_string [correct]
new_line
jmp AUTO3
AUTO1:
put_string [incorrect]
new_line
AUTO3:
   ret
