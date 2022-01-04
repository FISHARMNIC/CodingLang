
.intel_syntax
.org 0x100
.global kernel_entry

_lineNumber: .long 0
_mathResult: .long 0
S703023: .asciz "Score"
S635906: .asciz "GAME OVER!"
S015312: .asciz "PRESS ENTER TO PLAY AGAIN"
snakeMaxLength: .long 20
snakeCurrentLength: .long 1
snakeRenderLength: .long 3
temporary: .long 0
foodRead: .long 0
foodPositionsX: .long 10,5,20,40,65,75
foodPositionsY: .long 5,15,10,20,3,23
foodX: .long 10
foodY: .long 10
snakeXPositions: .long 40,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1
snakeYPositions: .long 12,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1
snakeDuration: .long 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
snakeDirectionX: .long 1
snakeDirectionY: .long 0
cellAtIteration: .long 0
currentSnakeCellX: .long 0
currentSnakeCellY: .long 0
renderedFrames: .long 0
incrementIndex: .long 0
S823897: .long 0
S317341: .long 0
.include "./data.s"

.section .text
kernel_entry:
    pusha
    mov %dx, 0x3D4
    mov %al, 0xA	 # disable cursor
    out %dx, %al
    inc %dx
    mov %al, 0x20 # disable cursor
    out %dx, %al
    popa

# MAX_LENGTH_ NOT_INCLUDING_THE_HEAD
# KEEP_AT_3
# FOOD_LOCATION
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
.macro clearAtPos xP,yP
push %eax
mov %eax, \yP
push %ebx
mov %ebx, 80
mul %ebx
pop %ebx
add %eax, \xP
mov _mathResult, %eax
pop %eax
put_char 0, _mathResult
.endm
.macro printHeadAtPos xP,yP
push %eax
mov %eax, \yP
push %ebx
mov %ebx, 80
mul %ebx
pop %ebx
add %eax, \xP
mov _mathResult, %eax
pop %eax
put_char 002, _mathResult
.endm
# MAIN_RENDER_LOOP
FOR0:
continueFlow:
call read_keyboard
cmpb [keyboard_out], KEY_UP
je _AUTO4
jmp _AUTO5
_AUTO4:
set_var snakeDirectionX, 0
set_var snakeDirectionY, -1
_AUTO5:
cmpb [keyboard_out], KEY_DOWN
je _AUTO9
jmp _AUTO10
_AUTO9:
set_var snakeDirectionX, 0
set_var snakeDirectionY, 1
_AUTO10:
cmpb [keyboard_out], KEY_LEFT
je _AUTO14
jmp _AUTO15
_AUTO14:
set_var snakeDirectionX, -1
set_var snakeDirectionY, 0
_AUTO15:
cmpb [keyboard_out], KEY_RIGHT
je _AUTO19
jmp _AUTO20
_AUTO19:
set_var snakeDirectionX, 1
set_var snakeDirectionY, 0
_AUTO20:
call renderAndStep
# Wait
push %eax
mov %eax, 26843545
S599752:
nop
sub %eax, 1
cmp %eax, 0
jge S599752
pop %eax
cmpb [renderedFrames], -1
jg FOR0 
jmp finish
# RENDER_FUNCTION:_EACH_CELL_IS_CHECKED_AND_DRAWN_IF_PRESENT
renderAndStep:
# PRINT_FOOD
printAtPos foodX,foodY
# EDIT_POSITION_OF_HEAD
mov %cx, 4 
lea %esi, snakeXPositions+0      # offset new string into SI
lea %edi, currentSnakeCellX   # offset destination string into DI
rep movsb
mov %cx, 4 
lea %esi, snakeYPositions+0      # offset new string into SI
lea %edi, currentSnakeCellY   # offset destination string into DI
rep movsb
add_vars currentSnakeCellX, snakeDirectionX
add_vars currentSnakeCellY, snakeDirectionY
mov %cx, 1 
lea %esi, currentSnakeCellX      # offset new string into SI
lea %edi, snakeXPositions+0   # offset destination string into DI
rep movsb
mov %cx, 1 
lea %esi, currentSnakeCellY      # offset new string into SI
lea %edi, snakeYPositions+0   # offset destination string into DI
rep movsb
printHeadAtPos currentSnakeCellX,currentSnakeCellY
set_var cellAtIteration, 1
FOR1:
mov %eax, [cellAtIteration]
mov %ebx, 4
mul %ebx
cmpb [snakeXPositions + %eax], -1
jne _AUTO24
jmp _AUTO25
_AUTO24:
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
_AUTO25:
inc_var cellAtIteration
cmpb [cellAtIteration], 20
jl FOR1 
mov %eax, [snakeCurrentLength]
mov %ebx, 4
mul %ebx
mov %cx, 4 
lea %esi, [snakeXPositions + %eax]      # offset new string into SI
lea %edi, currentSnakeCellX   # offset destination string into DI
rep movsb
mov %eax, [snakeCurrentLength]
mov %ebx, 4
mul %ebx
mov %cx, 4 
lea %esi, [snakeYPositions + %eax]      # offset new string into SI
lea %edi, currentSnakeCellY   # offset destination string into DI
rep movsb
clearAtPos currentSnakeCellX,currentSnakeCellY
push %eax
mov %eax, snakeRenderLength
sub %eax, 1
mov _mathResult, %eax
pop %eax
push %eax
mov %eax, [_mathResult]
cmp [snakeCurrentLength], %eax
pop %eax
jl _AUTO29
jmp _AUTO30
_AUTO29:
mov %eax, [snakeCurrentLength] #T1
mov %ebx, 4
mul %ebx
push %eax # stores result in stack
pop %edx
mov %cx, 4 
lea %esi, snakeXPositions+0      # offset new string into SI
lea %edi, [snakeXPositions + %edx]   # offset destination string into DI
rep movsb
mov %eax, [snakeCurrentLength]
mov %ebx, 4
mul %ebx # stores result in eax
mov %cx, 4 
lea %esi, snakeYPositions+0      # offset new string into SI
lea %edi, [snakeYPositions + %eax]   # offset destination string into DI
rep movsb
mov %eax, [snakeCurrentLength]
mov %ebx, 4
mul %ebx
mov %cx, 1 
lea %esi, snakeCurrentLength      # offset new string into SI
lea %edi, [snakeDuration + %eax]   # offset destination string into DI
rep movsb
inc_var snakeCurrentLength
jmp _AUTO32
_AUTO30:
mov %eax, [snakeCurrentLength] #T1
mov %ebx, 4
mul %ebx
push %eax # stores result in stack
pop %edx
mov %cx, 4 
lea %esi, snakeXPositions+0      # offset new string into SI
lea %edi, [snakeXPositions + %edx]   # offset destination string into DI
rep movsb
mov %eax, [snakeCurrentLength]
mov %ebx, 4
mul %ebx # stores result in eax
mov %cx, 4 
lea %esi, snakeYPositions+0      # offset new string into SI
lea %edi, [snakeYPositions + %eax]   # offset destination string into DI
rep movsb
set_var snakeCurrentLength, 1
_AUTO32:
cmpb [foodRead], 6
jg _AUTO36
jmp _AUTO37
_AUTO36:
set_var foodRead, 0
_AUTO37:
push %eax
mov %eax, [snakeXPositions+0]
cmp %eax, [foodX]
pop %eax
je _AUTO41
jmp _AUTO42
_AUTO41:
   push %eax
   mov %eax, [snakeYPositions+0]
   cmp %eax, [foodY]
   pop %eax
   je _AUTO43
   jmp _AUTO42
   _AUTO43:
inc_var snakeRenderLength
mov %eax, [foodRead]
mov %ebx, 4
mul %ebx
mov %cx, 4 
lea %esi, [foodPositionsX + %eax]      # offset new string into SI
lea %edi, foodX   # offset destination string into DI
rep movsb
mov %eax, [foodRead]
mov %ebx, 4
mul %ebx
mov %cx, 4 
lea %esi, [foodPositionsY + %eax]      # offset new string into SI
lea %edi, foodY   # offset destination string into DI
rep movsb
inc_var foodRead
_AUTO42:
cmpb [snakeXPositions], 79
jg _AUTO46
jmp _AUTO47
_AUTO46:
call lose
_AUTO47:
cmpb [snakeXPositions], 0
jl _AUTO51
jmp _AUTO52
_AUTO51:
call lose
_AUTO52:
cmpb [snakeYPositions], 25
jg _AUTO56
jmp _AUTO57
_AUTO56:
call lose
_AUTO57:
cmpb [snakeYPositions], 0
jl _AUTO61
jmp _AUTO62
_AUTO61:
call lose
_AUTO62:
put_string S703023, 0
push %eax
mov %eax, snakeRenderLength
sub %eax, 2
mov _mathResult, %eax
pop %eax
put_int _mathResult, 80
ret
lose:
call _clearVGA
put_string S635906, 993
put_string S015312, 1065
# RESET_TAIL
set_var currentSnakeCellX, -1
set_var snakeCurrentLength, 0
FOR2:
mov %eax, [snakeCurrentLength]
mov %ebx, 4
mul %ebx
set_var [snakeXPositions + %eax], -1
mov %eax, [snakeCurrentLength]
mov %ebx, 4
mul %ebx
set_var [snakeYPositions + %eax], -1
inc_var snakeCurrentLength
cmpb [snakeCurrentLength], 20
jl FOR2 
FOR3:
call read_keyboard
cmpb [keyboard_out], KEY_ENTER
je _AUTO66
jmp _AUTO67
_AUTO66:
# RESET_SCREEN_AND_HEAD
set_var snakeRenderLength, 3
set_var currentSnakeCellX, 40
set_var currentSnakeCellY, 12
set_var snakeXPositions+0, 40
set_var snakeYPositions+0, 12
call _clearVGA
jmp continueFlow
_AUTO67:
cmpb [renderedFrames], -1
jg FOR3 
jmp $
ret
finish:
   ret
