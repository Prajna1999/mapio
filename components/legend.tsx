"use client"
import { MapLegendProps, useMapStore } from "@/stores/map-store"
import chroma from "chroma-js"

export function MapLegend({ start, end }: MapLegendProps) {
    const { selectedColorScheme, dataClassification, mapTitle } = useMapStore()

    const minValue = start ?? dataClassification?.breaks[0] ?? 0
    const maxValue = end ?? dataClassification?.breaks[dataClassification.breaks.length - 1] ?? 100


    // smooth gradient
    const interpolationMode = selectedColorScheme.interpolation || 'linear'
    const colorScale = chroma.scale(selectedColorScheme.colors)
        .mode('lch')
        .correctLightness(interpolationMode !== "linear")

    // generate gradient in CSS
    // 10 for linear 20 for cubic and basis
    const gradientStops = []
    const numStops = interpolationMode === "linear" ? 10 : 20

    for (let i = 0; i <= numStops; i++) {
        const position = (i * 100) / numStops
        const colorValue = colorScale(i / numStops).hex()
        gradientStops.push(`${colorValue} ${position}%`)



    }
    const gradientStyle = {
        background: `linear-gradient(to right, ${gradientStops.join(',  ')})`
    }
    return (

        <div className="absolute top-16 right-12 flex flex-col space-y-2 p-4 z-10 ">
            <div className="">{mapTitle}</div>
            <div
                className="w-3xs h-2 rounded"
                style={gradientStyle}
            />

            <div className="flex justify-between text-xs text-gray-600">
                <span>{minValue.toLocaleString()}</span>
                <span>{maxValue.toLocaleString()}</span>
            </div>
        </div>

    )


}