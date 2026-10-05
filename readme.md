# Algorithm Arena

Algorithm Arena is a browser-based sorting visualizer for exploring how sorting algorithms work. It displays values as animated bars and lets you compare algorithms using their comparisons, swaps, and runtime.

## Features

- Generate a random array and adjust its size and animation speed.
- Visualize Bubble, Selection, Insertion, Quick, and Merge Sort.
- Start, stop, and reset a sorting animation.
- Compare two different algorithms in an Algorithm Race using copies of the same array.
- View comparison counts, swap counts, timing, and algorithm time complexity.
- Responsive dark interface built without a CSS framework.

## Built with

This project uses plain HTML, CSS, and JavaScript. It was made with the help of **WisprFlow AI**.

## Run locally

From the project folder, start Python's built-in web server:

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser. Stop the server with **Ctrl+C** in the terminal.

## Project files

- `index.html` — page structure and controls
- `style.css` — dark theme, responsive layout, and animations
- `app.js` — array generation, sorting animations, statistics, and Algorithm Race
