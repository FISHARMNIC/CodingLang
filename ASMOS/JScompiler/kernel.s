
.intel_syntax
.org 0x100
.global kernel_entry

_lineNumber: .long 0
_mathResult: .long 0
S9903: .asciz "done"
snakeMaxLength: .long 9
snakeXPositions: .long 40,-1,-1,-1,-1,-1,-1,-1,-1,-1
snakeYPositions: .long 12,-1,-1,-1,-1,-1,-1,-1,-1,-1
snakeDuration: .long 0,0,0,0,0,0,0,0,0
snakeDirectionX: .long 1
snakeDirectionY: .long 0
cellAtIteration: .long 0
currentSnakeCellX: .long 0
currentSnakeCellY: .long 0
renderedFrames: .long 0
incrementIndex: .long 0
.include "./data.s"

.section .text
kernel_entry:
# MAX_LENGTH_ NOT_INCLUDING_THE_HEAD
# EACH_CELL_CONTAINS_A_POSSIBLE_STATE_FOR_THAT_SECTION_OF_THE_SNAKE
# EACH_CELL_CONTAINS_HOW_LONG_THE_CELL_WILL_STAY_PRESENT_AT_THAT_SECTION
# THE_FIRST_CELL/HEAD_WILL_ALWAYS_STAY_PRESENT
# X_MOVEMENT_:_Y_MOVEMENT
# USED_FOR_LOOPING_THE_RENDER
# NUMBER_OF_FRAMES_RENDERED
# PRINT_INDIVIDUAL_PIXEL
.macro printAtPos xP,yP
push %eax
mov %eax, \yP
push %ebx
mov %ebx, 80
mul %ebx
pop %ebx
add %eax, \xP
mov _mathResult, %eax
pop %eax
put_char 219, _mathResult
.endm
# MAIN_RENDER_LOOP
FOR0:
call read_keyboard
cmpb [keyboard_out], KEY_UP
je _AUTO1
jmp _AUTO2
_AUTO1:
set_var snakeDirectionX, 0
set_var snakeDirectionY, -1
_AUTO2:
cmpb [keyboard_out], KEY_DOWN
je _AUTO3
jmp _AUTO4
_AUTO3:
set_var snakeDirectionX, 0
set_var snakeDirectionY, 1
_AUTO4:
cmpb [keyboard_out], KEY_LEFT
je _AUTO5
jmp _AUTO6
_AUTO5:
set_var snakeDirectionX, -1
set_var snakeDirectionY, 0
_AUTO6:
cmpb [keyboard_out], KEY_RIGHT
je _AUTO7
jmp _AUTO8
_AUTO7:
set_var snakeDirectionX, 1
set_var snakeDirectionY, 0
_AUTO8:
call _clearVGA
call renderAndStep
# Wait
push %eax
mov %eax, 67108863
S4510:
nop
sub %eax, 1
cmp %eax, 0
jge S4510
pop %eax
cmpb [renderedFrames], -1
jg FOR0 
jmp finish
# RENDER_FUNCTION:_EACH_CELL_IS_CHECKED_AND_DRAWN_IF_PRESENT
renderAndStep:
set_var cellAtIteration, 0
FOR1:
mov %eax, [cellAtIteration]
mov %ebx, 4
mul %ebx
cmpb [snakeXPositions + %eax], -1
jne _AUTO9
jmp _AUTO10
_AUTO9:
mov %eax, [cellAtIteration]
mov %ebx, 4
mul %ebx
mov %cx, 4 
lea %esi, [snakeXPositions + %eax]      # offset new string into SI
lea %edi, currentSnakeCellX   # offset destination string into DI
rep movsb
mov %eax, [cellAtIteration]
mov %ebx, 4
mul %ebx
mov %cx, 4 
lea %esi, [snakeYPositions + %eax]      # offset new string into SI
lea %edi, currentSnakeCellY   # offset destination string into DI
rep movsb
# RENDER_CURRENT_CELL
printAtPos currentSnakeCellX,currentSnakeCellY
# MOVE_THE_CELL
add_vars currentSnakeCellX, snakeDirectionX
add_vars currentSnakeCellY, snakeDirectionY
# HEERE
mov %eax, [cellAtIteration]
mov %ebx, 4
mul %ebx
mov %cx, 1 
lea %esi, currentSnakeCellX      # offset new string into SI
lea %edi, [snakeXPositions + %eax]   # offset destination string into DI
rep movsb
mov %eax, [cellAtIteration]
mov %ebx, 4
mul %ebx
mov %cx, 1 
lea %esi, currentSnakeCellY      # offset new string into SI
lea %edi, [snakeYPositions + %eax]   # offset destination string into DI
rep movsb
_AUTO10:
inc_var cellAtIteration
cmpb [cellAtIteration], 9
jl FOR1 
new_line
put_string S9903
ret
finish:
   ret
