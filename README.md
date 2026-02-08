# Meme Generator - Full Stack App

A powerful, full-stack meme generator built with Next.js and InstantDB. Create memes with a Photoshop-like text layer system, then share them with the community. Upload your own images or use built-in templates, add unlimited customizable text boxes, and let others upvote your creations!

## Features

### Image Sources
- **Template Library**: Choose from pre-loaded meme templates in the sidebar
- **Image Upload**: Upload any image file to use as your base image

### Text Layer System
- **Unlimited Text Boxes**: Add as many text layers as you want with the "+ Add Text" button
- **Drag & Drop Positioning**: Click and drag any text box to position it anywhere on the image
- **Resizable Text Areas**: Drag the corner handles to resize each text box to fit your content
- **Multi-line Text**: Type multiple lines of text - text automatically wraps within the box boundaries
- **Delete Layers**: Click the X button on any text box to remove it, or use the Delete button in the control panel

### Text Customization
- **Font Size**: Adjustable from 10px to 100px with a slider
- **Font Family**: Choose from Impact, Arial Black, Comic Sans MS, Verdana, or Georgia
- **Text Color**: Full color picker for custom text colors
- **Text Styling**: White text with black outline by default (customizable color)

### Canvas Controls
- **Zoom In/Out**: Use the +/- buttons or Alt + scroll wheel (Photoshop-style) to zoom from 50% to 400%
- **Fit to Screen**: Reset zoom to 100% with the "Fit" button
- **Scrollable Canvas**: When zoomed in, scroll around the canvas to position text precisely

### Export & Sharing
- **Download as JPEG**: Export your finished meme as a high-quality JPEG image
- **Clean Export**: Selection handles and UI elements are automatically hidden in the downloaded image
- **Post to Feed**: Share your memes with the community
- **Browse Feed**: View all memes posted by users
- **Upvote System**: Upvote your favorite memes
- **Real-time Updates**: See new memes and upvotes in real-time

## Usage

1. **Load an Image**:
   - Click any template thumbnail in the left sidebar, OR
   - Click "Upload Image" to select your own image file

2. **Add Text Layers**:
   - Click the "+ Add Text" button in the bottom control panel
   - A new text box will appear on the canvas

3. **Edit Text**:
   - Click on a text box to select it
   - Type your text in the "Text" field in the control panel
   - Press Enter for new lines
   - Text automatically wraps within the box width

4. **Position & Resize**:
   - **Move**: Click and drag the text box to reposition it
   - **Resize**: Drag any of the four corner handles to resize the text area
   - **Delete**: Click the red X button in the top-right corner of the text box

5. **Customize Appearance**:
   - Adjust font size with the slider (10-100px)
   - Select a font family from the dropdown
   - Choose a text color with the color picker
   - Changes apply to the currently selected text layer

6. **Zoom for Precision**:
   - Hold Alt and scroll to zoom in/out
   - Use the +/- buttons for step-by-step zoom
   - Click "Fit" to return to 100% zoom

7. **Download or Post**:
   - Click the "Download" button to save your meme as a JPEG file
   - Click "Post Meme" to share it with the community (requires sign-in)
   - The filename includes a timestamp

8. **Browse Feed**:
   - Navigate to the Feed page to see all posted memes
   - Upvote memes you like
   - View memes sorted by newest first

## Keyboard Shortcuts

- **Delete/Backspace**: Delete the selected text layer (when not editing text)
- **Escape**: Deselect the current text layer

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: InstantDB (real-time database)
- **Storage**: InstantDB Storage (for meme images)
- **Authentication**: InstantDB Auth (magic codes & guest auth)
- **Language**: TypeScript
- **Styling**: CSS Modules

## File Structure

```
/
├── app/
│   ├── layout.tsx              # Root layout with InstantDB provider
│   ├── page.tsx                # Meme generator page
│   ├── feed/
│   │   └── page.tsx            # Meme feed page
│   ├── globals.css             # Global styles
│   ├── meme-generator.css      # Meme generator styles
│   └── feed/
│       └── feed.css            # Feed page styles
├── components/
│   ├── MemeCanvas.tsx          # Canvas component with text layers
│   ├── TemplateSelector.tsx    # Template sidebar
│   ├── ControlPanel.tsx        # Bottom control panel
│   ├── MemeCard.tsx            # Feed meme card with upvote
│   └── AuthButton.tsx          # Login/logout component
├── lib/
│   └── db.ts                   # InstantDB initialization
├── instant.schema.ts           # Database schema
├── instant.perms.ts            # Database permissions
├── public/
│   └── templates.js            # Template images (base64)
└── package.json                # Dependencies
```

## Setup

See [SETUP.md](SETUP.md) for detailed installation and deployment instructions.

Quick start:
```bash
npm install
npx instant-cli@latest push  # Deploy schema
npm run dev
```

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas API
- FileReader API
- CSS Grid and Flexbox
- ES6 JavaScript features

## Technical Notes

- All images are converted to data URLs internally to ensure downloads always work, regardless of how the app is served
- The canvas automatically resizes to maintain the image's aspect ratio (max 600x400px)
- Text wraps automatically within each text box's boundaries
- Each text layer maintains its own position, size, and styling independently
- The app uses a clean, minimalist dark mode design
