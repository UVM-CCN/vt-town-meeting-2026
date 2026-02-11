# Vermont Town Meeting Day 2026 Results

An interactive static website displaying Vermont Town Meeting Day results and participation data mapped across Vermont municipalities using OpenStreetMap and GeoJSON.

## Features

- 📍 **Interactive Map**: Full-width map of Vermont municipalities powered by Leaflet.js and OpenStreetMap
- 📊 **Participation Data**: Color-coded towns showing participation rates
- 🎨 **Responsive Design**: Mobile-friendly interface with clean, modern styling
- ⚡ **Static Site**: No backend required - deploy anywhere with a simple script

## File Structure

```
.
├── index.html              # Main HTML file with intro section
├── styles.css              # Responsive styling
├── script.js               # Leaflet map initialization and interactions
├── vermont-towns.geojson   # Sample GeoJSON data for Vermont towns
├── deploy.sh               # GitHub Pages deployment script
├── .gitignore              # Git ignore patterns
├── README.md               # This file
└── LICENSE                 # License file
```

## Data Format

The `vermont-towns.geojson` file contains town data with the following properties:

```json
{
  "type": "Feature",
  "properties": {
    "name": "Town Name",
    "participation": 75,      // Percentage (0-100)
    "population": 10000,      // Town population
    "attendance": 500         // Meeting attendance
  },
  "geometry": {
    "type": "Point",
    "coordinates": [-73.0, 44.0]
  }
}
```

## Setup

### Prerequisites
- Git
- A GitHub account (for GitHub Pages deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/vt-town-meeting-2026.git
   cd vt-town-meeting-2026
   ```

2. **Open locally** (any of these methods)
   - **Python 3**: `python -m http.server 8000`
   - **Python 2**: `python -m SimpleHTTPServer 8000`
   - **Node.js**: `npx http-server`
   - **Live Server** (VS Code): Install Live Server extension and click "Go Live"

3. **Visit** `http://localhost:8000` in your browser

## Customization

### Update Town Data

Edit `vermont-towns.geojson` to add or modify town information:

```json
{
  "type": "Feature",
  "properties": {
    "name": "Montpelier",
    "participation": 78,
    "population": 7855,
    "attendance": 450
  },
  "geometry": {
    "type": "Point",
    "coordinates": [-72.5753, 44.2558]
  }
}
```

### Change Colors

Modify the participation rate thresholds in `script.js`:

```javascript
if (participationRate >= 75) {
    color = '#1a5f3f'; // Dark green - high participation
}
```

### Update Intro Text

Edit the intro paragraph in `index.html`:

```html
<p class="intro-text">
    Your custom text here...
</p>
```

## Deployment

### GitHub Pages Deployment

1. **Initialize Git (if not already done)**
   ```bash
   git init
   git remote add origin https://github.com/yourusername/vt-town-meeting-2026.git
   ```

2. **Commit your changes**
   ```bash
   git add .
   git commit -m "Initial commit: Vermont Town Meeting website"
   git push -u origin main
   ```

3. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Settings → Pages
   - Select "Deploy from a branch"
   - Choose `gh-pages` branch and save

4. **Run the deployment script**
   ```bash
   ./deploy.sh
   ```

   The script will:
   - Create/update the `gh-pages` branch
   - Copy all necessary files
   - Create `.nojekyll` file
   - Push to GitHub

5. **Your site is live!**
   - Access it at: `https://yourusername.github.io/vt-town-meeting-2026`
   - May take 1-2 minutes to appear

### Alternative Deployment Methods

**Netlify**
```bash
# Connect your GitHub repo to Netlify
# No build configuration needed
# Deploy on push automatically
```

**Vercel**
- Connect GitHub repo to Vercel
- Deploy automatically on push

**Generic Static Hosting**
```bash
# Simply upload all files to your hosting provider
# No build step required
```

## Updating Data

To update town meeting results:

1. Edit `vermont-towns.geojson` with new data
2. Commit and push changes:
   ```bash
   git add vermont-towns.geojson
   git commit -m "Update town meeting results"
   git push
   ```
3. Run deploy script (or it updates automatically if using CI/CD):
   ```bash
   ./deploy.sh
   ```

## Browser Compatibility

- Chrome/Edge 60+
- Firefox 55+
- Safari 12+
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

See [LICENSE](LICENSE) file for details.

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Resources

- [Leaflet.js Documentation](https://leafletjs.com/)
- [GeoJSON Specification](https://geojson.org/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [GitHub Pages Guide](https://pages.github.com/)

## Support

For issues, questions, or suggestions, please open a GitHub issue.