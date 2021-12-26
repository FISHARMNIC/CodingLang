//Note: !!!!!!!!! ADD CHARACTER ARRAYS !!!!!!!!

const fs = require('fs')
const { exec } = require("child_process");
const { parse } = require('path/posix');

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
_mathResult: .long 0
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
var forlblCounter = 0
var forLoop = {
    link: undefined,
    controller: undefined,
    endValue: undefined
}

var userStrings = {}
var line;
var wordNumber;
var inFunction;
var macroParams = []
var lineContents
var userArrays = {}
var userArrayLengths = {}
var arrayIndexUseEax = false //use edx first so that the accum can be used later
var twoIndexReferences = false
var lineCorrectionLabelCounter = 0
var compileTimeConstants = {}

function pseudoLabel(next) {
    if (next == "next") {
        return `_AUTO${pseudolbl + 1}`
    } else if (next == "secnext") {
        return `_AUTO${pseudolbl + 2}`
    }
    return `_AUTO${pseudolbl}`
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
        this.printNewLine()
        this.printf(type, value)

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
    printNewLine: function () {
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


        //-------------DIFFERENT_LENGTH_ARRAYS_DONT_WORK-----------
        //var randString = randomStringName()
        //console.log("new unsafe", randString, newString)
        //definedSpecials.type(["string", randString, "=", `"${newString}"`])
        //console.log(userArrays, newString, newString.slice(0,newString.indexOf("+")))
        var parsed;
        if (newString.includes("+")) {

            if (newString.includes("[")) {
                parsed = newString.slice(1, newString.indexOf(" "))
            } else {
                parsed = newString.slice(0, newString.indexOf("+"))
            }
        } else {
            parsed = newString
        }
        console.log(userArrays, newString, parsed, userArrays[parsed])
        //process.exit(0)
        if (twoIndexReferences) {
            main_kernel_data.push(
                `pop %edx` //restore edx from the stack
            )
        }
        if(userArrays[parsed]) {
            main_kernel_data.push(
                `mov %cx, ${userArrays[parsed].length != undefined ? userArrays[newString].length : userArrays[parsed]} `, //${newString.length}   # how many bytes to copy (numeric value)`,
                `lea %esi, ${newString}      # offset new string into SI`,
                `lea %edi, ${addr}   # offset destination string into DI`,
                `rep movsb`
            )
        } else {
            main_kernel_data.push(
                `mov %cx, [${parsed}] `, //${newString.length}   # how many bytes to copy (numeric value)`,
                `lea %esi, ${newString}      # offset new string into SI`,
                `lea %edi, ${addr}   # offset destination string into DI`,
                `rep movsb`
            )
        }


    },
    intcpy: function (str1, str2) {
        this.setStringUnsafe(str1, str2)
    },
    strcpy: function (str1, str2) {
        this.setStringUnsafe(str1, str2)
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
        userArrays[randString] = string
        //console.log(string)
        //process.exit(0)
    },
    mathResult: function () {
        lineContents[wordNumber] = '%eax'
    },
    "++": function (v) {
        main_kernel_data.push(`inc_var ${v}`)
        lineContents[wordNumber] = v
        lineContents.splice(wordNumber + 1, 1)
    },
    "--": function (v) {
        main_kernel_data.push(`dec_var ${v}`)
        lineContents[wordNumber] = v
        lineContents.splice(wordNumber + 1, 1)
    },
    addVar: function (v, val) {
        main_kernel_data.push(`add_var ${v}, ${val}`)
    },
    addVars: function (v, val) {
        main_kernel_data.push(`add_vars ${v}, ${val}`)
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
        //console.log(twoIndexReferences)
        //process.exit(0)
        if (String(index) == "0") {
            lineContents[wordNumber] = array
            //lineContents.splice(wordNumber + 1,1)
        } else if (!parseInt(index)) { //if a variable
            if (twoIndexReferences) { //if there are two items asing to be indexed
                console.log("yup", arrayIndexUseEax)
                //process.exit(0)
                if (!arrayIndexUseEax) {
                    var randString = randomStringName()
                    definedSpecials.type(["int", randString, "=", `0`])

                    main_kernel_data.push(
                        `mov %eax, [${index}]`,
                        `mov %ebx, ${userArrays[array]}`,
                        `mul %ebx`,
                        `push %eax # stores result in stack`,
                    )
                    //sthis.setVar(randString, `[${array} + %edx]`)
                    lineContents[wordNumber] = `[${array} + %edx]`
                    //lineContents[wordNumber] = `${array} + [${randString}]`
                } else {
                    main_kernel_data.push(
                        `mov %eax, [${index}]`,
                        `mov %ebx, ${userArrays[array]}`,
                        `mul %ebx # stores result in eax`,
                    )
                    lineContents[wordNumber] = `[${array} + %eax]`
                }
                arrayIndexUseEax = !arrayIndexUseEax
            } else {
                main_kernel_data.push(
                    //`push %eax`,
                    //`push %ebx`,
                    `mov %eax, [${index}]`,
                    `mov %ebx, ${userArrays[array]}`,
                    `mul %ebx`,
                )
                lineContents[wordNumber] = `[${array} + %eax]`
            }

        } else {
            //lineContents[wordNumber] = array + "+" + userArrays[array].slice(0, index).reduce((p, c) => p + c) // add all of the item's lengths up to the desired index to get to the starting position
            lineContents[wordNumber] = array + "+" + (userArrays[array] * index)
            //console.log(array + "+" + (userArrays[array]*index))
        }
        lineContents.splice(wordNumber + 1, 1)
        lineContents.splice(wordNumber + 1, 1)
    },
    "while": function (defVar, controller, endValue) {
        forLoop.link = defVar
        forLoop.endValue = endValue
        forLoop.controller = controller
        main_kernel_data.push(
            `FOR${forlblCounter}:`,
        )
    },
    endWhile: function () {
        console.log(forLoop)
        main_kernel_data.push(
            `cmpb [${forLoop.link}], ${forLoop.endValue}`,
            `${compares[forLoop.controller]} FOR${forlblCounter} `
        )
        forlblCounter++
    },
    arrayLength: function (array) {
        lineContents[wordNumber] = userArrayLengths[array]
        lineContents.splice(wordNumber + 1,1)
    },
    newFilledArray: function (type, value, length) {
        length = parseInt(length)
        if(type == "string") {
            lineContents.splice(wordNumber, 4, ...(`"${value}",`.repeat(length).slice(0,-1).split(",")))
        } else if(type == "int") {
            lineContents.splice(wordNumber, 4, ...((`${value},`).repeat(length).slice(0,-1).split(",")))
        } else {
            lineContents.splice(wordNumber, 4, ...((`'${value}',`).repeat(length).slice(0,-1).split(",")))
        }
        //console.log(type, value, length)
        //process.exit(0)
    },
    sleep(amount) {
        var label = randomStringName()
        main_kernel_data.push(
            `push %eax`,
            `mov %eax, ${amount}`,
            `${label}:`,
            `nop`,
            `sub %eax, 1`,
            `cmp %eax, 0`,
            `jge ${label}`,
            `pop %eax`
        )
    },
    clearScreen: function() {
        main_kernel_data.push('call _clearVGA')
    }

}

var definedSpecials = {
    "const": function (rest) {
        compileTimeConstants[rest[1]] = rest[3]
        //console.log(compileTimeConstants)
        //process.exit(0)
        this.type([rest[0], rest[1], "=", rest[3]])
    },
    type: function (rest) {
        if (rest[0] == "string") {
            var temp = rest[3]
            if (rest[3][0] == "'" || rest[3][0] == '"') {
                temp = rest[3].slice(1, -1)
            }
            userStrings[rest[1]] = temp
            userArrays[rest[1]] = temp
        } else if(!(rest.slice(3).length > 1)) { //not arry but is int
            userArrays[rest[1]] = rest[3]
        }

        if (rest.slice(3).length > 1) { //if array
            if (rest[0] == "string") {
                //userArrays[rest[1]] = []
                var arr = rest.slice(3)
                var longest = (arr.reduce((a, b) => a.length > b.length ? a : b)).length
                arr = arr.map(x => x.slice(0, -1) + " ".repeat(longest - x.length) + '"')
                rest[3] = arr.join(",")
                userArrays[rest[1]] = longest - 1 // minus 2 quotes + null
                userArrayLengths[rest[1]] = arr.length
                // arr.forEach(x => {
                //     userArrays[rest[1]].push(x.length - 1) //save each items length - brackets + the null char
                // })
            } else if (rest[0] == "int") {
                userArrays[rest[1]] = 4
                userArrayLengths[rest[1]] = rest.slice(3).length
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
    evaluate: function (code) {


        main_kernel_data.push(`push %eax`,`mov %eax, ${code[0]}`)// //${parseInt(code[0]) ? code[0] : code[0].includes("[") ? code[0] : `[${code[0]}]`}`) // init in eax

        console.log("#####", code, itemNum)

        for (var itemNum = 1; itemNum < code.length - 1; itemNum += 2) { //go by ops
            var item = {
                current: code[itemNum],
                previous: code[itemNum - 1],//parseInt(code[itemNum - 1]) ? code[itemNum - 1] : `[${code[itemNum - 1]}]`,
                next: code[itemNum + 1]//parseInt(code[itemNum + 1]) ? code[itemNum + 1] : `[${code[itemNum + 1]}]`
            }
            //oFile.push(`${types[item.current]} %eax, ${item.next}`)
            main_kernel_data.push(...((inD) => {
                switch (inD.current) {
                    case "+":
                        return [`add %eax, ${inD.next}`]
                    case "-":
                        return [`sub %eax, ${inD.next}`]
                    case "x":
                        return [
                            `push %ebx`,
                            `mov %ebx, ${inD.next}`,
                            `mul %ebx`,
                            `pop %ebx`
                        ]
                    case "/":
                        return [
                            `push %ebx`,
                            `mov %ebx, ${inD.next}`,
                            `div %ebx`,
                            `pop %ebx`
                        ]
                }
            })(item))
            
        }

        main_kernel_data.push(`mov _mathResult, %eax`, `pop %eax`)

        lineContents[wordNumber] = '_mathResult'
        
    },
    "#": function (rest) {
        main_kernel_data.push(`# ${rest.join(" ")}`)
    }
}

/* #endregion */

var data_section_data = []
var main_kernel_data = []

module.exports = function run(code) {
    code = code.replace(new RegExp("\t", "gm"), "")
    console.log(code)
    code = code.replace(/\s+(?=(?:(?:[^"]*"){2})*[^"]*"[^"]*$)/gm, "_") //add underscores in quotes

    code = code.split('\n').filter(x => x).map(x => {
        return x.split(/[\s,\(\)]+/) //split by: comma, space, parenthesis
    }).map(x => x.filter(n => n))

    for (yPos = 0; yPos < code.length; yPos++) { //for each line
        var y = code[yPos]
        for (xPos = 0; xPos < y.length; xPos++) { //for each word
            var x = y[xPos]
            //code[yPos][xPos] = code[yPos][xPos].replace(/\_/gm, " ")

            if (x[0] == '"' && y[0] != "type") { // if the first letter is " and im not defining a variable
                var randString = randomStringName() // turn in-place strings into SIP references
                data_section_data.push(`${randString}: .asciz ${x.replace(/_/gm, " ")}`)
                code[yPos][xPos] = randString
                userArrays[randString] = x.slice(1, -1)
            }
            if (x.at(-1) == "]") {
                var ret = [`arrayIndex`, x.slice(0, x.indexOf("[")), x.slice(x.indexOf("[") + 1, -1)]
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
        if (lineContents.filter(x => x == "arrayIndex").length == 2) {
            twoIndexReferences = true
        } else {
            twoIndexReferences = false
        }
        for (wordNumber = lineContents.length - 1; wordNumber >= 0; wordNumber--) {
            var wordContents = lineContents[wordNumber]
            if (wordContents[0] == "*") { //IF POINTER
                lineContents[wordNumber] = `[${wordContents.slice(1)}]`
            }
            if (wordContents[0] == "$") {
                lineContents[wordNumber] = compileTimeConstants[wordContents.slice(1)]
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
    if (process.argv[3] != "debug") shellExec()
}