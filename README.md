# Meme Generator

A simple, web-based meme generator that allows you to upload images and add customizable text overlays.

## Features

- **Image Upload**: Upload any image file to use as a meme template
- **Text Overlay**: Add text to the top and bottom of your image
- **Customizable Text**: 
  - Adjustable font size (20-100px)
  - Multiple font family options (Impact, Arial Black, Comic Sans MS, etc.)
  - White text with black border for maximum visibility
- **Download**: Export your meme as a PNG image

## Usage

1. Open `index.html` in a web browser
2. Click "Choose Image" to upload an image file
3. Enter your top and/or bottom text
4. Adjust the font size and font family as desired
5. Click "Download Meme" to save your creation

## File Structure

- `index.html` - Main HTML structure
- `style.css` - Styling and layout
- `script.js` - Core functionality and canvas manipulation
- `README.md` - This file

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas API
- FileReader API
- CSS Grid

## Notes

- The canvas automatically resizes to maintain the image's aspect ratio
- Text wraps automatically if it's too long for the canvas width
- The meme is downloaded as a PNG file with a timestamp-based filename
