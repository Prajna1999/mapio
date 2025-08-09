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

