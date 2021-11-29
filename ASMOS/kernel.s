.intel_syntax
.org 0x100
.global kernel_entry

msg: .asciz "Hello World!"
msg2: .asciz "Welcome!"
positionOnLine: .long 0
lineNumber: .long 0
myNumber: .long 1234

.include "./data.s"


# teststr: .asciz "Hello World" # undefined
# mov teststr, %eax # copy value in eax into string DO NOT DELETE

.section .text
kernel_entry:
    put_string msg, 0
    put_int [myNumber], 40
    ret

