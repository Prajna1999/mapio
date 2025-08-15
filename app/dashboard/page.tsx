'use client'

import { CardDialog } from "@/components/card-dialog"
import SVGEmbed from "@/components/svg-embed"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export default function Page() {
  const router = useRouter()

  const handleSVGClick = (src: string, alt: string) => {
    const params = new URLSearchParams({
      src: src,
      alt: alt
    })
    router.push(`/svg-fullscreen?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero */}
      <div className="text-center py-16 px-6 mb-4">
        <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
          Mapio
        </h2>
        <p className="text-gray-600 text-xl mx-auto">
          The fastest way to create map visualization!
        </p>
      </div>

      {/* Main Content */}
      <div className="flex justify-center px-6 pb-16">
        <CardDialog
          trigger={
            <div className="group bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <SVGEmbed
                src="/world_mercator_india_highlighted.svg"
                alt="World Map"
              />
            </div>
          }
          title="Choose Map Type"
          description="Select your preferred geographical boundary level"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
            {/* States Card */}
            <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
              <div className="p-4">
                <div className="h-48 bg-gray-50 rounded-lg mb-4 flex items-center justify-center">
                  <SVGEmbed
                    src="/states_of_india_black.svg"
                    alt="States of India Map"
                    onClick={() => handleSVGClick("/states_of_india_black_path.svg", "States of India Map")}
                    className="w-full h-full"
                    containerClassName="w-full h-full flex justify-center items-center"
                    imageClassName="max-w-full max-h-full object-contain cursor-pointer hover:scale-105 transition-transform duration-200"
                    cardClassName="w-full h-full border-0 shadow-none bg-transparent"
                    showHeader={false}
                  />
                </div>
                <Label className="block text-center font-medium text-gray-800">
                  States of India
                </Label>
                <p className="text-sm text-gray-600 text-center mt-1">28 states & 8 UTs</p>
              </div>
            </div>

            {/* Districts Card */}
            <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
              <div className="p-4">
                <div className="h-48 bg-gray-50 rounded-lg mb-4 flex items-center justify-center relative">
                  <Badge variant="default" className="absolute top-1 right-1">Coming Soon</Badge>
                  <SVGEmbed
                    src="/india_district_maps_black_enlarged.svg"
                    alt="Districts of India Map"
                    // onClick={() => handleSVGClick("/Official_India_Map_with_Districts_2011_Census.svg", "Districts of India Map")}
                    onClick={() => null}
                    className="w-full h-full"
                    containerClassName="w-full h-full flex justify-center items-center"
                    imageClassName="max-w-full max-h-full object-contain cursor-not-allowed hover:scale-105 transition-transform duration-200"
                    cardClassName="w-full h-full border-0 shadow-none bg-transparent"
                    showHeader={false}
                  />
                </div>
                <Label className="block text-center font-medium text-gray-800">
                  Districts of India
                </Label>
                <p className="text-sm text-gray-600 text-center mt-1">700+ districts</p>
              </div>
            </div>

            {/* Constituencies Card */}
            <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
              <div className="p-4">
                <div className="h-48 bg-gray-50 rounded-lg mb-4 flex items-center justify-center relative">
                  <Badge variant="default" className="absolute top-1 right-1">Coming Soon</Badge>
                  <SVGEmbed
                    src="/india_loksabha_constituencies.svg"
                    alt="Loksabha Constituencies of India Map"
                    // onClick={() => handleSVGClick("/loksabha_constituencies_of_india_path.svg", "Loksabha Constituencies of India Map")}
                    onClick={() => null}
                    className="w-full h-full"
                    containerClassName="w-full h-full flex justify-center items-center "
                    imageClassName="max-w-full max-h-full object-contain cursor-not-allowed hover:scale-105 transition-transform duration-200"
                    cardClassName="w-full h-full border-0 shadow-none bg-transparent"
                    showHeader={false}
                  />
                </div>
                <Label className="block text-center font-medium text-gray-800">
                  Loksabha Constituencies
                </Label>
                <p className="text-sm text-gray-600 text-center mt-1">543 constituencies</p>
              </div>
            </div>
          </div>
        </CardDialog>
      </div>

      {/* Footer */}
      <div className="border-t bg-gradient-to-r from-gray-50 to-blue-50/50">
        <div className=" mx-auto px-6 py-12">
          <div className="text-center space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">Start Creating Today</h3>
            <p className="text-gray-600  mx-auto">
              Choose from three detailed map types and create stunning visualizations with our interactive editor
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6 sm:gap-8 text-sm text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>3 Map Types</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Real-time Editing</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Indian Geography</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}