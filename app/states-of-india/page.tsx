import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function StatesOfIndiaPage() {
  return (
    <div className="container mx-auto p-6">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>States of India</CardTitle>
          <CardDescription>
            Interactive map showing all states and union territories of India
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full flex justify-center">
            <img 
              src="/states_of_india_latest.svg" 
              alt="States of India Map" 
              className="max-w-full h-auto"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}