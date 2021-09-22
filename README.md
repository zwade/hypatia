# Hypatia

Hypatia is an interactive learning platform for the web. It lets content creators write tutorials in an expanded flavor of markdown, and then renders it alongside a live terminal.

## Setup

```bash
git clone git@github.com:zwade/hypatia.git
cd hypatia

yarn
yarn r build
MODULE=ALL yarn r start
```

Then navigate to http://localhost:3001/

## Modules

Modules should be located in the `modules/` directory. Each module should contain a directory of lessons, and each directory should contain a list of page files, written in markdown.

## Markdown

The markdown supported includes

- Standard Markdown
- Github Flavored Markdown
- Code Extensions
- Quizes

### Code Extensions

Both inline and block code can have tags applied to them. Tags take the following form

```
`inline code` {{ tag1 tag2 }}

```code
code block
```‍
{{ tag1 tag2 }}
```

The supported tags are:

- `execute`: Adds a button to automatically run the code in the attached terminal
- `numbered`: Adds line numbers to the code block
- `autorun`: Runs the code when the page loads

### Quizes

Hypatia also supports quizes inline. The formats supported are

```markdown
??  Q1: Exact Equality
?:  === answer

??  Q2: Regex Equality
?:  =~= ^.*answer.*$

??  Q3: Multiple Choice, Multiple Answer
?:  [*] Correct
[ ] Not Correct
[*] Also Correct
[ ] Also Not Correct

??  Q4: Multple Choice, Single Answer
?:  ( ) Not Correct
(*) Correct
( ) Also Not Correct

```

## Licence

MIT License, [Zach Wade](https://github.com/zwade)
