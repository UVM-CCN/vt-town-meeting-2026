# Vermont Town Meeting Day 2026 Results

An interactive static website displaying Vermont Town Meeting Day results and participation data mapped across Vermont municipalities using OpenStreetMap and official Vermont town boundary GeoJSON.

## Features

- 📍 **Interactive Map**: Full-width map of Vermont municipalities powered by Leaflet.js and OpenStreetMap
- 📊 **Real Town Boundaries**: Uses official Vermont town boundary polygons from VCGI
- 🎨 **Responsive Design**: Mobile-friendly interface with clean, modern styling
- ⚡ **Static Site**: No backend required - deploy anywhere with a simple script
- 🗺️ **Accurate Geospatial Data**: Sourced from Vermont Center for Geographic Information

## File Structure

```
.
├── index.html              # Main HTML file with intro section
├── styles.css              # Responsive styling
├── script.js               # Leaflet map initialization and interactions
├── vermont-towns.geojson   # Vermont town boundaries from VCGI
├── deploy.sh               # GitHub Pages deployment script
├── .gitignore              # Git ignore patterns
├── README.md               # This file
└── LICENSE                 # License file
```

## Data Sources

### Town Boundaries
- **Source**: [VT Data - Town Boundaries](https://geodata.vermont.gov/datasets/VCGI::vt-data-town-boundaries-1/about)
- **Provider**: Vermont Center for Geographic Information (VCGI)
- **Dataset**: FS_VCGI_OPENDATA_Boundary_BNDHASH_poly_towns_SP_v1
- **Features**: 256 Vermont towns with accurate polygon boundaries
- **Format**: GeoJSON with town properties and geometric boundaries

### Population Data
- **Source**: [List of municipalities in Vermont](https://en.wikipedia.org/wiki/List_of_municipalities_in_Vermont)
- **Data**: 2020 U.S. Census population figures
- **Coverage**: 237 of 256 Vermont municipalities (19 unincorporated/very small towns have no population data)

## Data Integration

### GeoJSON Properties

Each feature in the GeoJSON contains the following properties from VCGI:

```json
{
  "OBJECTID": 251,
  "FIPS6": 21090,
  "TOWNNAME": "PROCTOR",
  "TOWNNAMEMC": "Proctor",
  "CNTY": 21,
  "TOWNGEOID": "5002157250",
  "Shape__Area": 19627122.625659943,
  "Shape__Length": 32988.08634250913,
  "population": 1763
}
```

**Field Descriptions:**
- `OBJECTID`: Unique feature identifier
- `FIPS6`: Federal Information Processing Standard 6-digit code (unique town identifier)
- `TOWNNAME`: Town name in uppercase (e.g., "PROCTOR")
- `TOWNNAMEMC`: Town name in mixed case (e.g., "Proctor") - **Used for display on the map**
- `CNTY`: County code numeric identifier
- `TOWNGEOID`: Census tract identifier
- `Shape__Area`: Polygon area in square units
- `Shape__Length`: Polygon perimeter in linear units
- `population`: Population data from Wikipedia (2020 Census)

### Adding Custom Meeting Data

You can augment the official boundaries with your Town Meeting results by adding custom properties:

```json
{
  "properties": {
    "TOWNNAME": "PROCTOR",
    "TOWNNAMEMC": "Proctor",
    "participation": 78,          // Add: Participation rate (0-100)
    "attendance": 450,            // Add: Meeting attendance
    "articlesDiscussed": 12,      // Add: Number of articles
    "meetingDate": "2026-03-03",  // Add: Meeting date
    "location": "Town Hall"       // Add: Meeting location
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[...]]
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

### Update Town Meeting Data

Edit `vermont-towns.geojson` to add participation rates and meeting information. The file uses official VCGI town boundaries which you can enhance with your data:

```bash
# Edit the GeoJSON file with your text editor
# Add properties like:
# - participation: percentage of eligible voters who attended
# - attendance: number of attendees
# - articlesCount: number of articles/items discussed
# - outcomes: brief summary of major decisions
```

### Change Color Scheme

Modify the participation rate thresholds in `script.js`:

```javascript
if (participationRate >= 75) {
    color = '#1a5f3f'; // Dark green - high participation
} else if (participationRate >= 50) {
    color = '#2a7f5f'; // Medium green
} else if (participationRate >= 25) {
    color = '#f0ad4e'; // Amber - moderate
} else {
    color = '#c9302c'; // Red - low participation
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
   - Create `.nojekyll` file for proper static site serving
   - Push to GitHub automatically

5. **Your site is live!**
   - Access it at: `https://yourusername.github.io/vt-town-meeting-2026`
   - May take 1-2 minutes for changes to appear

### Alternative Deployment Methods

**Netlify**
- Connect your GitHub repo to Netlify
- Deploy on push automatically
- No build configuration needed

**Vercel**
- Connect GitHub repo to Vercel
- Deploy automatically on push

**Generic Static Hosting**
- Simply upload all files to your hosting provider
- No build step required

## Updating Data

To update town meeting results:

1. Edit `vermont-towns.geojson` with new participation and attendance data
2. Commit and push changes:
   ```bash
   git add vermont-towns.geojson
   git commit -m "Update town meeting results - 2026 data"
   git push
   ```
3. Run deploy script (or updates automatically if using CI/CD):
   ```bash
   ./deploy.sh
   ```

## Browser Compatibility

- Chrome/Edge 60+
- Firefox 55+
- Safari 12+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Official Data Attribution

**VT Data - Town Boundaries**
- Source: Vermont Center for Geographic Information (VCGI)
- License: [Open Geodata Policy](https://files.vcgi.vermont.gov/other/policies/vermont-open-geodata-policy.html)
- Updated: Regularly by VCGI
- Dataset: FS_VCGI_OPENDATA_Boundary_BNDHASH_poly_towns_SP_v1

When using this data, please attribute the Vermont Center for Geographic Information.

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

The underlying geospatial data (vermont-towns.geojson) is subject to the Vermont Open Geodata Policy and attribution to VCGI is required.

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
- [Vermont Center for Geographic Information (VCGI)](https://vcgi.vermont.gov/)
- [Vermont Open Geodata Portal](https://geodata.vermont.gov/)

## Support

For issues, questions, or suggestions, please open a GitHub issue.

---

**Last Updated:** February 2026  
**Data Source:** Vermont Center for Geographic Information (VCGI)  
**GeoJSON Version:** Updated regularly from official VCGI sources
