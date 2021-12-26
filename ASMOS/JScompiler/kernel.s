
.intel_syntax
.org 0x100
.global kernel_entry

_lineNumber: .long 0
_mathResult: .long 0
S1174: .asciz "Program to calculate squares from: "
S4361: .asciz " to "
S3081: .asciz " squared is "
S4953: .asciz "done!"
S4857: .asciz "Program By: Nicolas Quijano - 2021"
myNumbers: .long 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21
index: .long 0
atIndex: .long 0
lastNumber: .long 21
.include "./data.s"

.section .text
kernel_entry:
dec_var lastNumber
put_string S1174
put_int myNumbers
put_string S4361
mov %eax, [lastNumber]
mov %ebx, 4
mul %ebx
put_int [myNumbers + %eax]
new_line
FOR0:
mov %eax, [index]
mov %ebx, 4
mul %ebx
mov %cx, 4 
lea %esi, [myNumbers + %eax]      # offset new string into SI
lea %edi, atIndex   # offset destination string into DI
rep movsb
mov %eax, [index]
mov %ebx, 4
mul %ebx
put_int [myNumbers + %eax]
put_string S3081
push %eax
mov %eax, [atIndex]
push %ebx
mov %ebx, atIndex
mul %ebx
pop %ebx
mov _mathResult, %eax
pop %eax
put_int _mathResult
new_line
inc_var index
cmpb [index], 21
jl FOR0 
new_line
put_string S4953
new_line
put_string S4857
   ret
