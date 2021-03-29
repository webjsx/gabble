# Gabble

Gabble is a static site generator for Node.JS. It's framework agnostic, so you can use it with your framework of choice - as long is they support server-side rendering. 

TBH, gabble doesn't do much. It simply finds JS files in a folder you specify, runs the default export on each of those files, and writes the output into an html file.

## Usage

Basic usage:

```sh
npx gabble -s <source_dir> -o <output_dir> [options]
```

Options:

```
--noext : generate directories with index.html instead of pagename.html
```


