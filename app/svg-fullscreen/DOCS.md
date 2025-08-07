# SVG Fullscreen Editor Documentation

## Overview
The SVG Fullscreen Editor is a comprehensive choropleth map visualization tool that allows users to upload CSV data, apply color schemes, and create interactive maps. The component combines SVG manipulation, data processing, fuzzy matching, and export capabilities.

## Main Component Structure

### `SVGFullScreenContent` (Lines 92-1206)
The main functional component that handles all map editing functionality.

## State Management

### File and Data Management
- `csvFile: File | null` - Currently uploaded CSV file
- `csvData: CSVRow[]` - Parsed CSV data as array of objects
- `validationResult: ValidationResult | null` - Validation results for CSV data
- `isDragging: boolean` - Drag-and-drop visual state
- `isProcessing: boolean` - File processing loading state
- `uploadError: string | null` - Upload error messages

### Map and Visualization
- `mapTitle: string` - User-defined title for the map
- `svgContent: string` - Raw SVG content loaded from source
- `isLoadingSvg: boolean` - SVG loading state
- `availableRegions: string[]` - SVG element IDs/classes extracted from SVG

### Data Mapping and Matching
- `keyValuePairs: Array<{key, value, id}>` - Manual key-value pairs for SVG element styling
- `matchResults: MatchResult[]` - Fuzzy matching results between CSV regions and SVG elements
- `selectedDataColumn: string` - Selected CSV column for data values
- `selectedRegionColumn: string` - Selected CSV column for region names

### Color and Styling
- `selectedColorScheme: ColorScheme` - Currently selected color palette
- `classificationMethod: ClassificationMethod` - Data classification method (equal intervals, quantiles, etc.)
- `numberOfBuckets: number` - Number of color buckets (3-10)
- `dataClassification: DataClassification | null` - Computed data classification with breaks and labels

### Advanced Features
- `showMismatches: boolean` - Toggle to show only problematic matches

## Core Functions

### Data Processing

#### `parseCSV(file: File)` (Lines 564-588)
- Uses Papa Parse to convert CSV to structured data
- Automatically infers data types and trims whitespace
- Returns both parsed data and validation results
- Transforms numeric strings to numbers

#### `validateCSVData(data, parseErrors)` (Lines 525-561)
- Validates CSV structure and content
- Checks for minimum columns, missing values
- Returns validation result with errors and warnings
- Provides row/column counts

#### `handleFileUpload(file: File)` (Lines 590-627)
- Main file upload handler with size/type validation
- Processes CSV and auto-selects first two columns
- Sets error states and updates UI accordingly

### SVG Processing

#### `extractRegionsFromSVG(svgText: string)` (Lines 164-188)
- Parses SVG content to find mappable elements
- Extracts both ID attributes and class names
- Filters out system/utility IDs (svg-, def-)
- Returns sorted array of potential region identifiers

#### `loadSvgContent()` (Lines 190-207)
- Fetches SVG from URL parameter
- Extracts available regions for matching
- Handles loading states and errors

#### `getStyledSvgContent()` (Lines 346-432)
- Applies color styling to SVG elements based on data
- Handles both CSV-based and manual key-value styling
- Uses multiple pattern matching strategies for element identification
- Injects CSS styles directly into SVG elements

### Fuzzy Matching

#### `performFuzzyMatching(csvRegions, svgRegions)` (Lines 210-256)
- Uses Fuse.js for intelligent region name matching
- First attempts exact matches (case-insensitive)
- Falls back to fuzzy matching with 40% similarity threshold
- Returns confidence scores and suggestions for each match
- Provides top 3 suggestions per region

### Data Classification

#### `classifyData(values, method, buckets)` (Lines 259-297)
- Implements multiple classification methods using D3.js:
  - **Equal Intervals**: Divides range into equal-sized buckets
  - **Quantiles**: Uses statistical quantiles for distribution-based buckets
  - **Natural Breaks**: Simplified Jenks-like natural break algorithm
  - **Manual**: Custom user-defined breaks
- Returns classification with breaks and formatted labels

#### `generateColorScale(scheme, buckets)` (Lines 300-309)
- Creates color arrays using chroma.js
- Supports sequential, diverging, and categorical schemes
- Uses perceptually uniform LCH color space for smooth gradients

#### `getColorForValue(value)` (Lines 311-333)
- Maps data values to colors based on classification
- Handles both classified and simple gradient coloring
- Returns fallback gray for invalid/missing values

### Export Functions

#### `exportAsPNG()` (Lines 435-454)
- Uses html2canvas to capture map as PNG
- High resolution (2x scale) for print quality
- Automatically downloads with map title as filename

#### `exportAsPDF()` (Lines 456-482)
- Combines html2canvas with jsPDF
- Landscape A4 format optimized for maps
- Maintains aspect ratio with proper scaling

#### `exportAsSVG()` (Lines 484-494)
- Exports styled SVG with applied colors
- Preserves vector format for scalability
- Creates downloadable blob with proper MIME type

#### `exportData()` (Lines 496-518)
- Exports enhanced CSV with matching results
- Includes match confidence scores and SVG element mappings
- Uses Papa Parse for consistent CSV formatting

## Key Helper Functions

### Key-Value Pair Management
- `addKeyValuePair()` - Adds new manual data entry row
- `removeKeyValuePair(id)` - Removes entry (minimum 1 required)
- `updateKeyValuePair(id, field, value)` - Updates specific field
- `populateFromCSV()` - Auto-populates from uploaded CSV data

### UI Event Handlers
- `handleDragOver/Leave/Drop` - Drag-and-drop file upload
- `handleFileInputChange` - Traditional file input handling
- `handleBack()` - Navigation back to previous page

## Data Structures

### Core Interfaces

#### `CSVRow` (Lines 19-21)
```typescript
interface CSVRow {
    [key: string]: string | number
}
```

#### `ValidationResult` (Lines 23-29)
```typescript
interface ValidationResult {
    isValid: boolean
    errors: string[]
    warnings: string[]
    rowCount: number
    columnCount: number
}
```

#### `MatchResult` (Lines 31-40)
```typescript
interface MatchResult {
    original: string
    matched?: string
    confidence: number
    suggestions: Array<{
        match: string
        confidence: number
        reason: 'exact' | 'alias' | 'fuzzy'
    }>
}
```

#### `ColorScheme` (Lines 42-49)
```typescript
interface ColorScheme {
    id: string
    name: string
    type: 'sequential' | 'diverging' | 'categorical' | 'custom'
    colors: string[]
    accessibilityCompliant: boolean
    interpolation?: 'linear' | 'cubic' | 'basis'
}
```

## Constants and Configuration

### `PRESET_SCHEMES` (Lines 65-83)
Predefined color palettes organized by type:
- **Sequential**: Single-hue progressions (Blues, Reds, Greens, Purples, Oranges)
- **Diverging**: Two-color schemes with neutral midpoint (Red-Blue, Red-Yellow-Green, etc.)
- **Categorical**: Distinct colors for categorical data (Set1, Set2)

### `CLASSIFICATION_METHODS` (Lines 85-90)
Available data classification options:
- Equal Intervals
- Quantiles
- Natural Breaks (Jenks)
- Manual

## UI Layout Structure

### Header (Lines 667-681)
- Back navigation button
- Centered title "SVG Map Editor"
- Consistent spacing and layout

### Main Content (Lines 684-1203)
Split-screen layout:
- **Left Half**: SVG map display with responsive container
- **Right Half**: Tabbed control panel with 4 sections

### Tab Structure (Lines 735-1201)
1. **Data Tab**: File upload, title input, manual key-value editing
2. **Mapping Tab**: Region matching results and confidence scores  
3. **Styling Tab**: Color scheme selection and data classification options
4. **Export Tab**: Export buttons for PNG, SVG, PDF, and data

## Key useEffect Hooks

### SVG Loading (Lines 520-522)
Loads SVG content when component mounts or source changes.

### Data Classification Update (Lines 336-344)
Recalculates classification when data or settings change.

### Fuzzy Matching (Lines 630-636)
Triggers matching when CSV data and available regions are ready.

## Performance Considerations

- Uses `useCallback` for expensive functions to prevent unnecessary re-renders
- Memoizes color calculations and SVG processing
- Implements lazy loading for large CSV files
- Debounced drag-and-drop handling

## Error Handling

- Comprehensive CSV validation with user-friendly messages
- File size limits (5MB) and type checking
- Graceful fallbacks for missing data or failed operations
- Loading states for all async operations

## Accessibility Features

- Color schemes marked for accessibility compliance
- Proper ARIA labels and semantic HTML
- Keyboard navigation support
- Screen reader friendly error messages

This documentation provides a comprehensive overview of the component's architecture, making it easier to understand and modify the codebase for future enhancements.