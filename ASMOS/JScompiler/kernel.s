
.intel_syntax
.org 0x100
.global kernel_entry

_lineNumber: .long 0
S4486: .asciz "Adios"
myStrings: .asciz "hello","how  ","are  ","you  "
myNumbers: .long 1,2,3,4
readIndex: .long 0
S1833: .asciz "S4486"
.include "./data.s"

.section .text
kernel_entry:
put_int myNumbers
new_line
put_int myNumbers+12
new_line
loopStart:
mov %eax, [readIndex]
mov %ebx, 6
mul %ebx
put_string [myStrings + %eax]
new_line
inc_var readIndex
cmpb [readIndex], 4
jl AUTO0
jmp AUTO1
AUTO0:
jmp loopStart
AUTO1:
mov %cx, 3   # how many bytes to copy (numeric value)
lea %si, [S1833]      # offset new string into SI
lea %di, [myStrings+12]   # offset destination string into DI
rep movsb
put_string myStrings+12
new_line
   ret
