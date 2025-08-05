# Choropleth Map Visualization Tool

## Project Overview
A comprehensive web-based tool for creating interactive choropleth maps with CSV data, featuring a full-featured editor, preset color schemes, fuzzy matching, and export capabilities.

## Tech Stack
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Map Handling**: D3.js for SVG manipulation and data binding
- **File Processing**: Papa Parse for CSV handling
- **Fuzzy Matching**: Fuse.js for intelligent region name matching
- **Color Schemes**: Chroma.js for color interpolation and schemes
- **Editor Canvas**: Fabric.js for drawing tools and annotations
- **Export**: html2canvas + jsPDF for image/PDF export
- **State Management**: Zustand for application state
- **Build Tool**: Vite

## Core Features

### 1. Data Processing & Import
- CSV file upload and parsing
- Drag-and-drop interface
- Data validation and preview
- Fuzzy matching for region names with confidence scores
- Mismatch highlighting and suggested corrections
- Support for multiple data columns

### 2. Map Visualization
- Preset SVG maps (India states, US states, world countries, etc.)
- Dynamic choropleth coloring based on data values
- Multiple classification methods (equal intervals, quantiles, natural breaks)
- Configurable number of data buckets (3-10 ranges)
- Interactive hover tooltips with data values
- Zoom and pan functionality

### 3. Color Schemes
- **Sequential**: Single-hue progressions (Blues, Reds, Greens, etc.)
- **Diverging**: Two-color schemes meeting at midpoint (RdBu, RdYlGn, etc.)
- **Categorical**: Distinct colors for categorical data
- **Custom**: User-defined color palettes with hex/RGB input
- Real-time color preview and adjustment
- Accessibility-friendly color options (colorblind-safe)

### 4. Advanced Editor
- **Text Elements**: Titles, subtitles, data labels, annotations
- **Anchored Annotations**: Text boxes tied to specific map regions
- **Drawing Tools**: Arrows, lines, circles, rectangles, freehand drawing
- **Legend Customization**: Position, style, labels, color swatches
- **Layer Management**: Show/hide, reorder, lock elements
- **Styling Options**: Fonts, sizes, colors, borders, shadows

### 5. Export & Sharing
- **Static Exports**: PNG, JPEG, SVG, PDF
- **Interactive Options**: Toggle annotations, tooltips on/off
- **High Resolution**: Configurable DPI for print quality
- **Embed Code**: Generate iframe embed codes
- **Data Export**: Download processed data as CSV/JSON

## File Structure

    Read the existing file structure of this repo.

## Key Dependencies

    Read current dependencies in the package.json and other config files.

## Core Implementation Guidelines

### 1. Data Processing Flow
```typescript
// Data import → Validation → Fuzzy matching → Classification → Visualization
interface DataProcessingPipeline {
  importCSV: (file: File) => Promise<RawData[]>
  validateData: (data: RawData[]) => ValidationResult
  fuzzyMatchRegions: (data: RawData[], mapRegions: string[]) => MatchResult[]
  classifyValues: (values: number[], method: ClassificationMethod, buckets: number) => Classification
  generateColorMapping: (classification: Classification, scheme: ColorScheme) => ColorMapping
}
```

### 2. Fuzzy Matching Implementation
```typescript
// Use Fuse.js with weighted scoring
const fuzzyMatcher = new Fuse(mapRegions, {
  threshold: 0.4, // 60% similarity required
  distance: 100,
  keys: ['name', 'code', 'aliases'] // Support multiple match fields
})

// Suggest top 3 matches with confidence scores
interface MatchSuggestion {
  original: string
  suggestions: Array<{
    match: string
    confidence: number
    reason: 'exact' | 'alias' | 'fuzzy'
  }>
}
```

### 3. Color Scheme System
```typescript
// Support all major scheme types
interface ColorScheme {
  id: string
  name: string
  type: 'sequential' | 'diverging' | 'categorical' | 'custom'
  colors: string[]
  accessibilityCompliant: boolean
  interpolation?: 'linear' | 'cubic' | 'basis'
}

// Predefined schemes
const PRESET_SCHEMES = {
  sequential: ['Blues', 'Reds', 'Greens', 'Purples', 'Oranges'],
  diverging: ['RdBu', 'RdYlGn', 'BrBG', 'PiYG', 'PRGn'],
  categorical: ['Set1', 'Set2', 'Set3', 'Pastel1', 'Pastel2']
}
```

### 4. Editor Architecture
```typescript
// Layered editing system
interface EditorLayer {
  id: string
  type: 'text' | 'shape' | 'annotation' | 'legend'
  visible: boolean
  locked: boolean
  zIndex: number
  exportable: boolean // Can be toggled for export
  data: LayerData
}

// Support for anchored elements
interface AnchoredElement extends EditorLayer {
  anchorType: 'region' | 'coordinate' | 'relative'
  anchorTarget: string | [number, number] | { x: string, y: string }
  offset: [number, number]
}
```

### 5. Export System
```typescript
interface ExportOptions {
  format: 'png' | 'jpeg' | 'svg' | 'pdf'
  resolution: number // DPI
  dimensions: { width: number, height: number }
  includeInteractive: boolean
  includeLayers: string[] // Layer IDs to include
  backgroundColor: string
  transparent: boolean
}
```

## UI/UX Design Principles

### 1. Layout Structure
- **Left Sidebar**: Data import, color schemes, layer management
- **Main Canvas**: Map visualization and editing area
- **Right Panel**: Editor tools, properties, export options
- **Top Toolbar**: Primary actions, view controls, help

### 2. Color Palette
```css
:root {
  /* Primary brand colors */
  --primary: 220 90% 56%;
  --primary-foreground: 220 100% 98%;
  
  /* Neutral grays */
  --background: 0 0% 100%;
  --foreground: 220 13% 9%;
  --muted: 220 13% 95%;
  --muted-foreground: 220 9% 46%;
  
  /* Accent colors */
  --accent: 142 86% 28%;
  --accent-foreground: 142 100% 98%;
  
  /* Status colors */
  --success: 142 86% 28%;
  --warning: 38 92% 50%;
  --error: 0 84% 60%;
}
```

### 3. Component Design
- Modern, clean interface with subtle shadows and rounded corners
- Consistent spacing using 4px grid system
- Smooth transitions and micro-interactions
- Accessible focus states and keyboard navigation
- Responsive design for tablet/mobile viewing

### 4. Data Visualization Best Practices
- Clear legends with appropriate color ramps
- Meaningful default classifications
- Accessible color choices (colorblind-friendly options)
- Informative tooltips with formatted numbers
- Progressive disclosure for advanced options

## Advanced Features

### 1. Performance Optimizations
- **Virtualization**: For large datasets and complex SVGs
- **Memoization**: React.memo for expensive map renders
- **Web Workers**: For heavy data processing tasks
- **Canvas Fallback**: For very large maps with many regions

### 2. Accessibility Features
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast Mode**: Alternative color schemes
- **Color Blind Support**: Colorblind-safe palette options

### 3. Data Analysis Tools
- **Statistics Panel**: Min, max, mean, median, std dev
- **Outlier Detection**: Highlight unusual values
- **Correlation Analysis**: Compare multiple data columns
- **Time Series Support**: Animated choropleth for temporal data

### 4. Collaboration Features
- **Project Sharing**: Generate shareable URLs
- **Embed Codes**: Iframe integration for websites
- **Template Gallery**: Save and share map templates
- **Version History**: Track changes and revert

## Testing Strategy

### 1. Unit Tests
- Data processing utilities
- Color scheme calculations
- Fuzzy matching algorithms
- Export functionality

### 2. Integration Tests
- CSV import workflow
- Map rendering pipeline
- Editor tool interactions
- Export generation

### 3. E2E Tests
- Complete user workflows
- Cross-browser compatibility
- Performance benchmarks
- Accessibility compliance

## Deployment Configuration

### 1. Environment Setup
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          d3: ['d3'],
          fabric: ['fabric'],
          utils: ['papaparse', 'fuse.js', 'chroma-js']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'd3', 'fabric']
  }
})
```

### 2. Progressive Web App
- Service worker for offline capability
- Installable PWA with manifest
- Background sync for exports
- Cached map assets

## Security Considerations

### 1. Data Privacy
- Client-side only processing (no server uploads)
- Clear data retention policies
- No tracking or analytics without consent

### 2. File Safety
- CSV validation and sanitization
- SVG security (prevent XSS in custom maps)
- File size limits and type validation

## Documentation Requirements

### 1. User Guide
- Getting started tutorial
- Feature explanations with screenshots
- Video tutorials for complex workflows
- FAQ and troubleshooting

### 2. Developer Docs
- API documentation
- Custom map format specifications
- Plugin development guide
- Contributing guidelines

This specification provides a comprehensive foundation for building a professional-grade choropleth mapping tool that balances functionality with usability.