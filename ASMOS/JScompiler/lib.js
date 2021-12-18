const fs = require('fs')
const { exec } = require("child_process");

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
    string: ".asciz",
    char: ".short"
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
    header: `
.intel_syntax
.org 0x100
.global kernel_entry

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

var shellExec = function () {
    exec("./shellExec.sh", (error, stdout, stderr) => {
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

var pseudolbl = 0
var userStrings = {}
var line;
var wordNumber;
var inFunction;
var macroParams = []
var lineContents

function pseudoLabel(next) {
    if (next == "next") {
        return `AUTO${pseudolbl + 1}`
    } else if (next == "secnext") {
        return `AUTO${pseudolbl + 2}`
    }
    return `AUTO${pseudolbl}`
}

function incPseudoLabel() {
    pseudolbl++
}

function tError(m) {
    console.log(`Error at line ${line + 1}: ${m}`)
    process.exit(1)
}

var definedFuncs = {
    printf: function (type, value) {
        if (type == "s" || type == "%s") {
            main_kernel_data.push(`put_string ${value}`)
        } else if (type == "i" || type == "%i") {
            main_kernel_data.push(`put_int ${value}`)
        } else if (type == "c" || type == "%c") {
            main_kernel_data.push(`put_char ${value}`)
        } else {
            console.error("Error: Unkown type", type)
        }
    },
    printLine: function (type, value) {
        this.printf(type, value)
        main_kernel_data.push(`new_line`)
    },
    printAddr: function (type, value, index) {
        if (type == "s" || type == "%s") {
            main_kernel_data.push(`put_string ${value}, ${index}`)
        } else if (type == "i" || type == "%i") {
            main_kernel_data.push(`put_int ${value}, ${index}`)
        } else if (type == "c" || type == "%c") {
            main_kernel_data.push(`put_char ${value}, ${index}`)
        } else {
            console.error("Error: Unkown type", type)
        }
    },
    label: function (name) {
        main_kernel_data.push(`${name}:`)
    },
    if: function (value1, comparer, value2) {
        var comparebyte = "cmp"
        if ((value1[0] == "[" && value1.at(-1) == "]") || (value2[0] == "[" && value2.at(-1) == "]")) {
            comparebyte = "cmpb"
        }
        main_kernel_data.push(
            `${comparebyte} ${value1}, ${value2}`,
            `${compares[comparer]} ${pseudoLabel()}`, //jump to pseudo label if condition is met
            `jmp ${pseudoLabel("next")}`, //otherwise jump to the next one
            `${pseudoLabel()}:` //create the label
        )
    },
    extif: function (value1a, comparer1, value2a, type, value1b, comparer2, value2b) {
        var comparebyte = "cmp"
        var comparebyte2 = "cmp"

        if ((value1a[0] == "[" && value1a.at(-1) == "]") || (value2a[0] == "[" && value2a.at(-1) == "]")) {
            comparebyte = "cmpb"
        }
        if ((value1b[0] == "[" && value1b.at(-1) == "]") || (value2b[0] == "[" && value2b.at(-1) == "]")) {
            comparebyte2 = "cmpb"
        }

        if (type == "&&" || type.toUpperCase() == "AND") {
            main_kernel_data.push(
                `${comparebyte} ${value1a}, ${value2a}`, //check
                `${compares[comparer1]} ${pseudoLabel()}`, //jump to pseudo label if condition is met
                `jmp ${pseudoLabel("next")}`, //otherwise jump to the escape one
                `${pseudoLabel()}:`, //create the "if" label
                `   ${comparebyte2} ${value1b}, ${value2b}`,
                `   ${compares[comparer2]} ${pseudoLabel("secnext")}`,
                `   jmp ${pseudoLabel("next")}`,
                `   ${pseudoLabel("secnext")}:` //final label
            )
        } else if (type == "||" || type.toUpperCase() == "OR") {
            main_kernel_data.push(
                `${comparebyte} ${value1a}, ${value2a}`,
                `${compares[comparer1]} ${pseudoLabel()}`,
                `${comparebyte2} ${value1b}, ${value2b}`, //if false, try the second one
                `${compares[comparer2]} ${pseudoLabel()}`,
                `jmp ${pseudoLabel("next")}`,
                `${pseudoLabel()}:` //true
            )
        }
    },
    endif: function () {
        incPseudoLabel()
        main_kernel_data.push(
            `${pseudoLabel()}:`
        )
    },
    else: function () {
        incPseudoLabel()
        main_kernel_data.push(
            `jmp ${pseudoLabel("secnext")}`, //exit the if statement
            `${pseudoLabel()}:`, //else label
        )
        incPseudoLabel()
    },
    jump: function (destination) {
        main_kernel_data.push(
            `jmp ${destination}`
        )
    },
    newLine: function () {
        main_kernel_data.push(
            `new_line`
        )
    },
    setVar: function (name, value) {
        main_kernel_data.push(
            `set_var ${name}, ${value}`
        )
    },
    setString: function (addr, newString) {
        if (newString[0] == '"' || newString[0] == "'") {
            newString = newString.slice(1, -1) // remove extra quotes
        }
        if (userStrings[addr] == undefined) {
            tError(`String "${newString}"" not defined`)
        }
        if (newString.length > userStrings[addr].length) {
            tError(`New String "${newString}" is longer than "${userStrings[addr]}"`)
        }
        console.log(userStrings)
        newString.split("").forEach((x, ind) => { //for each char
            main_kernel_data.push(
                `set_var ${addr} + ${ind}, '${x}'` // memory[stringStart + offset] = newString[offset]
            )
        })
    },
    setStringUnsafe: function (addr, newString) {
        if (newString[0] == '"' || newString[0] == "'") {
            newString = newString.slice(1, -1) // remove extra quotes
        }
        if (userStrings[addr] == undefined) {
            tError(`String "${newString}"" not defined`)
        }
        if (newString.length > userStrings[addr].length) {
            tError(`New String "${newString}" is longer than "${userStrings[addr]}"`)
        }
        definedSpecials.type(["string", newString, "=", `"${newString}"`])
        main_kernel_data.push(
            `push %ebx`,
            `push %edx`,
            `mov %ebx, 0`,
            `${pseudoLabel()}:`, //loop the length of the string
            `lea %edx, ${addr}`, //get the addres of the string
            `add %edx, %ebx`, //add the offset
            `mov %edx, [${newString} + %ebx]`,
            `inc %ebx`,
            `cmp %ebx, ${newString.length}`,
            `jl ${pseudoLabel()}`, // repeat until finished string
            `pop %edx`,
            `pop %ebx`, //restore ebx
        )
        incPseudoLabel()
    },
    strcpy: function (str1, str2) { // string/var , var
        if (userStrings[str1] != undefined) { // var1 => var2
            tError(`strcpy from vars to vars not implemented`)
        } else { //is just string
            this.setString(str2, str1) //set str2 to str1
        }
    },
    ['function']: function (name, fbrac) {
        inFunction = "func"
        main_kernel_data.push(
            `${name}:`
        )
    },
    ['}']: function () {
        if (inFunction == "func") {
            main_kernel_data.push(
                `ret`
            )
        } else {
            macroParams = []
            main_kernel_data.push(
                `.endm`
            )
        }
        inFunction = ""
    },
    call: function (func) {
        main_kernel_data.push(
            `call ${func}`
        )
    },
    sip: function (string) {
        var randString = "S" + String(Math.random()).slice(2,6)
        data_section_data.push(`${randString}: .asciz ${string}`)
        //lineContents[wordNumber] = "[" + randString + "]"
        lineContents[wordNumber] = randString
    }
}

var definedSpecials = {
    type: function (rest) {
        if (rest[0] == "string") {
            var temp = rest[3]
            if (rest[3][0] == "'" || rest[3][0] == '"') {
                temp = rest[3].slice(1, -1)
            }
            userStrings[rest[1]] = temp
        }
        data_section_data.push(`${rest[1]}: ${typedefs[rest[0]]} ${rest[3]}`)
    },
    macro: function (rest) {
        inFunction = "macro"
        rest = rest.slice(0, -1) //remove the "{"
        macroParams = rest.slice()
        console.log("RESST",rest)
        main_kernel_data.push(`.macro ${rest[0]} ${rest.slice(1).join(",")}`)
        var ps = rest.slice(1).map((_,ind) => `V${ind}`)
        var eString = `
        definedFuncs[rest[0]] = function(${ps.join(",")}) {
            main_kernel_data.push("${rest[0]} " + Object.values(arguments).join(","))
        }`
        console.log(eString)
        eval(eString)
    },
    "++": function (rest) {
        main_kernel_data.push(`inc_var ${rest[0]}`)
    },
    "--": function (rest) {
        main_kernel_data.push(`dec_var ${rest[0]}`)
    }
}

/* #endregion */

var data_section_data = []
var main_kernel_data = []

module.exports = function run(code) {
    code = code.replace(/\s+(?=(?:(?:[^"]*"){2})*[^"]*"[^"]*$)/gm, "_")
    code = code.split('\n').filter(x => x).map(x => {
        return x.split(/[\s,\(\)]+/) //split by: comma, space, parenthesis
    }).map(x => x.filter(n => n)) //remove the emptyness

    for (line = 0; line < code.length; line++) {
        lineContents = code[line]
        if (inFunction == "macro") {
            console.log("HIIII")
            lineContents = lineContents.map(x => {
                if (macroParams.includes(x)) {
                    return "\\" + x
                }
                return x
            })
            console.log(lineContents)
        }
        for (wordNumber = lineContents.length - 1; wordNumber >= 0; wordNumber--) {
            var wordContents = lineContents[wordNumber]
            if (wordContents[0] == "*") { //IF POINTER
                lineContents[wordNumber] = `[${wordContents.slice(1)}]`
            }

            if (Object.keys(definedFuncs).includes(wordContents)) { //IF FUNCTION
                var argbuff = []
                for (i = 1; i <= definedFuncs[wordContents].length; i++) { //iterate over how many arguments the function takes
                    argbuff.push(String(lineContents[wordNumber + i]))
                }
                definedFuncs[wordContents](...argbuff)
                console.log(`${wordContents}(${argbuff})`)
            }

            if (Object.keys(definedSpecials).includes(wordContents)) { //IF SPECIAL
                definedSpecials[wordContents](lineContents.slice(wordNumber + 1))
                console.log(`${wordContents}([${lineContents.slice(wordNumber + 1)}])`)
            }
        }
    }
    console.log(code)
    fs.writeFileSync('kernel.s', outConts.header + data_section_data.join("\n") + outConts.middle + main_kernel_data.join("\n") + outConts.footer)
    shellExec()
}