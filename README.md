# massiveOpenOnlineCoursesMOOC
Collection of exercises I completed


## Example of a bug report
**Problem to solve**
My end goal is to [..]

**Steps to Reproduce**
1. In [..] directory, create file.js with:
`import fs from "fs";

async function asynCall(filePath_str) {
  const fsPromises = fs.promises;
}
`
2. On [..] directory, create index.html with:
```
<script
  src="..\path\file.js"
  type="module"
></script>
```
3. Check the following list:
   - item 1
   - item 2
In the table below:
| ---------- | ---------- |
| Element	| Markdown Syntax |
| Italic | *italicized text* |
---

**Proposed solution**
from [title](https://stackoverflow.com/questions/72458428/uncaught-typeerror-failed-to-resolve-module-specifier-fs-relative-references)

**Expected Behavior**
fs is a Node.js built-in module. It does things which browsers do not allow JavaScript to do (like access the file system).

**Actual Behavior**
Error: Uncaught TypeError: Failed to resolve module specifier "fs". Relative references must start with either "/", "./", or "../"
Image	![alt text](image.jpg)

[^1]: footnote


Definition List	term
: definition
Strikethrough	~~The world is flat.~~
Task List	- [x] Write the press release
- [ ] Update the website
- [ ] Contact the media
Emoji :joy:
Highlight these ==very important words==.
Subscript	H~2~O
Superscript	X^2^
