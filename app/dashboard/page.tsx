'use client'

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { CardDialog } from "@/components/card-dialog"
import SVGEmbed from "@/components/svg-embed"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">
                  Building Your Application
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Data Fetching</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-col min-h-[calc(100vh-64px)]">
          {/* Simple Header */}
          <div className="text-center py-8 px-6">
            <h1 className="text-3xl font-bold mb-2">Map Editor Dashboard</h1>
            <p className="text-muted-foreground">Click on the map below to start editing</p>
          </div>

          {/* Main Content - Centered SVG */}
          <div className="flex-1 flex justify-center items-center px-6">
            <CardDialog
              trigger={<SVGEmbed src="/world_mercator_india_highlighted.svg" alt="World Map" />}
              title="Edit Map Configuration"
              description="Customize your map settings and preferences."
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="w-full h-64 flex flex-col border rounded-lg p-3">
                  <div className="flex-1 flex items-center justify-center overflow-hidden">
                    <SVGEmbed
                      src="/states_of_india_black.svg"
                      alt="States of India Map"
                      onClick={() => handleSVGClick("/states_of_india_black_path.svg", "States of India Map")}
                      className="w-full h-full"
                      containerClassName="w-full h-full flex justify-center items-center"
                      imageClassName="max-w-full max-h-full object-contain cursor-pointer hover:opacity-80 transition-opacity"
                      cardClassName="w-full h-full border-0 shadow-none"
                      showHeader={false}
                    />
                  </div>
                  <Label className="text-center text-sm mt-2 font-medium">States of India</Label>
                </div>

                <div className="w-full h-64 flex flex-col border rounded-lg p-3">
                  <div className="flex-1 flex items-center justify-center overflow-hidden">
                    <SVGEmbed
                      src="/india_district_map_latest.svg"
                      alt="Districts of India Map"
                      onClick={() => handleSVGClick("/india_district_map_latest.svg", "Districts of India Map")}
                      className="w-full h-full"
                      containerClassName="w-full h-full flex justify-center items-center"
                      imageClassName="max-w-full max-h-full object-contain cursor-pointer hover:opacity-80 transition-opacity"
                      cardClassName="w-full h-full border-0 shadow-none"
                      showHeader={false}
                    />
                  </div>
                  <Label className="text-center text-sm mt-2 font-medium">Districts of India</Label>
                </div>

                <div className="w-full h-64 flex flex-col border rounded-lg p-3">
                  <div className="flex-1 flex items-center justify-center overflow-hidden">
                    <SVGEmbed
                      src="/loksabha_constituencies_of_india_path.svg"
                      alt="Loksabha Constituencies of India Map"
                      onClick={() => handleSVGClick("/loksabha_constituencies_of_india_path.svg", "Loksabha Constituencies of India Map")}
                      className="w-full h-full"
                      containerClassName="w-full h-full flex justify-center items-center"
                      imageClassName="max-w-full max-h-full object-contain cursor-pointer hover:opacity-80 transition-opacity"
                      cardClassName="w-full h-full border-0 shadow-none"
                      showHeader={false}
                    />
                  </div>
                  <Label className="text-center text-sm mt-2 font-medium">Loksabha Constituencies of India</Label>
                </div>
              </div>
            </CardDialog>
          </div>

          {/* Simple Footer */}
          <div className="border-t p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
              <div>Ready to visualize your data</div>
              <div className="flex gap-4 mt-2 sm:mt-0">
                <span>3 Templates Available</span>
                <span>•</span>
                <span>Interactive Editor</span>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
