# Chimichan

## Chimichan MVP Web App

The Chimichan MVP is a simple single-page application for processing Japanese text. It includes:

1. **Input Area**: Enter Japanese text.
2. **Output Section**: View decorated text with annotations.
3. **Intermediate Parsing Results**: Inspect tokenization and parsing details.

### How to Run the MVP

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Start the Development Server**:

   ```bash
   npm start
   ```

3. **Open the App**: The app will automatically open in your default browser. If not, navigate to: [http://localhost:8080](http://localhost:8080)

### File Structure

- `webapp/index.html`: Main HTML file.
- `webapp/app.js`: JavaScript logic for parsing and decorating text.
- `webapp/style.css`: Additional styles for the app.
- `tests/`: Unit tests for the project modules.

### Build System

- **Development Server**: Uses `http-server` to serve the app locally.
- **Build Step**: No build step is required for the MVP.

### Future Enhancements

- Integrate with the actual parser and decorator modules.
- Add support for pitch accents and furigana.
- Improve UI/UX for better readability and interaction.