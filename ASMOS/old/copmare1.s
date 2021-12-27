
.intel_syntax
.org 0x100
.global kernel_entry

_lineNumber: .long 0
_mathResult: .long 0
snakeXPositions: .long 40,20
direction: .long -1
cX: .long 0
.include "./data.s"

.section .text
kernel_entry:
mov %eax, 0
mov %ebx, 4
mul %ebx
mov %cx, 4 
lea %esi, [snakeXPositions + %eax]      # offset new string into SI
lea %edi, cX   # offset destination string into DI
rep movsb
add_vars cX, direction
mov %eax, 0
mov %ebx, 4
mul %ebx
mov %cx, 1 
lea %esi, cX      # offset new string into SI
lea %edi, [snakeXPositions + %eax]   # offset destination string into DI
rep movsb
   ret
