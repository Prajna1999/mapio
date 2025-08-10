import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

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

interface KeyValuePair {
    key: string
    value: string
    id: string
}


// Predefined color schemes
const PRESET_SCHEMES: Record<string, ColorScheme[]> = {
    sequential: [
        { id: 'buenos-aries', name: 'Buenos-Aries', type: 'sequential', colors: ['#f7fbff', '#08519c'], accessibilityCompliant: true },
        { id: 'bucharest', name: 'Bucharest', type: 'sequential', colors: ['#fff5f0', '#a50f15'], accessibilityCompliant: true },
        { id: 'bellagio', name: 'Bellagio', type: 'sequential', colors: ['#f7fcf5', '#00441b'], accessibilityCompliant: true },
        { id: 'helsinki', name: 'Helsinki', type: 'sequential', colors: ['#fcfbfd', '#3f007d'], accessibilityCompliant: true },
        { id: 'dhaka', name: 'Dhaka', type: 'sequential', colors: ['#f7fbff', '#0c4d9c'], accessibilityCompliant: true },
        { id: 'paris', name: 'Paris', type: 'sequential', colors: ['#fff5eb', '#8b2500'], accessibilityCompliant: true },

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


interface MapStoreState {
    // File and data management
    csvFile: File | null
    csvData: CSVRow[]
    validationResult: ValidationResult | null
    isDragging: boolean
    isProcessing: boolean
    uploadError: string | null

    // Map and visualization
    mapTitle: string
    svgContent: string
    isLoadingSvg: boolean
    availableRegions: string[]

    // Data mapping and matching
    keyValuePairs: KeyValuePair[]
    matchResults: MatchResult[]
    selectedDataColumn: string
    selectedRegionColumn: string

    // Color and styling
    selectedColorScheme: ColorScheme
    classificationMethod: ClassificationMethod
    numberOfBuckets: number
    dataClassification: DataClassification | null

    // Advanced features
    showMismatches: boolean

    // Hydration state
    _hasHydrated: boolean
    setHasHydrated: (hasHydrated: boolean) => void

    // Actions (same as before)
    setCsvFile: (file: File | null) => void
    setCsvData: (data: CSVRow[]) => void
    setValidationResult: (result: ValidationResult | null) => void
    setIsDragging: (dragging: boolean) => void
    setIsProcessing: (processing: boolean) => void
    setUploadError: (error: string | null) => void
    setMapTitle: (title: string) => void
    setSvgContent: (content: string) => void
    setIsLoadingSvg: (loading: boolean) => void
    setAvailableRegions: (regions: string[]) => void
    setKeyValuePairs: (pairs: KeyValuePair[]) => void
    setMatchResults: (results: MatchResult[]) => void
    setSelectedDataColumn: (column: string) => void
    setSelectedRegionColumn: (column: string) => void
    setSelectedColorScheme: (scheme: ColorScheme) => void
    setClassificationMethod: (method: ClassificationMethod) => void
    setNumberOfBuckets: (buckets: number) => void
    setDataClassification: (classification: DataClassification | null) => void
    setShowMismatches: (show: boolean) => void

    // Helper actions
    addKeyValuePair: () => void
    removeKeyValuePair: (id: string) => void
    updateKeyValuePair: (id: string, field: 'key' | 'value', value: string) => void
    clearAllData: () => void
}

export const useMapStore = create<MapStoreState>()(
    persist(
        (set, get) => ({
            // initial state
            csvFile: null,
            csvData: [],
            validationResult: null,
            isDragging: false,
            isProcessing: false,
            uploadError: null,
            mapTitle: '',
            svgContent: '',
            isLoadingSvg: false,
            availableRegions: [],
            keyValuePairs: [{ key: '', value: '', id: '1' }],
            matchResults: [],
            selectedDataColumn: '',
            selectedRegionColumn: '',
            selectedColorScheme: PRESET_SCHEMES.sequential[0],
            classificationMethod: CLASSIFICATION_METHODS[0],
            numberOfBuckets: 5,
            dataClassification: null,
            showMismatches: false,

            // hydration state for nextjs
            _hasHydrated: false,
            setHasHydrated: (hasHydrated: boolean) => (
                { _hasHydrated: hasHydrated }
            ),
            // Actions
            setCsvFile: (file) => set({ csvFile: file }),
            setCsvData: (data) => set({ csvData: data }),
            setValidationResult: (result) => set({ validationResult: result }),
            setIsDragging: (dragging) => set({ isDragging: dragging }),
            setIsProcessing: (processing) => set({ isProcessing: processing }),
            setUploadError: (error) => set({ uploadError: error }),
            setMapTitle: (title) => set({ mapTitle: title }),
            setSvgContent: (content) => set({ svgContent: content }),
            setIsLoadingSvg: (loading) => set({ isLoadingSvg: loading }),
            setAvailableRegions: (regions) => set({ availableRegions: regions }),
            setKeyValuePairs: (pairs) => set({ keyValuePairs: pairs }),
            setMatchResults: (results) => set({ matchResults: results }),
            setSelectedDataColumn: (column) => set({ selectedDataColumn: column }),
            setSelectedRegionColumn: (column) => set({ selectedRegionColumn: column }),
            setSelectedColorScheme: (scheme) => set({ selectedColorScheme: scheme }),
            setClassificationMethod: (method) => set({ classificationMethod: method }),
            setNumberOfBuckets: (buckets) => set({ numberOfBuckets: buckets }),
            setDataClassification: (classification) => set({ dataClassification: classification }),
            setShowMismatches: (show) => set({ showMismatches: show }),

            // helper actions
            addKeyValuePair: () => {
                const { keyValuePairs } = get()
                const newId = (keyValuePairs.length + 1).toString()
                set({ keyValuePairs: [...keyValuePairs, { key: '', value: '', id: newId }] })
            },

            removeKeyValuePair: (id) => {
                const { keyValuePairs } = get()
                if (keyValuePairs.length > 1) {
                    set({ keyValuePairs: keyValuePairs.filter(pair => pair.id !== id) })
                }
            },
            updateKeyValuePair: (id, field, value) => {
                const { keyValuePairs } = get()
                set({
                    keyValuePairs: keyValuePairs.map(pair =>
                        pair.id === id ? { ...pair, [field]: value } : pair
                    )
                })
            },
            clearAllData: () => set({
                csvFile: null,
                csvData: [],
                validationResult: null,
                uploadError: null,
                keyValuePairs: [{ key: '', value: '', id: '1' }],
                matchResults: [],
                selectedDataColumn: '',
                selectedRegionColumn: '',
                dataClassification: null,
                mapTitle: '',
                svgContent: '',
                availableRegions: []
            })
        }),
        {
            name: 'choropleth-map-store',
            storage: createJSONStorage(() => {
                // check if we are in browser environment
                if (typeof window !== 'undefined') {
                    return localStorage
                }

                // return a dummy storae for SSR
                return {
                    getItem: () => null,
                    setItem: () => { },
                    removeItem: () => { }
                }
            }),

            partialize: (state) => ({
                csvData: state.csvData,
                validationResult: state.validationResult,
                mapTitle: state.mapTitle,
                availableRegions: state.availableRegions,
                keyValuePairs: state.keyValuePairs,
                matchResults: state.matchResults,
                selectedDataColumn: state.selectedDataColumn,
                selectedRegionColumn: state.selectedRegionColumn,
                selectedColorScheme: state.selectedColorScheme,
                classificationMethod: state.classificationMethod,
                numberOfBuckets: state.numberOfBuckets,
                dataClassification: state.dataClassification,
                showMismatches: state.showMismatches
            }),
            onRehydrateStorage: () => (state) => {
                // set hydration flag when rehydration is complete
                state?.setHasHydrated(true)
            }
        }
    )
)