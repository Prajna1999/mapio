'use client'

import { Suspense, useState, useRef, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Eye, Palette, Upload, FileText, BarChart3, AlertCircle, CheckCircle, Plus, Trash2, Edit3 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function SVGFullScreenContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const src = searchParams.get('src')
    const alt = searchParams.get('alt') || 'SVG Image'

    const [csvFile, setCsvFile] = useState<File | null>(null)
    const [csvData, setCsvData] = useState<any[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [mapTitle, setMapTitle] = useState('')
    const [keyValuePairs, setKeyValuePairs] = useState<Array<{ key: string, value: string, id: string }>>([
        { key: '', value: '', id: '1' }
    ])
    const [svgContent, setSvgContent] = useState<string>('')
    const [isLoadingSvg, setIsLoadingSvg] = useState(false)

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

    const loadSvgContent = useCallback(async () => {
        if (!src) return

        setIsLoadingSvg(true)
        try {
            const response = await fetch(src)
            const svgText = await response.text()
            setSvgContent(svgText)
        } catch (error) {
            console.error('Error loading SVG:', error)
        } finally {
            setIsLoadingSvg(false)
        }
    }, [src])

    const getColorForValue = (value: string): string => {
        const numValue = parseFloat(value)
        if (isNaN(numValue)) return '#e5e5e5'

        // Simple color mapping based on value
        const maxValue = Math.max(...keyValuePairs
            .map(pair => parseFloat(pair.value))
            .filter(val => !isNaN(val)))

        if (maxValue === 0) return '#e5e5e5'

        const intensity = numValue / maxValue
        const hue = 120 - (intensity * 120) // Green to red
        return `hsl(${hue}, 70%, 50%)`
    }

    const getStyledSvgContent = useCallback(() => {
        if (!svgContent) return ''

        let styledSvg = svgContent

        // Add responsive sizing to the SVG element itself
        styledSvg = styledSvg.replace(
            /<svg([^>]*)>/,
            '<svg$1 style="width: 100%; height: 100%; max-width: 100%; max-height: 100%;">'
        )

        keyValuePairs.forEach(pair => {
            if (pair.key && pair.value) {
                const color = getColorForValue(pair.value)

                // Try to find element by ID first
                styledSvg = styledSvg.replace(
                    new RegExp(`(id="${pair.key}"[^>]*)(style="[^"]*")`, 'g'),
                    `$1style="fill: ${color}; stroke: #333; stroke-width: 0.5;"`
                )

                // If not found by ID, try by class or direct element match
                if (!styledSvg.includes(`fill: ${color}`)) {
                    styledSvg = styledSvg.replace(
                        new RegExp(`(class="${pair.key}"[^>]*)(style="[^"]*")`, 'g'),
                        `$1style="fill: ${color}; stroke: #333; stroke-width: 0.5;"`
                    )
                }

                // If still not found, try to add style to elements with matching ID
                if (!styledSvg.includes(`fill: ${color}`)) {
                    styledSvg = styledSvg.replace(
                        new RegExp(`id="${pair.key}"([^>]*)>`, 'g'),
                        `id="${pair.key}"$1 style="fill: ${color}; stroke: #333; stroke-width: 0.5;">`
                    )
                }
            }
        })

        return styledSvg
    }, [svgContent, keyValuePairs])

    useEffect(() => {
        loadSvgContent()
    }, [loadSvgContent])

    const parseCSV = useCallback((text: string) => {
        const lines = text.split('\n').filter(line => line.trim())
        if (lines.length === 0) return []

        const headers = lines[0].split(',').map(header => header.trim())
        const data = lines.slice(1).map(line => {
            const values = line.split(',').map(val => val.trim())
            const row: any = {}
            headers.forEach((header, index) => {
                row[header] = values[index] || ''
            })
            return row
        })

        return data
    }, [])

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
            const text = await file.text()
            const parsed = parseCSV(text)
            setCsvFile(file)
            setCsvData(parsed)
        } catch (error) {
            setUploadError('Error parsing CSV file')
        } finally {
            setIsProcessing(false)
        }
    }, [parseCSV])

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
                                    <div className="flex-1 min-h-0 flex items-center justify-center border border-dashed border-muted-foreground/30 rounded p-1 md:p-2">
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
                    <Tabs defaultValue="upload" className="h-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="upload">Upload Data</TabsTrigger>
                            <TabsTrigger value="styling">Styling</TabsTrigger>
                        </TabsList>

                        <TabsContent value="upload" className="space-y-4 h-full">
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
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setCsvFile(null)
                                                        setCsvData([])
                                                        setUploadError(null)
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

                        <TabsContent value="styling" className="space-y-4">
                            {/* Styling Tab Content */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Palette className="h-5 w-5" />
                                        Map Styling
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="background-color">Background</Label>
                                            <Input id="background-color" type="color" defaultValue="#ffffff" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="border-color">Border</Label>
                                            <Input id="border-color" type="color" defaultValue="#000000" />
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <Button variant="default" className="w-full flex items-center gap-2">
                                            <Eye className="h-4 w-4" />
                                            Apply Changes
                                        </Button>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button variant="outline" className="flex items-center gap-2">
                                                <Download className="h-4 w-4" />
                                                Export
                                            </Button>
                                            <Button variant="outline">
                                                Reset
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Map Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Map Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Type:</span>
                                            <span>{alt}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">File:</span>
                                            <span className="truncate max-w-20" title={src?.split('/').pop()}>
                                                {src?.split('/').pop() || 'Unknown'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Format:</span>
                                            <span>SVG</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Status:</span>
                                            <span className="text-green-600">Ready</span>
                                        </div>
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