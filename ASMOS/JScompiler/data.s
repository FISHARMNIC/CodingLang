BLACK = 0 # vga color for black
WHITE = 15 # vga color for white
VGA_ADDR = 0xB8000

KEYBOARD_PORT = 0x60
KEY_LEFT = 0x4B
KEY_RIGHT = 0x4D
KEY_UP = 0x48
KEY_DOWN = 0x50
KEY_ENTER = 0x1C

_strcmp_result: .byte 1 # 0 means true
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

keyboard_out: .byte 0

.macro set_var addr, value
    movw \addr, \value
.endm

.macro inc_var addr
    # push %ebx
    # mov %ebx, [\addr]
    # inc %ebx
    # mov \addr, %ebx
    # pop %ebx
    incw [\addr]
.endm

.macro dec_var addr
    # push %ebx
    # mov %ebx, [\addr]
    # inc %ebx
    # mov \addr, %ebx
    # pop %edx
    decw [\addr]
.endm

.macro add_var addr, value
    push %ebx
    mov %ebx, [\addr]
    add %ebx, \value
    mov \addr, %ebx
    pop %ebx
.endm

.macro add_vars addr, value
    push %ebx
    mov %ebx, [\addr]
    add %ebx, [\value]
    mov \addr, %ebx
    pop %ebx
.endm

.macro sub_var addr, value
    push %ebx
    mov %ebx, [\addr]
    sub %ebx, \value
    mov \addr, %ebx
    pop %ebx
.endm

.macro mul_var addr, value
    push %eax
    push %ebx

    mov %ebx, [\addr]
    mov %eax, \value

    mul %ebx
    mov \addr, %eax

    pop %ebx
    pop %eax
.endm

.macro mul_vars addr, value
    push %eax
    push %ebx

    mov %ebx, [\addr]
    mov %eax, [\value]

    mul %ebx
    mov \addr, %eax

    pop %ebx
    pop %eax
.endm

_remainder:
    cmp %eax, %edx
    jge _NLL1
    jmp _NLL2
    _NLL1:
        sub %eax, %edx
        cmp %eax, %edx
        jge _NLL1
    _NLL2:
    ret

.macro new_line
    # NEWLINE = position  + (80 - (position % 80))
    mov %eax, [_lineNumber] # number
    mov %edx, 80 # divisor
    call _remainder # eax = linePos % 80
    sub %edx, %eax # 80 - remainder
    add %edx, [_lineNumber] # edx = linePos + (80 - remainder)
    mov _lineNumber, %edx # new line position

.endm

.macro put_char c, i = _lineNumber # character, index
    pusha # save the values
    mov %cl, \c # prepare the character register
    mov %ebx, \i # prepare the index register
    call _vga_entry # call the display
    popa
    inc_var _lineNumber
.endm

_clearVGA:
    push %eax
    push %ebx
    mov %eax, 2000
    mov %ebx, 0
    _clearVGA_loopStart:
        put_char 0, %ebx
        inc %ebx
        dec %eax
        cmp %eax, 0
        jne _clearVGA_loopStart
    pop %ebx
    pop %eax
    movb _lineNumber, 0
ret


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

.macro _mem_dump_print adr, ms, len
    push %eax
    push %ebx
    movw _lineNumber, \adr # print loc
    lea %eax, \ms # dump start
    mov %ebx, \len # dump len
    call _memDump_lbl
    pop %ebx
    pop %eax
.endm

.macro _mem_dump_print_static adr, ms, len
    push %eax
    push %ebx
    movw _lineNumber, \adr # print loc
    mov %eax, \ms # dump start
    mov %ebx, \len # dump len
    call _memDump_lbl
    pop %ebx
    pop %eax
.endm

_memDump_lbl: 
    put_char [%eax] # dump char at address
    inc %eax
    cmp %eax, %ebx # index with len
    jne _memDump_lbl # keep going until dump finish
    ret

read_keyboard:
    push %eax
    push %ebx

    mov %ebx, 0

    read_keyboard_loop_start:
    inb %al, KEYBOARD_PORT # store keycode in al
    inc %ebx
    cmp %al, 0
    jne read_keyboard_loop_exit # found a key pressed, so return it
    # otherwise, check for a timeout
    cmp %ebx, 77 # there are 77 keys 
    jne read_keyboard_loop_start # as long as i havent timed out, keep checking
    read_keyboard_loop_exit:
    movb keyboard_out, %al # save the resulting keycode
    pop %ebx
    pop %eax
    ret
    

.macro strcmp str1, str2, len
    push %eax
    push %ebx
    push %ecx
    push %edx
    push %esi
    cld  # clear direction flag

    lea %eax, \str1
    lea %ebx, \str2
    mov %ecx, \len
    
    call _strcmp_loop   


    pop %esi
    pop %edx
    pop %ecx
    pop %ebx
    pop %eax

.endm

_strcmp_loop:
    mov %edx, [%eax]
    mov %esi, [%ebx]
    cmp %esi, %edx
    jne _strcmp_not_equal # if any char is not equal, exit
    
    # next char
    inc %eax
    inc %ebx

    dec %ecx 
    cmp %ecx, 0
    jne _strcmp_loop # keep going
    movb _strcmp_result, 0 # all chars arethe same, the difference is 0
    ret

_strcmp_not_equal: 
    movb _strcmp_result, 1


.macro set_array_index_to arr, index, offset, to
    pusha
    mov %eax, \index
    mov %ebx, \offset
    mul %ebx # index * byte offset
    lea %ebx, \arr # get array position in memory
    add %ebx, %eax # ebx = array position + (index * byteoffset)
    mov %eax, \to # prepare source to avoid over referencing
    mov [%ebx], %eax # set memory address at index to new value
    popa
.endm

.macro add_to_array arr, address, by
    pusha
    lea %eax, \arr
    mov %ecx, \address # store to avoid over-reference
    add %eax, %ecx # eax = base pointer + (offset * address)
    mov %ebx ,[%eax] # ebx = value at arr[address]
    mov %ecx, \by # store to avoid over-reference
    add %ebx, %ecx # ebx += increment
    mov [%eax], %ebx # arr[address] += by
    popa
.endm