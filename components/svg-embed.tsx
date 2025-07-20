import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import WorldSVG from "@/public/world_mercator_projection.svg"
interface SVGEmbedProps {
    src: string
    alt: string
    title?: string
    description?: string
    className?: string
    imageClassName?: string
    containerClassName?: string
    cardClassName?: string
    showHeader?: boolean
    fill?: string
}

export default function SVGEmbed({
    src = "public/word_mercator_india_highlighted.svg",
    alt = "SVG Image",
    title,
    description,
    className = "container mx-auto p-6",
    imageClassName = "max-w-full h-7/8",
    containerClassName = "w-full flex justify-center",
    cardClassName = "w-full max-w-4xl mx-auto",
    showHeader = false,
}: SVGEmbedProps) {
    return (
        <div className={className}>
            <Card className={cardClassName}>
                {showHeader && (title || description) && (
                    <CardHeader>
                        {title && <CardTitle>{title}</CardTitle>}
                        {description && (
                            <CardDescription>
                                {description}
                            </CardDescription>
                        )}
                    </CardHeader>
                )}
                <CardContent>
                    <div className={containerClassName}>
                        <img
                            src={src}
                            alt={alt}
                            className={imageClassName}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}