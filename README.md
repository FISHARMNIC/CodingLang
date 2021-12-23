# CodingLang
made for linux or windows WSL
---

### What is This?
This program takes code that you write and compiles it into assembly language. The out-file is then assembled and linked with a bootloader so that it can run freestanding! Keep in mind, the compiler is written in javascript, so you will need nodeJS. The program `index.js` holds your code under the string `mycode`, change that to your code!. Have fun and go ahead and check out how I made each correspoding function in assembly under `JScompiler/data.s`.

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
2. run `node index.js`

- on windows
4. Open the `shellExec.sh` file and add `wsl -t` before the `qemu` line (2nd to last)
5. navigate to the directory `JScompiler` -- `cd JScompiler`
6. enter WSL -- `wsl --setdefault kali-linux && wsl`
7. run `node index.js

### What do I do After I Run it?
QEMU should pop up and present you with the grub bootloader. From there, click enter when you see the multiboot menu. When you're done, exit the program through the terminal (`ctrl + c`) or click the `x` on the QEMU window.

### How do I Write my Own Code?
The program `index.js` in the folder `JScompiler` holds your code under the string `mycode` (The string can be multiLine). Go ahead and check out `programs.txt` in the `JScompiler` folder to see some samples!
