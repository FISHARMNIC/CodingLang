
.intel_syntax
.org 0x100
.global kernel_entry

_lineNumber: .long 0
S4533: .asciz "Hello_World!"
.include "./data.s"

.section .text
kernel_entry:
put_string S4533
new_line
   ret
