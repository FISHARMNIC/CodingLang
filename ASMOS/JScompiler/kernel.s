
.intel_syntax
.org 0x100
.global kernel_entry

_lineNumber: .long 0
S3996: .asciz "hello_world!"
S4546: .asciz "good_bye!"
.include "./data.s"

.section .text
kernel_entry:
put_string S3996
new_line
put_string S4546
new_line
   ret
