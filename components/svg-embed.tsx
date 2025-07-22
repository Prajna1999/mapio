import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    onClick?: () => void
}

export default function SVGEmbed({
    src = "/word_mercator_india_highlighted.svg",
    alt = "SVG Image",
    title,
    description,
    className = "container mx-auto p-6",
    imageClassName = "max-w-full h-7/8",
    containerClassName = "w-full flex justify-center",
    cardClassName = "w-full max-w-4xl mx-auto",
    showHeader = false,
    onClick,
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
                            className={`${imageClassName} ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                            onClick={onClick}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}