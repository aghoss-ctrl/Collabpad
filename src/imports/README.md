# Blind Padlet — FigJam Widget

A FigJam widget where participants submit responses that stay hidden until the host reveals them all at once. Great for unbiased brainstorms, retrospectives, and anonymous-ish feedback sessions.

## Features
- ✏️ Users type short or long responses
- 🔒 Other users' responses show as hidden cards until revealed
- 👁 Host clicks "Reveal All Responses" to show everything at once
- 🙈 Host can hide responses again
- 👤 Names are shown on all revealed cards
- ✏️ Users can update or remove their own response at any time
- 📝 The prompt text is editable (click it to change it)

---

## Setup Instructions

### Requirements
- [Figma Desktop App](https://www.figma.com/downloads/) (Mac or Windows)
- [Node.js + NPM](https://nodejs.org/en/download/)

### Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build the widget**
   ```bash
   npm run watch
   ```
   Keep this terminal open while developing.

3. **Load in Figma Desktop**
   - Open the Figma desktop app
   - Open or create a FigJam file
   - Go to **Menu → Widgets → Development → Import widget from manifest...**
   - Select the `manifest.json` file from this folder
   - Your widget will appear under the Development section

4. **Use it!**
   - Insert the widget onto your board
   - Click the prompt text to set your question
   - Share the FigJam board with participants
   - Everyone types and submits their response
   - When ready, click **"Reveal All Responses"**

---

## How Responses Work

| State | What participants see |
|---|---|
| Before reveal | Their own response + "🔒 Hidden response" placeholders for others |
| After reveal | All responses with author names |

---

## Publishing (Optional)

To share with others via the Figma Community:
- Run `npm run build` to minify
- Go to **Menu → Widgets → Publish widget**
- Follow Figma's review process
