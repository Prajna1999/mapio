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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
export default function Page() {
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
        <div className="flex justify-center items-center h-screen">
          <CardDialog
            trigger={<SVGEmbed src="/world_mercator_india_highlighted.svg" alt="World Map" />}
            title="Edit Map Configuration"
            description="Customize your map settings and preferences."
            actions={<Button type="submit">Save changes</Button>}
          >
            <div className="grid gap-3">
              <Label htmlFor="map-title">Map Title</Label>
              <Input id="map-title" name="title" defaultValue="World Map" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="map-description">Description</Label>
              <Input id="map-description" name="description" defaultValue="Interactive world map" />
            </div>
          </CardDialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
