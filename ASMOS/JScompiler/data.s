BLACK = 0 # vga color for black
WHITE = 15 # vga color for white
VGA_ADDR = 0xB8000

# IN USE : EBX, ECX
# ECX : CHARACTER REGISTER
# EBX : INDEX REGISTER

_vga_entry:
    # uses cl as the char register
    # uses ebx as the location register

    shl %ebx, 1 # multiply by 2
    mov %ch, BLACK # 0 is black, the background
    shl %ch, 4
    or %ch, WHITE # 15 is white, the foreground
    movw [%ebx + VGA_ADDR], %cx # writes the 16bit data into the memory address
    
    ret

.section .data

.macro set_var addr, value
    movw \addr, \value
.endm

.macro inc_var addr
    push %ebx
    mov %ebx, [\addr]
    inc %ebx
    mov \addr, %ebx
    pop %ebx
.endm

.macro dec_var addr
    push %ebx
    mov %ebx, [\addr]
    inc %ebx
    mov \addr, %ebx
    pop %edx
.endm

.macro add_var addr, value
    push %ebx
    mov %ebx, [\addr]
    add %ebx, \value
    mov \addr, %ebx
    pop %ebx
.endm

.macro new_line
    add_var _lineNumber, 80
.endm

.macro put_char c, i = _lineNumber # character, index
    pusha # save the values
    mov %cl, \c # prepare the character register
    mov %ebx, \i # prepare the index register
    call _vga_entry # call the display
    popa
.endm

put_string_start:  
    # eax is the string start pointer
    # edx is the current index to be printed on screen (0-indexed, not universal)
    # esi is the offset to read the string from
    put_char [%eax + %esi], %edx # [start + offset], index
    # put_char 'A' , %edx # DEBUG
    inc %edx # increment to nex char
    inc %esi # increment the string offset
    # put_char 'B', %esi # DEBUG
    cmpb [%eax + %esi], 0 # compare the character with \0
    jne put_string_start
    ret
    

.macro put_string s, i = _lineNumber # string pointer, index  
    push %edx
    push %esi

    mov %edx, \i # address to display on screen
    mov %esi, 0  # string offset register

    lea %eax, \s # move string address into eax
    
    call put_string_start
    
    pop %esi
    pop %edx
.endm

.macro put_int_single n, i # number, index
    push %edx
    push %esi
    # mov %dh, [\n] # move the number to dh
    # add %dh, 48 # add 48 to get the number
    # put_char %dh, \i # put that number char

    push %eax

    mov %al, \n
    add %al, 48
    put_char %al, \i

    pop %eax

    pop %esi
    pop %edx
.endm


put_int_loop_start:
    mov %edx, 0 # remainder
    idiv %ebx # divide the number by 10
    push %edx # save the digit
    inc %ecx # length increment
    cmp %eax, 0 # if the number was less than ten (5/10 = 0 ...)
    jne put_int_loop_start # then keep working
    # otherwise print

    put_int_digit_print_start:
    pop %edx # get the most significant number
    put_int_single %dl, %esi # print the int
    inc %esi # next position on screen
    dec %ecx # count down for the length
    cmp %ecx, 0 # if I printed all digits
    jne put_int_digit_print_start # if there are more digits jump back 
    ret # otherwise you finished!

.macro put_int n, i = _lineNumber # number, at index
    # pusha
    mov %ebx, 10 # number to divide by
    mov %ecx, 0 # the length of the number
    mov %eax, \n # move the number into eax
    mov %esi, \i # the index
    call put_int_loop_start # put each digit into the stack 
    # popa
.endm
