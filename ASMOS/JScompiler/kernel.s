
.intel_syntax
.org 0x100
.global kernel_entry

_lineNumber: .long 0
S3231: .asciz "less_than_ten"
S1466: .asciz "greater_than_ten"
myNumber: .long 1
.include "./data.s"

.section .text
kernel_entry:
put_int [myNumber]
new_line
cmpb [myNumber], 10
jl AUTO0
jmp AUTO1
AUTO0:
put_string S3231
new_line
jmp AUTO3
AUTO1:
put_string S1466
new_line
AUTO3:
   ret
