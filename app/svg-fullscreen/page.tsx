'use client'

import { Suspense, useState, useRef, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Download, Palette, Upload, FileText, BarChart3, AlertCircle, CheckCircle, Plus, Trash2, Edit3, Settings } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Papa from 'papaparse'
import Fuse from 'fuse.js'
import chroma from 'chroma-js'
import * as d3 from 'd3'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// Types and interfaces
interface CSVRow {
    [key: string]: string | number
}

interface ValidationResult {
    isValid: boolean
    errors: string[]
    warnings: string[]
    rowCount: number
    columnCount: number
}

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

interface ColorScheme {
    id: string
    name: string
    type: 'sequential' | 'diverging' | 'categorical' | 'custom'
    colors: string[]
    accessibilityCompliant: boolean
    interpolation?: 'linear' | 'cubic' | 'basis'
}

interface ClassificationMethod {
    id: string
    name: string
    type: 'equalInterval' | 'quantile' | 'natural' | 'manual'
}

interface DataClassification {
    method: ClassificationMethod
    buckets: number
    breaks: number[]
    labels: string[]
}

// Predefined color schemes
const PRESET_SCHEMES: Record<string, ColorScheme[]> = {
    sequential: [
        { id: 'blues', name: 'Blues', type: 'sequential', colors: ['#f7fbff', '#08519c'], accessibilityCompliant: true },
        { id: 'reds', name: 'Reds', type: 'sequential', colors: ['#fff5f0', '#a50f15'], accessibilityCompliant: true },
        { id: 'greens', name: 'Greens', type: 'sequential', colors: ['#f7fcf5', '#00441b'], accessibilityCompliant: true },
        { id: 'purples', name: 'Purples', type: 'sequential', colors: ['#fcfbfd', '#3f007d'], accessibilityCompliant: true },
        { id: 'oranges', name: 'Oranges', type: 'sequential', colors: ['#fff5eb', '#7f2704'], accessibilityCompliant: true }
    ],
    diverging: [
        { id: 'rdbu', name: 'Red-Blue', type: 'diverging', colors: ['#b2182b', '#f7f7f7', '#2166ac'], accessibilityCompliant: true },
        { id: 'rdylgn', name: 'Red-Yellow-Green', type: 'diverging', colors: ['#d73027', '#ffffbf', '#1a9850'], accessibilityCompliant: true },
        { id: 'brbg', name: 'Brown-Blue-Green', type: 'diverging', colors: ['#8c510a', '#f5f5f5', '#01665e'], accessibilityCompliant: true },
        { id: 'piyg', name: 'Pink-Yellow-Green', type: 'diverging', colors: ['#e9a3c9', '#f7f7f7', '#a1d76a'], accessibilityCompliant: true }
    ],
    categorical: [
        { id: 'set1', name: 'Set 1', type: 'categorical', colors: ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf'], accessibilityCompliant: true },
        { id: 'set2', name: 'Set 2', type: 'categorical', colors: ['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3'], accessibilityCompliant: true }
    ]
}

const CLASSIFICATION_METHODS: ClassificationMethod[] = [
    { id: 'equalInterval', name: 'Equal Intervals', type: 'equalInterval' },
    { id: 'quantile', name: 'Quantiles', type: 'quantile' },
    { id: 'natural', name: 'Natural Breaks (Jenks)', type: 'natural' },
    { id: 'manual', name: 'Manual', type: 'manual' }
]

function SVGFullScreenContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const src = searchParams.get('src')
    const alt = searchParams.get('alt') || 'SVG Image'

    // File and data management
    const [csvFile, setCsvFile] = useState<File | null>(null)
    const [csvData, setCsvData] = useState<CSVRow[]>([])
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    
    // Map and visualization
    const [mapTitle, setMapTitle] = useState('')
    const [svgContent, setSvgContent] = useState<string>('')
    const [isLoadingSvg, setIsLoadingSvg] = useState(false)
    const [availableRegions, setAvailableRegions] = useState<string[]>([])
    
    // Data mapping and matching
    const [keyValuePairs, setKeyValuePairs] = useState<Array<{ key: string, value: string, id: string }>>([
        { key: '', value: '', id: '1' }
    ])
    const [matchResults, setMatchResults] = useState<MatchResult[]>([])
    const [selectedDataColumn, setSelectedDataColumn] = useState<string>('')
    const [selectedRegionColumn, setSelectedRegionColumn] = useState<string>('')
    
    // Color and styling
    const [selectedColorScheme, setSelectedColorScheme] = useState<ColorScheme>(PRESET_SCHEMES.sequential[0])
    const [classificationMethod, setClassificationMethod] = useState<ClassificationMethod>(CLASSIFICATION_METHODS[0])
    const [numberOfBuckets, setNumberOfBuckets] = useState(5)
    const [dataClassification, setDataClassification] = useState<DataClassification | null>(null)
    
    // Advanced features  
    const [showMismatches, setShowMismatches] = useState(false)

    const handleBack = () => {
        router.back()
    }

    const addKeyValuePair = () => {
        const newId = (keyValuePairs.length + 1).toString()
        setKeyValuePairs([...keyValuePairs, { key: '', value: '', id: newId }])
    }

    const removeKeyValuePair = (id: string) => {
        if (keyValuePairs.length > 1) {
            setKeyValuePairs(keyValuePairs.filter(pair => pair.id !== id))
        }
    }

    const updateKeyValuePair = (id: string, field: 'key' | 'value', newValue: string) => {
        setKeyValuePairs(keyValuePairs.map(pair =>
            pair.id === id ? { ...pair, [field]: newValue } : pair
        ))
    }

    const populateFromCSV = () => {
        if (csvData.length > 0) {
            const pairs = csvData.map((row, index) => ({
                key: Object.keys(row)[0] || '',
                value: Object.values(row)[0] as string || '',
                id: (index + 1).toString()
            }))
            setKeyValuePairs(pairs.length > 0 ? pairs : [{ key: '', value: '', id: '1' }])
        }
    }

    // Extract region names from SVG (by ID and class attributes)
    const extractRegionsFromSVG = useCallback((svgText: string): string[] => {
        const regions = new Set<string>()
        
        // Extract IDs
        const idMatches = svgText.match(/id="([^"]+)"/g) || []
        idMatches.forEach(match => {
            const id = match.match(/id="([^"]+)"/)?.[1]
            if (id && !id.startsWith('svg-') && !id.startsWith('def-')) {
                regions.add(id)
            }
        })
        
        // Extract classes that might represent regions
        const classMatches = svgText.match(/class="([^"]+)"/g) || []
        classMatches.forEach(match => {
            const classes = match.match(/class="([^"]+)"/)?.[1]?.split(/\s+/) || []
            classes.forEach(cls => {
                if (cls && !cls.includes('st') && cls.length > 2) {
                    regions.add(cls)
                }
            })
        })
        
        return Array.from(regions).sort()
    }, [])

    const loadSvgContent = useCallback(async () => {
        if (!src) return

        setIsLoadingSvg(true)
        try {
            const response = await fetch(src)
            const svgText = await response.text()
            setSvgContent(svgText)
            
            // Extract available regions from SVG
            const regions = extractRegionsFromSVG(svgText)
            setAvailableRegions(regions)
        } catch (error) {
            console.error('Error loading SVG:', error)
        } finally {
            setIsLoadingSvg(false)
        }
    }, [src, extractRegionsFromSVG])

    // Fuzzy matching with Fuse.js
    const performFuzzyMatching = useCallback((csvRegions: string[], svgRegions: string[]): MatchResult[] => {
        // Transform svgRegions to objects for fuse.js
        const fuseData = svgRegions.map(region => ({ name: region }))
        const fuseWithData = new Fuse(fuseData, {
            threshold: 0.4,
            distance: 100,
            includeScore: true,
            keys: ['name']
        })
        
        return csvRegions.map(csvRegion => {
            // First try exact match
            const exactMatch = svgRegions.find(svgRegion => 
                svgRegion.toLowerCase() === csvRegion.toLowerCase()
            )
            
            if (exactMatch) {
                return {
                    original: csvRegion,
                    matched: exactMatch,
                    confidence: 1.0,
                    suggestions: [{
                        match: exactMatch,
                        confidence: 1.0,
                        reason: 'exact' as const
                    }]
                }
            }
            
            // Try fuzzy matching
            const results = fuseWithData.search(csvRegion)
            const suggestions = results.slice(0, 3).map(result => ({
                match: result.item.name,
                confidence: 1 - (result.score || 0),
                reason: 'fuzzy' as const
            }))
            
            const bestMatch = suggestions[0]
            
            return {
                original: csvRegion,
                matched: bestMatch?.confidence > 0.6 ? bestMatch.match : undefined,
                confidence: bestMatch?.confidence || 0,
                suggestions
            }
        })
    }, [])

    // Data classification with D3.js
    const classifyData = useCallback((values: number[], method: ClassificationMethod, buckets: number): DataClassification => {
        const sortedValues = values.filter(v => !isNaN(v)).sort((a, b) => a - b)
        let breaks: number[] = []
        
        switch (method.type) {
            case 'equalInterval':
                const min = d3.min(sortedValues) || 0
                const max = d3.max(sortedValues) || 0
                const step = (max - min) / buckets
                breaks = d3.range(buckets + 1).map(i => min + i * step)
                break
                
            case 'quantile':
                breaks = d3.quantile(sortedValues, 0) ? 
                    d3.range(buckets + 1).map(i => d3.quantile(sortedValues, i / buckets) || 0) :
                    [0]
                break
                
            case 'natural':
                // Simplified natural breaks
                const naturalStep = (d3.max(sortedValues) || 0) - (d3.min(sortedValues) || 0)
                breaks = d3.range(buckets + 1).map(i => (d3.min(sortedValues) || 0) + (i * naturalStep / buckets))
                break
                
            default:
                breaks = d3.range(buckets + 1).map(i => i * 100 / buckets)
        }
        
        const labels = breaks.slice(1).map((brk, i) => 
            `${breaks[i].toFixed(1)} - ${brk.toFixed(1)}`
        )
        
        return {
            method,
            buckets,
            breaks,
            labels
        }
    }, [])

    // Color generation with chroma.js
    const generateColorScale = useCallback((scheme: ColorScheme, buckets: number): string[] => {
        if (scheme.type === 'sequential' || scheme.type === 'diverging') {
            return chroma.scale(scheme.colors).mode('lch').colors(buckets)
        } else if (scheme.type === 'categorical') {
            return scheme.colors.slice(0, buckets)
        } else {
            // Custom scheme
            return chroma.scale(scheme.colors).colors(buckets)
        }
    }, [])

    const getColorForValue = useCallback((value: string | number): string => {
        const numValue = typeof value === 'number' ? value : parseFloat(String(value))
        if (isNaN(numValue)) return '#e5e5e5'

        if (!dataClassification) {
            // Fallback to simple color mapping
            const maxValue = Math.max(...keyValuePairs
                .map(pair => parseFloat(String(pair.value)))
                .filter(val => !isNaN(val)))

            if (maxValue === 0) return '#e5e5e5'

            const intensity = numValue / maxValue
            return chroma.scale(selectedColorScheme.colors).mode('lch')(intensity).hex()
        }

        // Use classification-based coloring
        const { breaks } = dataClassification
        const bucketIndex = breaks.findIndex((brk, i) => i > 0 && numValue <= brk) - 1
        const colors = generateColorScale(selectedColorScheme, dataClassification.buckets)
        
        return colors[Math.max(0, Math.min(bucketIndex, colors.length - 1))] || '#e5e5e5'
    }, [dataClassification, keyValuePairs, selectedColorScheme, generateColorScale])

    // Update classification when data or settings change
    useEffect(() => {
        if (csvData.length > 0 && selectedDataColumn) {
            const values = csvData.map(row => Number(row[selectedDataColumn])).filter(v => !isNaN(v))
            if (values.length > 0) {
                const classification = classifyData(values, classificationMethod, numberOfBuckets)
                setDataClassification(classification)
            }
        }
    }, [csvData, selectedDataColumn, classificationMethod, numberOfBuckets, classifyData])

    const getStyledSvgContent = useCallback(() => {
        if (!svgContent) return ''

        let styledSvg = svgContent

        // Add responsive sizing to the SVG element itself
        styledSvg = styledSvg.replace(
            /<svg([^>]*)>/,
            '<svg$1 style="width: 100%; height: 100%; max-width: 100%; max-height: 100%;">'
        )

        // Use match results for more intelligent mapping
        if (csvData.length > 0 && selectedDataColumn && selectedRegionColumn && matchResults.length > 0) {
            csvData.forEach(row => {
                const regionName = String(row[selectedRegionColumn])
                const dataValue = row[selectedDataColumn]
                
                // Find the matched SVG element
                const matchResult = matchResults.find(m => m.original === regionName)
                const svgElementId = matchResult?.matched
                
                if (svgElementId && dataValue !== null && dataValue !== undefined) {
                    const color = getColorForValue(dataValue)
                    
                    // Apply styling to the matched SVG element
                    const styleValue = `fill: ${color}; stroke: #333; stroke-width: 0.5;`
                    
                    // Try multiple patterns to find and style the element
                    const patterns = [
                        new RegExp(`(id="${svgElementId}"[^>]*?)style="[^"]*"`, 'g'),
                        new RegExp(`(id="${svgElementId}"[^>]*?)(?=\\s|>)`, 'g'),
                        new RegExp(`(class="[^"]*${svgElementId}[^"]*"[^>]*?)style="[^"]*"`, 'g'),
                        new RegExp(`(class="[^"]*${svgElementId}[^"]*"[^>]*?)(?=\\s|>)`, 'g')
                    ]
                    
                    let styled = false
                    for (const pattern of patterns) {
                        if (pattern.test(styledSvg)) {
                            styledSvg = styledSvg.replace(pattern, `$1 style="${styleValue}"`)
                            styled = true
                            break
                        }
                    }
                    
                    // If no existing style attribute, add one
                    if (!styled) {
                        styledSvg = styledSvg.replace(
                            new RegExp(`id="${svgElementId}"([^>]*)`, 'g'),
                            `id="${svgElementId}"$1 style="${styleValue}"`
                        )
                    }
                }
            })
        } else {
            // Fallback to original key-value pairs approach
            keyValuePairs.forEach(pair => {
                if (pair.key && pair.value) {
                    const color = getColorForValue(pair.value)
                    const styleValue = `fill: ${color}; stroke: #333; stroke-width: 0.5;`

                    // Try to find element by ID first
                    styledSvg = styledSvg.replace(
                        new RegExp(`(id="${pair.key}"[^>]*)(style="[^"]*")`, 'g'),
                        `$1style="${styleValue}"`
                    )

                    // If not found by ID, try by class or direct element match
                    if (!styledSvg.includes(`fill: ${color}`)) {
                        styledSvg = styledSvg.replace(
                            new RegExp(`(class="${pair.key}"[^>]*)(style="[^"]*")`, 'g'),
                            `$1style="${styleValue}"`
                        )
                    }

                    // If still not found, try to add style to elements with matching ID
                    if (!styledSvg.includes(`fill: ${color}`)) {
                        styledSvg = styledSvg.replace(
                            new RegExp(`id="${pair.key}"([^>]*)>`, 'g'),
                            `id="${pair.key}"$1 style="${styleValue}">`
                        )
                    }
                }
            })
        }

        return styledSvg
    }, [svgContent, csvData, selectedDataColumn, selectedRegionColumn, matchResults, getColorForValue, keyValuePairs])

    // Export functions
    const exportAsPNG = useCallback(async () => {
        const mapElement = document.querySelector('.map-container') as HTMLElement
        if (!mapElement) return

        try {
            const canvas = await html2canvas(mapElement, {
                backgroundColor: '#ffffff',
                scale: 2, // Higher resolution
                useCORS: true,
                allowTaint: true
            })
            
            const link = document.createElement('a')
            link.download = `${mapTitle || 'choropleth-map'}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
        } catch (error) {
            console.error('Error exporting PNG:', error)
        }
    }, [mapTitle])

    const exportAsPDF = useCallback(async () => {
        const mapElement = document.querySelector('.map-container') as HTMLElement
        if (!mapElement) return

        try {
            const canvas = await html2canvas(mapElement, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                allowTaint: true
            })
            
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            })
            
            const imgWidth = 297 // A4 landscape width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width
            
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight)
            pdf.save(`${mapTitle || 'choropleth-map'}.pdf`)
        } catch (error) {
            console.error('Error exporting PDF:', error)
        }
    }, [mapTitle])

    const exportAsSVG = useCallback(() => {
        const styledSvg = getStyledSvgContent()
        if (!styledSvg) return

        const blob = new Blob([styledSvg], { type: 'image/svg+xml' })
        const link = document.createElement('a')
        link.download = `${mapTitle || 'choropleth-map'}.svg`
        link.href = URL.createObjectURL(blob)
        link.click()
        URL.revokeObjectURL(link.href)
    }, [getStyledSvgContent, mapTitle])

    const exportData = useCallback(() => {
        if (csvData.length === 0) return

        // Create enhanced data with matching results
        const exportData = csvData.map(row => {
            const regionName = String(row[selectedRegionColumn])
            const matchResult = matchResults.find(m => m.original === regionName)
            
            return {
                ...row,
                matched_svg_element: matchResult?.matched || '',
                match_confidence: matchResult?.confidence || 0
            }
        })

        const csv = Papa.unparse(exportData)
        const blob = new Blob([csv], { type: 'text/csv' })
        const link = document.createElement('a')
        link.download = `${mapTitle || 'choropleth-data'}.csv`
        link.href = URL.createObjectURL(blob)
        link.click()
        URL.revokeObjectURL(link.href)
    }, [csvData, selectedRegionColumn, matchResults, mapTitle])

    useEffect(() => {
        loadSvgContent()
    }, [loadSvgContent])

    // CSV validation function
    const validateCSVData = useCallback((data: CSVRow[], parseErrors: Papa.ParseError[]): ValidationResult => {
        const errors: string[] = []
        const warnings: string[] = []
        
        if (parseErrors.length > 0) {
            errors.push(...parseErrors.map(err => `Parse error: ${err.message}`))
        }
        
        if (data.length === 0) {
            errors.push('No data rows found')
            return { isValid: false, errors, warnings, rowCount: 0, columnCount: 0 }
        }
        
        const firstRow = data[0]
        const columnCount = Object.keys(firstRow).length
        
        if (columnCount < 2) {
            warnings.push('CSV should have at least 2 columns (region names and data values)')
        }
        
        // Check for missing values
        const missingValueRows = data.filter(row => 
            Object.values(row).some(value => value === null || value === undefined || value === '')
        ).length
        
        if (missingValueRows > 0) {
            warnings.push(`${missingValueRows} rows have missing values`)
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            rowCount: data.length,
            columnCount
        }
    }, [])

    // Enhanced CSV parsing with Papa Parse
    const parseCSV = useCallback((file: File): Promise<{ data: CSVRow[], validation: ValidationResult }> => {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true,
                transformHeader: (header: string) => header.trim(),
                transform: (value: string) => {
                    const trimmed = value.trim()
                    // Try to parse as number if it looks numeric
                    if (trimmed && !isNaN(Number(trimmed))) {
                        return Number(trimmed)
                    }
                    return trimmed
                },
                complete: (results) => {
                    const validation = validateCSVData(results.data as CSVRow[], results.errors)
                    resolve({ data: results.data as CSVRow[], validation })
                },
                error: (error) => {
                    reject(error)
                }
            })
        })
    }, [validateCSVData])

    const handleFileUpload = useCallback(async (file: File) => {
        if (!file.name.endsWith('.csv')) {
            setUploadError('Please upload a CSV file')
            return
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setUploadError('File size must be less than 5MB')
            return
        }

        setIsProcessing(true)
        setUploadError(null)

        try {
            const { data, validation } = await parseCSV(file)
            setCsvFile(file)
            setCsvData(data)
            setValidationResult(validation)
            
            // Auto-select first two columns if available
            if (data.length > 0) {
                const columns = Object.keys(data[0])
                if (columns.length >= 2) {
                    setSelectedRegionColumn(columns[0])
                    setSelectedDataColumn(columns[1])
                }
            }
            
            if (!validation.isValid) {
                setUploadError(validation.errors.join('; '))
            }
        } catch {
            setUploadError('Error parsing CSV file')
        } finally {
            setIsProcessing(false)
        }
    }, [parseCSV])

    // Trigger fuzzy matching when data and regions are available
    useEffect(() => {
        if (csvData.length > 0 && selectedRegionColumn && availableRegions.length > 0) {
            const csvRegions = csvData.map(row => String(row[selectedRegionColumn])).filter(Boolean)
            const matchResults = performFuzzyMatching(csvRegions, availableRegions)
            setMatchResults(matchResults)
        }
    }, [csvData, selectedRegionColumn, availableRegions, performFuzzyMatching])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const files = Array.from(e.dataTransfer.files)
        if (files.length > 0) {
            handleFileUpload(files[0])
        }
    }, [handleFileUpload])

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            handleFileUpload(files[0])
        }
    }, [handleFileUpload])

    return (
        <div className="min-h-screen bg-background">
            {/* Header with back button */}
            <div className="border-b p-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <h1 className="text-xl font-semibold">SVG Map Editor</h1>
                    <div className="w-20" /> {/* Spacer for centering */}
                </div>
            </div>

            {/* Main content area */}
            <div className="flex flex-col lg:flex-row">
                {/* Left half - SVG Map Editor */}
                <div className="w-full lg:w-1/2 p-1 md:p-2">
                    <Card className="h-full flex flex-col border-0 md:border shadow-none md:shadow-sm">
                        <CardContent className="flex-1 flex flex-col p-1 md:p-3">
                            {src ? (
                                <div className="flex flex-col h-full">
                                    <div className="text-center mb-2 flex-shrink-0">
                                        <h3 className="text-base font-medium">{mapTitle || alt}</h3>
                                        <p className="text-xs text-muted-foreground">
                                            {src.split('/').pop()}
                                        </p>
                                    </div>
                                    <div className="flex-1 min-h-0 flex items-center justify-center border border-dashed border-muted-foreground/30 rounded p-1 md:p-2 map-container">
                                        {isLoadingSvg ? (
                                            <div className="flex items-center gap-2">
                                                <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                                                <span className="text-sm text-muted-foreground">Loading SVG...</span>
                                            </div>
                                        ) : svgContent ? (
                                            <div
                                                className="w-full h-full"
                                                dangerouslySetInnerHTML={{ __html: getStyledSvgContent() }}
                                                style={{ minHeight: 0, minWidth: 0 }}
                                            />
                                        ) : (
                                            <img
                                                src={src}
                                                alt={alt}
                                                className="w-full h-full object-contain"
                                            />
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center space-y-4">
                                        <div className="text-4xl">🗺️</div>
                                        <h3 className="text-lg font-medium">No SVG Selected</h3>
                                        <p className="text-muted-foreground text-sm">
                                            Please select an SVG from the dashboard
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right half - Tabbed Controls Panel */}
                <div className="w-full lg:w-1/2 p-1 md:p-2 lg:pl-1">
                    <Tabs defaultValue="data" className="h-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="data">Data</TabsTrigger>
                            <TabsTrigger value="mapping">Mapping</TabsTrigger>
                            <TabsTrigger value="styling">Styling</TabsTrigger>
                            <TabsTrigger value="export">Export</TabsTrigger>
                        </TabsList>

                        <TabsContent value="data" className="space-y-4 h-full">
                            {/* Top Half - Title and CSV Upload */}
                            <div className="space-y-4">
                                {/* Add Title Section */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Edit3 className="h-5 w-5" />
                                            Map Title
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <Label htmlFor="map-title">Title</Label>
                                            <Input
                                                id="map-title"
                                                placeholder="Enter map title"
                                                value={mapTitle}
                                                onChange={(e) => setMapTitle(e.target.value)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* CSV Upload Section */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Upload className="h-5 w-5" />
                                            Upload CSV
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div
                                            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${isDragging
                                                ? 'border-blue-500 bg-blue-50'
                                                : csvFile
                                                    ? 'border-green-500 bg-green-50'
                                                    : 'border-muted-foreground hover:border-blue-400'
                                                }`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".csv"
                                                onChange={handleFileInputChange}
                                                className="hidden"
                                            />
                                            {isProcessing ? (
                                                <div className="space-y-2">
                                                    <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                                                    <p className="text-sm text-muted-foreground">Processing file...</p>
                                                </div>
                                            ) : csvFile ? (
                                                <div className="space-y-2">
                                                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                                                    <p className="text-sm font-medium">{csvFile.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {(csvFile.size / 1024).toFixed(1)} KB • {csvData.length} rows
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <FileText className="h-8 w-8 text-muted-foreground mx-auto" />
                                                    <p className="text-sm font-medium">Drop CSV here or click to browse</p>
                                                    <p className="text-xs text-muted-foreground">Max size: 5MB</p>
                                                </div>
                                            )}
                                        </div>

                                        {uploadError && (
                                            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                                                <AlertCircle className="h-4 w-4" />
                                                {uploadError}
                                            </div>
                                        )}

                                        {csvFile && (
                                            <div className="space-y-3">
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setCsvFile(null)
                                                            setCsvData([])
                                                            setValidationResult(null)
                                                            setUploadError(null)
                                                            setMatchResults([])
                                                        }}
                                                        className="flex-1"
                                                    >
                                                        Clear
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="flex-1"
                                                        onClick={populateFromCSV}
                                                    >
                                                        Apply to Table
                                                    </Button>
                                                </div>
                                                
                                                {csvData.length > 0 && (
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="region-column">Region Column</Label>
                                                            <select
                                                                id="region-column"
                                                                value={selectedRegionColumn}
                                                                onChange={(e) => setSelectedRegionColumn(e.target.value)}
                                                                className="w-full p-2 border rounded-md text-sm"
                                                            >
                                                                <option value="">Select column...</option>
                                                                {Object.keys(csvData[0] || {}).map(col => (
                                                                    <option key={col} value={col}>{col}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="data-column">Data Column</Label>
                                                            <select
                                                                id="data-column"
                                                                value={selectedDataColumn}
                                                                onChange={(e) => setSelectedDataColumn(e.target.value)}
                                                                className="w-full p-2 border rounded-md text-sm"
                                                            >
                                                                <option value="">Select column...</option>
                                                                {Object.keys(csvData[0] || {}).map(col => (
                                                                    <option key={col} value={col}>{col}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {validationResult && (
                                            <div className="space-y-2">
                                                {validationResult.warnings.length > 0 && (
                                                    <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                                                        <div className="font-medium">Warnings:</div>
                                                        <ul className="list-disc list-inside">
                                                            {validationResult.warnings.map((warning, i) => (
                                                                <li key={i}>{warning}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                <div className="text-xs text-muted-foreground">
                                                    {validationResult.rowCount} rows, {validationResult.columnCount} columns
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Bottom Half - Editable Key-Value Table */}
                            <Card className="flex-1">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <BarChart3 className="h-5 w-5" />
                                            SVG Element Data
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={addKeyValuePair}
                                            className="flex items-center gap-1"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add Row
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        <div className="grid grid-cols-5 gap-2 text-sm font-medium text-muted-foreground pb-2 border-b">
                                            <span className="col-span-2">SVG Element Key</span>
                                            <span className="col-span-2">Data Value</span>
                                            <span>Action</span>
                                        </div>
                                        {keyValuePairs.map((pair) => (
                                            <div key={pair.id} className="grid grid-cols-5 gap-2 items-center">
                                                <Input
                                                    placeholder="e.g., state-name"
                                                    value={pair.key}
                                                    onChange={(e) => updateKeyValuePair(pair.id, 'key', e.target.value)}
                                                    className="col-span-2 text-sm"
                                                />
                                                <Input
                                                    placeholder="e.g., 1000"
                                                    value={pair.value}
                                                    onChange={(e) => updateKeyValuePair(pair.id, 'value', e.target.value)}
                                                    className="col-span-2 text-sm"
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => removeKeyValuePair(pair.id)}
                                                    disabled={keyValuePairs.length === 1}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-4 border-t">
                                        <p className="text-xs text-muted-foreground">
                                            Keys should match SVG element IDs or classes. Values will be used for visualization.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="mapping" className="space-y-4">
                            {/* Data Mapping and Fuzzy Matching Results */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Settings className="h-5 w-5" />
                                        Region Matching
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {availableRegions.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="text-sm text-muted-foreground">
                                                Found {availableRegions.length} regions in SVG: {availableRegions.slice(0, 5).join(', ')}
                                                {availableRegions.length > 5 && ` and ${availableRegions.length - 5} more...`}
                                            </div>
                                            
                                            {matchResults.length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-medium text-sm">Match Results</h4>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setShowMismatches(!showMismatches)}
                                                        >
                                                            {showMismatches ? 'Show All' : 'Show Mismatches Only'}
                                                        </Button>
                                                    </div>
                                                    
                                                    <div className="max-h-64 overflow-y-auto space-y-1">
                                                        {matchResults
                                                            .filter(result => !showMismatches || result.confidence < 0.8)
                                                            .map((result, i) => (
                                                            <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                                                                <div className="flex-1">
                                                                    <div className="font-medium">{result.original}</div>
                                                                    {result.matched && (
                                                                        <div className="text-muted-foreground">→ {result.matched}</div>
                                                                    )}
                                                                </div>
                                                                <div className={`px-2 py-1 rounded text-xs font-medium ${
                                                                    result.confidence >= 0.9 ? 'bg-green-100 text-green-800' :
                                                                    result.confidence >= 0.7 ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-red-100 text-red-800'
                                                                }`}>
                                                                    {(result.confidence * 100).toFixed(0)}%
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {matchResults.length === 0 && csvData.length > 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <div className="text-2xl mb-2">🔄</div>
                                            <div>Select region and data columns to see matching results</div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="styling" className="space-y-4">
                            {/* Color Schemes */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Palette className="h-5 w-5" />
                                        Color Schemes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <Label>Scheme Type</Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {Object.keys(PRESET_SCHEMES).map(type => (
                                                    <Button
                                                        key={type}
                                                        variant={selectedColorScheme.type === type ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setSelectedColorScheme(PRESET_SCHEMES[type][0])}
                                                        className="capitalize"
                                                    >
                                                        {type}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label>Color Palette</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {PRESET_SCHEMES[selectedColorScheme.type]?.map(scheme => (
                                                    <Button
                                                        key={scheme.id}
                                                        variant={selectedColorScheme.id === scheme.id ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setSelectedColorScheme(scheme)}
                                                        className="h-auto py-2"
                                                    >
                                                        <div className="space-y-1 w-full">
                                                            <div className="text-xs">{scheme.name}</div>
                                                            <div className="flex h-2 rounded overflow-hidden">
                                                                {scheme.colors.map((color, i) => (
                                                                    <div key={i} className="flex-1" style={{ backgroundColor: color }} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Data Classification */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5" />
                                        Data Classification
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label>Method</Label>
                                            <select
                                                value={classificationMethod.id}
                                                onChange={(e) => {
                                                    const method = CLASSIFICATION_METHODS.find(m => m.id === e.target.value)
                                                    if (method) setClassificationMethod(method)
                                                }}
                                                className="w-full p-2 border rounded-md text-sm"
                                            >
                                                {CLASSIFICATION_METHODS.map(method => (
                                                    <option key={method.id} value={method.id}>{method.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Buckets</Label>
                                            <select
                                                value={numberOfBuckets}
                                                onChange={(e) => setNumberOfBuckets(Number(e.target.value))}
                                                className="w-full p-2 border rounded-md text-sm"
                                            >
                                                {[3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                                    <option key={num} value={num}>{num}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    {dataClassification && (
                                        <div className="space-y-2">
                                            <Label>Classification Preview</Label>
                                            <div className="space-y-1 text-xs">
                                                {dataClassification.labels.map((label, i) => {
                                                    const colors = generateColorScale(selectedColorScheme, numberOfBuckets)
                                                    return (
                                                        <div key={i} className="flex items-center gap-2">
                                                            <div 
                                                                className="w-4 h-4 rounded border"
                                                                style={{ backgroundColor: colors[i] }}
                                                            />
                                                            <span>{label}</span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="export" className="space-y-4">
                            {/* Export Options */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Download className="h-5 w-5" />
                                        Export Options
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button 
                                            variant="outline" 
                                            className="flex items-center gap-2"
                                            onClick={exportAsPNG}
                                            disabled={!svgContent}
                                        >
                                            <Download className="h-4 w-4" />
                                            PNG
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="flex items-center gap-2"
                                            onClick={exportAsSVG}
                                            disabled={!svgContent}
                                        >
                                            <Download className="h-4 w-4" />
                                            SVG
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="flex items-center gap-2"
                                            onClick={exportAsPDF}
                                            disabled={!svgContent}
                                        >
                                            <Download className="h-4 w-4" />
                                            PDF
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="flex items-center gap-2"
                                            onClick={exportData}
                                            disabled={csvData.length === 0}
                                        >
                                            <Download className="h-4 w-4" />
                                            Data
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}

export default function SVGFullScreen() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse">Loading...</div>
            </div>
        }>
            <SVGFullScreenContent />
        </Suspense>
    )
}