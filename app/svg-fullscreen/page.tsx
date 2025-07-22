'use client'

import { Suspense, useState, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Settings, Download, Eye, Palette, Upload, FileText, BarChart3, AlertCircle, CheckCircle } from "lucide-react"

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
    
    const handleBack = () => {
        router.back()
    }
    
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
            <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)]">
                {/* Left half - SVG Map Editor */}
                <div className="flex-1 lg:w-1/2 p-4">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="h-5 w-5" />
                                Map Editor
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center h-full">
                            <div className="text-center space-y-4 w-full">
                                <div className="border-2 border-dashed border-muted-foreground rounded-lg p-8 min-h-[400px] flex items-center justify-center">
                                    <div className="space-y-2">
                                        <div className="text-4xl">🗺️</div>
                                        <h3 className="text-lg font-medium">SVG Map Preview</h3>
                                        <p className="text-muted-foreground text-sm">
                                            {alt}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Source: {src || 'Not specified'}
                                        </p>
                                        <div className="mt-4 p-4 bg-muted rounded-md">
                                            <p className="text-sm text-muted-foreground">
                                                Interactive SVG editor will be loaded here
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right half - Controls Panel */}
                <div className="flex-1 lg:w-1/2 p-4 lg:pl-2 space-y-4">
                    {/* CSV Upload Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="h-5 w-5" />
                                Data Upload
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div
                                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                                    isDragging 
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
                                        <p className="text-sm font-medium">Drop CSV file here or click to browse</p>
                                        <p className="text-xs text-muted-foreground">Maximum file size: 5MB</p>
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
                                        Clear File
                                    </Button>
                                    <Button size="sm" className="flex-1">
                                        Apply to Map
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Data Preview Section */}
                    {csvData.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Data Preview
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Statistics */}
                                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">{csvData.length}</div>
                                        <div className="text-xs text-muted-foreground">Total Rows</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {csvData.length > 0 ? Object.keys(csvData[0]).length : 0}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Columns</div>
                                    </div>
                                </div>
                                
                                {/* Two-column Key-Value Display */}
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    <h4 className="text-sm font-medium">Sample Data (First 10 rows)</h4>
                                    {csvData.slice(0, 10).map((row, index) => (
                                        <div key={index} className="border rounded-lg p-3 space-y-2">
                                            <div className="text-xs font-medium text-muted-foreground">Row {index + 1}</div>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                {Object.entries(row).map(([key, value]) => (
                                                    <div key={key} className="flex justify-between text-sm">
                                                        <span className="font-medium text-muted-foreground truncate">{key}:</span>
                                                        <span className="text-right truncate max-w-24" title={String(value)}>
                                                            {String(value) || '-'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Map Controls */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Map Controls
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Quick Settings */}
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="map-title">Map Title</Label>
                                    <Input id="map-title" placeholder="Enter map title" />
                                </div>
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
                            </div>

                            <Separator />

                            {/* Action Buttons */}
                            <div className="space-y-2">
                                <Button variant="default" className="w-full flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    Preview Changes
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

                            {/* Map Info */}
                            <div className="pt-4 border-t">
                                <h4 className="text-sm font-medium mb-2">Map Information</h4>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
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
                            </div>
                        </CardContent>
                    </Card>
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