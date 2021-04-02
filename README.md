# Gabble

Gabble is a static site generator for Node.JS. It's framework agnostic, so you can use it with your framework of choice - as long is they support server-side rendering.

TBH, gabble doesn't do much. It simply finds JS files in a folder you specify, runs the default export on each of those files (default export should be a function), takes the html property from the output, and writes it to an html file.

## Usage

Basic usage:

```sh
npx gabble -s /your/source/dir -o /your/output/dir [-x exclude_dir] [options]

# An actual example
# - Searches ~/blog-src for pages (excluding 'components' dir)
# - and outputs to ~/my-blog
npx gabble /home/jester/blog-src/pages -o /home/jester/my-blog -x components
```

Options:

```
- s : Directory in which pages are located
- o : Output directory
- x : Directory names under the pages directory to omit. It's not a full path. Can be used multiple times.
--noext : generate directories with index.html instead of pagename.html
--tabsize <num> : tabsize to use during beautification.
--ignoreerrors : Ignore errors in page and continue to next page.
--help : print these options
--version : print the version
```

## Pages

The default function of each page (under the pages directory) should return the following type or an array of the following type.

```ts
type ContentDetails = {
  path?: string;
  html: string;
};

type PageResult = ContentDetails | ContentDetails[];
```

So a page will look like this:

```js
export default function html() {
  return { html: `<html><body>Hello World</body></html>` };
}
```

By default, the path of the page is taken as the path of the js file under pages. So for instance, /some-pages-dir/index.js will be output as index.html and /some-pages-dir/subdir/index.js will be output as subdir/index.html.

However this can be overriden with the optional path property.

```js
export default function html() {
  return {
    path: "my/alt/path",
    html: `<html><body>Hello World</body></html>`,
  };
}
```

If you want a single page to output multiple files, you can simple return an array.

```js
export default function html() {
  return [
    {
      path: "page1",
      html: `<html><body>Hello</body></html>`,
    },
    {
      path: "page2",
      html: `<html><body>.... says the World</body></html>`,
    },
  ];
}
```
