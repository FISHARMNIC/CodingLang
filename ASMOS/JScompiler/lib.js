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
var userArrays = {}
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

function randomStringName() {
    return "S" + String(Math.random()).slice(2, 6)
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
        console.log("SETTING", addr, newString)
        if (newString[0] == '"' || newString[0] == "'") {
            newString = newString.slice(1, -1) // remove extra quotes
        }
        if (userStrings[addr] == undefined) {
            tError(`String "${newString}"" not defined`)
        }
        if (newString.length > userStrings[addr].length) {
            tError(`New String "${newString}" is longer than "${userStrings[addr]}"`)
        }
        //console.log(userStrings)
        newString.split("").forEach((x, ind) => { //for each char
            main_kernel_data.push(
                `set_var ${addr} + ${ind}, '${x}'` // memory[stringStart + offset] = newString[offset]
            )
        })
    },
    setStringUnsafe: function (addr, newString) {
        var randString = randomStringName()
        definedSpecials.type(["string", randString, "=", `"${newString}"`])
        main_kernel_data.push(
            `mov %cx, 3   # how many bytes to copy (numeric value)`,
            `lea %si, [${randString}]      # offset new string into SI`,
            `lea %di, [${addr}]   # offset destination string into DI`,
            `rep movsb`
        )
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
        var randString = randomStringName()
        data_section_data.push(`${randString}: .asciz ${string}`)
        //lineContents[wordNumber] = "[" + randString + "]"
        lineContents[wordNumber] = randString
    },
    mathResult: function () {
        lineContents[wordNumber] = '%eax'
    },
    "++": function (v) {
        main_kernel_data.push(`inc_var ${v}`)
        lineContents[wordNumber] = v
        lineContents.splice(wordNumber + 1,1)
    },
    "--": function (v) {
        main_kernel_data.push(`dec_var ${v}`)
        lineContents[wordNumber] = v
        linelineContents.splice(wordNumber + 1,1)
    },
    addVar: function (v, val) {
        main_kernel_data.push(`add_var ${v}, ${val}`)
    },
    subVar: function (v, val) {
        main_kernel_data.push(`sub_var ${v}, ${val}`)
    },
    mulVar: function (v, val) {
        main_kernel_data.push(`mul_var ${v}, ${val}`)
    },
    mulVars: function (v, val) {
        main_kernel_data.push(`mul_vars ${v}, ${val}`)
    },
    arrayIndex: function (array, index) {
        console.log("!!!!", array, index)
        if (String(index) == "0") {
            lineContents[wordNumber] = array
            //lineContents.splice(wordNumber + 1,1)
        } else if (!parseInt(index)) { //if a variable
            main_kernel_data.push(
                //`push %eax`,
                //`push %ebx`,
                `mov %eax, [${index}]`,
                `mov %ebx, ${userArrays[array]}`,
                `mul %ebx`,
            )
            lineContents[wordNumber] = `[${array} + %eax]`
        } else {
            //lineContents[wordNumber] = array + "+" + userArrays[array].slice(0, index).reduce((p, c) => p + c) // add all of the item's lengths up to the desired index to get to the starting position
            lineContents[wordNumber] = array + "+" + (userArrays[array]*index)
            //console.log(array + "+" + (userArrays[array]*index))
        }
        lineContents.splice(wordNumber + 1,1)
        lineContents.splice(wordNumber + 1,1)
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

        if (rest.slice(3).length > 1) { //if array
            if (rest[0] == "string") {
                //userArrays[rest[1]] = []
                var arr = rest.slice(3)
                var longest = (arr.reduce((a, b) => a.length > b.length ? a : b)).length
                arr = arr.map(x => x.slice(0,-1) + " ".repeat(longest - x.length) + '"')
                rest[3] = arr.join(",")
                userArrays[rest[1]] = longest - 1 // minus 2 quotes + null
                // arr.forEach(x => {
                //     userArrays[rest[1]].push(x.length - 1) //save each items length - brackets + the null char
                // })
            } else if(rest[0] == "int") {
                userArrays[rest[1]] = 4
                rest[3] = rest.slice(3).join(",")
                // rest.slice(3).forEach(x => {
                //     userArrays[rest[1]].push(4) //.long numbers have 4 bytes
                // })
            }
            
            //console.log("!!!!!", userArrays)
        }
        //console.log(`${rest[1]}: ${typedefs[rest[0]]} ${rest[3]}`)
        //process.exit(0)
        data_section_data.push(`${rest[1]}: ${typedefs[rest[0]]} ${rest[3]}`)
    },
    macro: function (rest) {
        inFunction = "macro"
        rest = rest.slice(0, -1) //remove the "{"
        macroParams = rest.slice()
        //console.log("RESST", rest)
        main_kernel_data.push(`.macro ${rest[0]} ${rest.slice(1).join(",")}`)
        var ps = rest.slice(1).map((_, ind) => `V${ind}`)
        var eString = `
        definedFuncs[rest[0]] = function(${ps.join(",")}) {
            main_kernel_data.push("${rest[0]} " + Object.values(arguments).join(","))
        }`
        //console.log(eString)
        eval(eString)
    },
    mathSolve: function (code) {
        var types = {
            "+": "add",
            "-": "sub",
            "*": "mul",
            "/": "div",
        }
        code = code.join("")
        var symbols = code.split(/[0-9,a-z,A-Z]+/).slice(1, -1)
        var code = code.split(/[+,*,\/,-]+/).map(x => parseInt(x) ? parseInt(x) : `[${x}]`)
        //console.log(code, symbols)
        var beg = code[0]
        var res
        var outAsm = `
mov %al, ${beg} \n`
        for (i = 1; i < code.length; i++) {
            if (types[symbols[i - 1]] == "div") {
                outAsm += `
mov %bl, ${code[i]}
div %bl # stores in al
mov %ah, 0 # clear the remainder
`
            } else if (types[symbols[i - 1]] == "mul") {
                outAsm += `
mov %bl, ${code[i]}
mul %bl # stores back in al
`
            } else {
                outAsm += `${types[symbols[i - 1]]} %al, ${code[i]}\n`
                beg = res
            }
        }
        main_kernel_data.push(outAsm)
    }
}

/* #endregion */

var data_section_data = []
var main_kernel_data = []

module.exports = function run(code) {
    code = code.replace(new RegExp("\t","gm"), "")
    console.log(code)
    code = code.replace(/\s+(?=(?:(?:[^"]*"){2})*[^"]*"[^"]*$)/gm, "_") //add underscores in quotes
    
    code = code.split('\n').filter(x => x).map(x => {
        return x.split(/[\s,\(\)]+/) //split by: comma, space, parenthesis
    }).map(x => x.filter(n => n))
    
    for(yPos = 0; yPos < code.length; yPos++) {
        var y = code[yPos]
        for(xPos = 0; xPos < y.length; xPos++) {
            var x = y[xPos]
            
            
            if (x[0] == '"' && y[0] != "type") { // if the first letter is " and im not defining a variable
                var randString = randomStringName() // turn in-place strings into SIP references
                data_section_data.push(`${randString}: .asciz ${x}`)
                code[yPos][xPos] = randString
            }
            if(x.at(-1) == "]") {
                var ret = [`arrayIndex`, x.slice(0,x.indexOf("[")),x.slice(x.indexOf("[")+1,-1)]
                code[yPos][xPos] = ""
                code[yPos].splice(xPos, 0, ...ret);
                console.log("REPL", code[yPos])
            }

            //code[yPos][xPos] = x.replace(/_/gm, " ") //redo the spaces
        }
    }

    console.log("PARSED OUT___", code)
    
    /*
    
    */
    for (line = 0; line < code.length; line++) {
        lineContents = code[line]
        if (inFunction == "macro") {
            //console.log("HIIII")
            lineContents = lineContents.map(x => {
                if (macroParams.includes(x)) {
                    return "\\" + x
                }
                return x
            })
            //console.log(lineContents)
        }
        lineContents = lineContents.filter(_Wrd => _Wrd)
        for (wordNumber = lineContents.length - 1; wordNumber >= 0; wordNumber--) {
            
            var wordContents = lineContents[wordNumber]
            if (wordContents[0] == "*") { //IF POINTER
                lineContents[wordNumber] = `[${wordContents.slice(1)}]`
            }

            //console.log("READING", wordContents, Object.keys(definedFuncs).includes(wordContents), lineContents )
            if (Object.keys(definedFuncs).includes(wordContents)) { //IF FUNCTION
                var argbuff = []
                for (i = 1; i <= definedFuncs[wordContents].length; i++) { //iterate over how many arguments the function takes
                    argbuff.push(String(lineContents[wordNumber + i]))
                }
                definedFuncs[wordContents](...argbuff)
                console.log(`CALLED ${wordContents}(${argbuff})`)
            }

            if (Object.keys(definedSpecials).includes(wordContents)) { //IF SPECIAL
                definedSpecials[wordContents](lineContents.slice(wordNumber + 1))
                console.log(`${wordContents}([${lineContents.slice(wordNumber + 1)}])`)
            }
        }
        console.log(lineContents)
    }
    //console.log("---",code,"---")
    fs.writeFileSync('kernel.s', outConts.header + data_section_data.join("\n") + outConts.middle + main_kernel_data.join("\n") + outConts.footer)
    if(process.argv[3] != "debug") shellExec()
}