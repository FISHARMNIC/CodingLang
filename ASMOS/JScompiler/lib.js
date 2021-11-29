const fs = require('fs')
const {exec} = require("child_process");

/* 
Note:
the compiler treats spaces, commas, and parenthesis the same
therefore 
    printf(%i, *myNumber, 1) 
is the same as
    printf %i *myNumber 1
and is why
    if(1,==,1)
works as
    if(1 == 1)
and so does
    label(myLabel)
as
    label myLabel
*/
/* #region COMPILER DATA */

var typedefs = {
    int: ".long",
    string: ".asciz"
}

var compares = {
    "==": "je",
    "<=": "jle",
    ">=": "jge",
    "<": "jl",
    ">": "jg",
    "!=": "jne",
}

var outConts = {
    header:`
.intel_syntax
.org 0x100
.global kernel_entry

_positionOnLine: .long 0
_lineNumber: .long 0
`,
    middle:
        `
.include "./data.s"

.section .text
kernel_entry:
`,
    footer:
        `
   ret
`
}

var shellExec = `
echo 1
#assemble boot.s file
as --32 boot/boot.s -o compiled/boot.o

echo 2
#compile kernel.c file
if (as --32 kernel.s -o compiled/kernel.o) ; then
    echo 3
    #linking the kernel with kernel.o and boot.o files
    if (ld -m elf_i386 -T boot/linker.ld compiled/kernel.o compiled/boot.o -o compiled/MyOS.bin -nostdlib) ; then
        echo 4
        #check MyOS.bin file is x86 multiboot file or not
        grub-file --is-x86-multiboot compiled/MyOS.bin

        #building the iso file
        mkdir -p isodir/boot/grub
        cp compiled/MyOS.bin isodir/boot/MyOS.bin
        cp boot/grub.cfg isodir/boot/grub/grub.cfg
        grub-mkrescue -o compiled/MyOS.iso isodir

        #run the qemu
        wsl -t
        qemu-system-x86_64.exe -cdrom compiled/MyOS.iso
    fi
fi
`

var pseudolbl = 0

function pseudoLabel(next) {
    if(next == "next"){
        return `FAKE${pseudolbl + 1}`
    }
    return `FAKE${pseudolbl}`
}

function incPseudoLabel() {
    pseudolbl++
}

var definedFuncs = {
    printf: function (type,value,index) {
        //type = String(type)
        //value = String(value)
        //index = Number(index)

        if(type == "s" || type == "%s") {
            main_kernel_data.push(`put_string ${value}, ${index}`)
        } else if (type == "i" || type == "%i") {
            main_kernel_data.push(`put_int ${value}, ${index}`)
        } else {
            console.error("Error: Unkown type", type)
        }
    },
    increment: function(variable, num) {
        //variable = String(variable)
        //num = Number(num)
    },
    label: function(name) {
        main_kernel_data.push(`${name}:`)
    },
    if: function(value1, comparer, value2) {
        var comparebyte = "cmp"
        if( (value1[0] == "[" && value1.at(-1) == "]")  || (value2[0] == "[" && value2.at(-1) == "]")) {
            comparebyte = "cmpb"
        }
        main_kernel_data.push(
            `${comparebyte} ${value1}, ${value2}`,
            `${compares[comparer]} ${pseudoLabel()}`, //jump to pseudo label if condition is met
            `jmp ${pseudoLabel("next")}`, //otherwise jump to the next one
            `${pseudoLabel()}:` //create the label
        )
    },
    endif: function() {
        incPseudoLabel()
        main_kernel_data.push(
            `jmp ${pseudoLabel()}`, //the "finish" label
            `${pseudoLabel()}:`
        )
    },
    jump: function(destination) {
        main_kernel_data.push(
            `jmp ${destination}`
        )
    }
}

var definedSpecials = {
    type: function (rest) {
        data_section_data.push(`${rest[1]}: ${typedefs[rest[0]]} ${rest[3]}`)
    },
    "++": function (rest) {
        main_kernel_data.push(`inc_var ${rest[0]}`)
    }
}

/* #endregion */

var data_section_data = []
var main_kernel_data = []

module.exports = function run(code) {
    code = code.split('\n').filter(x => x).map(x => {
        return x.split(/[\s,\(\)]+/) //split by: comma, space, parenthesis
    }).map(x => x.filter(n => n)) //remove the emptyness

    var line;
    var wordNumber;

    for (line = 0; line < code.length; line++) {
        var lineContents = code[line]
        for (wordNumber = lineContents.length -1; wordNumber >= 0; wordNumber--) {
            var wordContents = lineContents[wordNumber]

            if(wordContents[0] == "*") { //IF POINTER
                lineContents[wordNumber] = `[${wordContents.slice(1)}]`
            }

            if(Object.keys(definedFuncs).includes(wordContents)) { //IF FUNCTION
                var argbuff = []
                for(i = 1; i <= definedFuncs[wordContents].length; i++)  { //iterate over how many arguments the function takes
                    argbuff.push(String(lineContents[wordNumber + i]))
                }
                definedFuncs[wordContents](...argbuff)
                console.log(`${wordContents}(${argbuff})`)
            }

            if(Object.keys(definedSpecials).includes(wordContents)) { //IF SPECIAL
                definedSpecials[wordContents](lineContents.slice(wordNumber+1))
                console.log(`${wordContents}([${lineContents.slice(wordNumber+1)}])`)
            }
        }
    }
    console.log(code)
    fs.writeFileSync('kernel.s', outConts.header + data_section_data.join("\n") + outConts.middle + main_kernel_data.join("\n") + outConts.footer)
    exec(shellExec, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    })
}