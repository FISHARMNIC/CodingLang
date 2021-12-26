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

### Documentation
---
#### Data types
There are three main data types: integers, strings, and characters. Characters must be put in single quotes ('...') where strings must be put in double quotes ("..."). Similar to C, the star (\*) indicates a pointer (described in depth later). When creating a variable, declare `type <var type> = <value>`. for arrays, simply seperate each value with a comma.
  ex. `type string myString = "hello world!"
      `type int myInteger = 123456`
      `type char myCharacter = 'Q' < note the single quotes
      `type int myIntArray = 1, 2, 3, 4`
      `type string myStrArray = "hello", "world"`

To edit variables, one must use the following functions:

##### setVar(<name>, <value>)
####       
