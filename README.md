# CodingLang
made for kali linux or windows kali WSL
---
### Requirements
1. gnu gas / linux binutils
2. xorriso
3. qemu
4. grub cli tools
5. nodeJS newest version
6. Kali linux for WSL (if on windows)

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
QEMU should pop up and present you with the grub bootloader. From there, click enter when you see the multiboot menu. When you're done, exit the program through the terminal (`ctrl + c`) or click the `x` on the QEMU window

### What Can I do in This Language?
Check `programs.txt` in the JScompiler folder to check out some samples!
