# CodingLang
made for linux or windows WSL
---

### What is This?
This program takes code that you write and compiles it into assembly language. The out-file is then assembled and linked with a bootloader so that it can run freestanding! Keep in mind, the compiler is written in javascript, so you will need nodeJS. Have fun and feel free to check out how I made each correspoding function in assembly under `JScompiler/data.s`.

### Requirements
1. gnu gas / linux binutils
2. xorriso
3. qemu
4. grub cli tools
5. nodeJS newest version (Important! this program uses prototype functions that are only present in the newest version)
6. (preferrably Kali) linux for WSL (if on windows)

### How To?

- on linux (tested on kali)
1. navigate to the directoy `JScompiler`
2. run `node index.js program.txt`

- on windows
4. Open the `shellExec.sh` file and add `wsl -t` before the `qemu` line (2nd to last)
5. navigate to the directory `JScompiler` -- `cd JScompiler`
6. enter WSL -- `wsl --setdefault kali-linux && wsl`
7. run `node index.js program.txt`

### What do I do After I Run it?
QEMU should pop up and present you with the grub bootloader. From there, click enter when you see the multiboot menu. When you're done, exit the program through the terminal (`ctrl + c`) or click the `x` on the QEMU window.

### How do I Write my Own Code?
The file `program.txt` in the folder `JScompiler` holds your code. When executing, the last parameter (the file) can be changed to whatever file you want. Go ahead and check out `example_programs.txt` in the `JScompiler` folder to see some samples!

# Documentation
---
## Data types
---
There are three main data types: integers, strings, and characters. Characters must be put in single quotes ('...') where strings must be put in double quotes ("..."). Similar to C, the star (\*) indicates a pointer (described in depth later). When creating a variable, declare `type <var type> = <value>`. for arrays, simply seperate each value with a comma.  
ex. 
* `type string myString = "hello world!"`   
* `type int myInteger = 123456`  
* `type char myCharacter = 'Q'` < note the single quotes  
* `type int myIntArray = 1, 2, 3, 4`  
* `type string myStrArray = "hello", "world"`  

## Arrays
---

### Important notes
The size of each itme of a string array is set to that of the longest. That means that:   
`type string strarr = "a", "bc", "def", "efgh"`  
Will created as
`type string strarr = "a   ", "bc  ", "def ", "efgh"`  

### Reading
When accessing arrays, one places square brackets directly after the name of the array. In these brackets, can be put other variables, and constant, but **not functions/equations**. 

Allowed:  
	* `myArray\[0]`  
	* `myArray\[myIndex]`  
Not Allowed:  
	* `myArray\[myIndex + 1]`

### arrayLength(\<array name>)
This function returns the length of an array

### Writing
See strcpy/intcpy

## Variable re-definition/editing
---
### setVar(\<name>, \<value>)
This function is used for setting **characters and integers** only.  

**Allowed:**  
     * `setVar(myCharacter, 'N')`  
     * `setVar(myInteger, 54321)` <br>
**Not Allowed:**  
     * `setVar(myInteger, "123")`
	 
### setString(\<name>,\<value>)
This function is used for settings string variables to another **constant string**. Note: it is important to know that new string length must be less than or equal to in length compared to the old string. This function is very limited, but is safer than the `strcpy` method showed later. My compiler will warn you about any errors that occur when copying a string in this functoin.  

(where `myString` = "hello world!")  
  
**Allowed:**   
	* `setString(myString, "adios mundo!")` < same length as the original string  
    * `setString(myString, "whats up")` < shorter than the original string  
**Not Allowed:**   
     * `setString(myString, 1234)`  
     * `setString(myString, "how are you today?")` < longer than the original string
	 * `setString(myString, myOtherString) < reference to another string

### setStringUnsafe/strcpy/intcpy (\<destination>,\<source>)
These functions do **the same thing**, and copy memory from one address to another. This can be used for setting varaibles to other variables, and changing the contents of an array. When copying strings, **the length of the source string must be less or equal to that of the destiantion, otherwise unwarned data corruption will occur**. For integers, the size of the source must be greater than or equal to the size of the destination. However, it is recommended to use `setVar` instead when possible.

where   
`myStrings` = "hello", "how", "are", "you"  
`myStrings2` = "hi", "cow", "chicken", "beef"  
`myInts` = 1, 2, 3, 4

Allowed:  
	* `strcpy(myStrings\[2], "Adios")`    
	* `strcpy(myStrings\[0], myStrings2\[3]`  
	* `intcpy(myInts\[0], 123)`  
Not Allowed:  
	* `strcpy(myStrings\[1], myStrings2\[2])` < note how "chicken" is longer than "how"
