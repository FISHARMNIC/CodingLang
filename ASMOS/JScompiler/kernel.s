
.intel_syntax
.org 0x100
.global kernel_entry

_lineNumber: .long 0
_mathResult: .long 0
S302649: .asciz "Score"
S846103: .asciz "GAME OVER!"
S336050: .asciz "PRESS ENTER TO PLAY AGAIN"
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
S151620: .int 0
S999557: .int -1
S318910: .int 0
S980745: .int 1
S581628: .int -1
S164671: .int 0
S731802: .int 1
S593228: .int 0
S404544: .int 1
S922597: .long 0
S674391: .long 0
S482391: .int 1
S817312: .int 0
S133647: .int 0
S475424: .int -1
S105845: .int -1
S283471: .int 3
S307969: .int 40
S097409: .int 12
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
mov %cx, 4 
lea %esi, S151620      # offset new string into SI
lea %edi, snakeDirectionX   # offset destination string into DI
rep movsb
mov %cx, 4 
lea %esi, S999557      # offset new string into SI
lea %edi, snakeDirectionY   # offset destination string into DI
rep movsb
_AUTO5:
cmpb [keyboard_out], KEY_DOWN
je _AUTO9
jmp _AUTO10
_AUTO9:
mov %cx, 4 
lea %esi, S318910      # offset new string into SI
lea %edi, snakeDirectionX   # offset destination string into DI
rep movsb
mov %cx, 4 
lea %esi, S980745      # offset new string into SI
lea %edi, snakeDirectionY   # offset destination string into DI
rep movsb
_AUTO10:
cmpb [keyboard_out], KEY_LEFT
je _AUTO14
jmp _AUTO15
_AUTO14:
mov %cx, 4 
lea %esi, S581628      # offset new string into SI
lea %edi, snakeDirectionX   # offset destination string into DI
rep movsb
mov %cx, 4 
lea %esi, S164671      # offset new string into SI
lea %edi, snakeDirectionY   # offset destination string into DI
rep movsb
_AUTO15:
cmpb [keyboard_out], KEY_RIGHT
je _AUTO19
jmp _AUTO20
_AUTO19:
mov %cx, 4 
lea %esi, S731802      # offset new string into SI
lea %edi, snakeDirectionX   # offset destination string into DI
rep movsb
mov %cx, 4 
lea %esi, S593228      # offset new string into SI
lea %edi, snakeDirectionY   # offset destination string into DI
rep movsb
_AUTO20:
call renderAndStep
# Wait
push %eax
mov %eax, 26843545
S886254:
nop
sub %eax, 1
cmp %eax, 0
jge S886254
pop %eax
cmpb [renderedFrames], -1
jg FOR0 
jmp finish
# RENDER_FUNCTION:_EACH_CELL_IS_CHECKED_AND_DRAWN_IF_PRESENT
renderAndStep:
# PRINT_FOOD
printAtPos foodX,foodY
# EDIT_POSITION_OF_HEAD
add_to_array snakeXPositions, 0, snakeDirectionX
add_to_array snakeYPositions, 0, snakeDirectionY
printHeadAtPos snakeXPositions,snakeYPositions
mov %cx, 4 
lea %esi, S404544      # offset new string into SI
lea %edi, cellAtIteration   # offset destination string into DI
rep movsb
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
mov %cx, 4 
lea %esi, S482391      # offset new string into SI
lea %edi, snakeCurrentLength   # offset destination string into DI
rep movsb
_AUTO32:
cmpb [foodRead], 6
jg _AUTO36
jmp _AUTO37
_AUTO36:
mov %cx, 4 
lea %esi, S817312      # offset new string into SI
lea %edi, foodRead   # offset destination string into DI
rep movsb
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
jg _AUTO44
cmpb [snakeXPositions], 0
jl _AUTO44
jmp _AUTO45
_AUTO44:
call lose
_AUTO45:
cmpb [snakeYPositions], 25
jg _AUTO47
cmpb [snakeYPositions], 0
jl _AUTO47
jmp _AUTO48
_AUTO47:
call lose
_AUTO48:
put_string S302649, 0
push %eax
mov %eax, snakeRenderLength
sub %eax, 2
mov _mathResult, %eax
pop %eax
put_int _mathResult, 80
ret
lose:
call _clearVGA
put_string S846103, 993
put_string S336050, 1065
# RESET_TAIL
mov %cx, 4 
lea %esi, S133647      # offset new string into SI
lea %edi, snakeCurrentLength   # offset destination string into DI
rep movsb
FOR2:
mov %eax, [snakeCurrentLength]
mov %ebx, 4
mul %ebx
mov %cx, 4 
lea %esi, S475424      # offset new string into SI
lea %edi, [snakeXPositions + %eax]   # offset destination string into DI
rep movsb
mov %eax, [snakeCurrentLength]
mov %ebx, 4
mul %ebx
mov %cx, 4 
lea %esi, S105845      # offset new string into SI
lea %edi, [snakeYPositions + %eax]   # offset destination string into DI
rep movsb
inc_var snakeCurrentLength
cmpb [snakeCurrentLength], 20
jl FOR2 
# RESET_HEAD_AND_LENGTH
mov %cx, 4 
lea %esi, S283471      # offset new string into SI
lea %edi, snakeRenderLength   # offset destination string into DI
rep movsb
mov %cx, 4 
lea %esi, S307969      # offset new string into SI
lea %edi, snakeXPositions+0   # offset destination string into DI
rep movsb
mov %cx, 4 
lea %esi, S097409      # offset new string into SI
lea %edi, snakeYPositions+0   # offset destination string into DI
rep movsb
FOR3:
call read_keyboard
cmpb [keyboard_out], KEY_ENTER
je _AUTO52
jmp _AUTO53
_AUTO52:
call _clearVGA
jmp continueFlow
_AUTO53:
cmpb [renderedFrames], -1
jg FOR3 
ret
finish:
   ret
