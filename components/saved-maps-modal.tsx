// components/SavedMapsModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trash2, Search, Calendar, MapPin } from "lucide-react"
import { mapDatabase, type SavedMap } from '../stores/map-store'

interface SavedMapsModalProps {
    open: boolean
    onClose: () => void
    onLoadMap: (mapId: string) => void
}

export function SavedMapsModal({ open, onClose, onLoadMap }: SavedMapsModalProps) {
    const [savedMaps, setSavedMaps] = useState<SavedMap[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(false)

    const loadMaps = async () => {
        setLoading(true)
        try {
            const maps = await mapDatabase.getAllMaps()
            setSavedMaps(maps)
        } catch (error) {
            console.error('Error loading maps:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteMap = async (mapId: string, event: React.MouseEvent) => {
        event.stopPropagation()
        if (confirm('Are you sure you want to delete this map?')) {
            try {
                await mapDatabase.deleteMap(mapId)
                setSavedMaps(maps => maps.filter(map => map.id !== mapId))
            } catch (error) {
                console.error('Error deleting map:', error)
                alert('Error deleting map')
            }
        }
    }

    const filteredMaps = savedMaps.filter(map =>
        map.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

    useEffect(() => {
        if (open) {
            loadMaps()
        }
    }, [open])

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Saved Maps ({savedMaps.length})
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search maps..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Maps Grid */}
                    <div className="overflow-y-auto max-h-[60vh]">
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                                <p className="text-muted-foreground">Loading maps...</p>
                            </div>
                        ) : filteredMaps.length === 0 ? (
                            <div className="text-center py-8">
                                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                <p className="text-muted-foreground">
                                    {searchQuery ? 'No maps found matching your search' : 'No saved maps yet'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredMaps.map((map) => (
                                    <Card key={map.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium truncate">
                                                {map.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {/* Thumbnail */}
                                            <div className="aspect-video bg-muted rounded-md overflow-hidden">
                                                {map.thumbnailDataUrl ? (
                                                    <img
                                                        src={map.thumbnailDataUrl}
                                                        alt={map.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <MapPin className="h-8 w-8 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Map Info */}
                                            <div className="space-y-2 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>
                                                        {new Date(map.updatedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="text-xs">
                                                    {map.csvData.length} data points • {map.colorScheme.name} scheme
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={() => {
                                                        onLoadMap(map.id)
                                                        onClose()
                                                    }}
                                                >
                                                    Load
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => handleDeleteMap(map.id, e)}
                                                    className="px-2"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}