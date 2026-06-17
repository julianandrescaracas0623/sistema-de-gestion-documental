import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/shared/components/ui/card";

function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}

export function DocumentsTableSkeleton() {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <div className="flex items-center justify-between gap-2">
          <Pulse className="h-5 w-48" />
          <Pulse className="h-8 w-32" />
        </div>
      </CardHeader>
      <CardContent className="px-0 py-4">
        <div className="space-y-3 px-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Pulse key={i} className="h-10 w-full" />
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-t py-4">
        <Pulse className="h-4 w-40" />
      </CardFooter>
    </Card>
  );
}
