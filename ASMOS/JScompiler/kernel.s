
.intel_syntax
.org 0x100
.global kernel_entry

_lineNumber: .long 0
S2300: .asciz "COPYING:_"
S0565: .asciz "INTO:_"
S1484: .asciz "RESULT_AT_ADDRESS:_"
S9458: .asciz "--done--"
destination: .long 1,2,3,4
source: .long 4,3,2,1
readIndex: .long 0
S0134: .long 0
.include "./data.s"

.section .text
kernel_entry:
FOR0:
put_string S2300
mov %eax, [readIndex]
mov %ebx, 4
mul %ebx
put_int [source + %eax]
put_string S0565
mov %eax, [readIndex]
mov %ebx, 4
mul %ebx
put_int [destination + %eax]
mov %eax, [readIndex]
mov %ebx, 4
mul %ebx
push %eax # stores result in stack
mov %eax, [readIndex]
mov %ebx, 4
mul %ebx # stores result in eax
pop %edx
mov %cx, 4 
lea %esi, [source + %edx]      # offset new string into SI
lea %edi, [destination + %eax]   # offset destination string into DI
rep movsb
put_string S1484
mov %eax, [readIndex]
mov %ebx, 4
mul %ebx
put_int [destination + %eax]
new_line
inc_var readIndex
cmpb [readIndex], 4
jl FOR0 
new_line
put_string S9458
   ret
