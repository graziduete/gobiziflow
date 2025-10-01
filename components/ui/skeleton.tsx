import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-gradient-to-r from-blue-100 via-indigo-100 to-blue-100 animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
