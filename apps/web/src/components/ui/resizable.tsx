"use client"

import { GripVertical } from "lucide-react"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "react-resizable-panels"

import { cn } from "@humane/lib/utils"

const ResizablePanelGroupComponent = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePanelGroup>) => (
  <ResizablePanelGroup
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanelComponent = ResizablePanel

const ResizableHandleComponent = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizableHandle> & {
  withHandle?: boolean
}) => (
  <ResizableHandle
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:inset-x-0 data-[panel-group-direction=vertical]:after:top-1/2 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:-translate-y-1/2",
      withHandle &&
        "after:bg-border after:opacity-0 hover:after:opacity-100 hover:after:transition-all focus-visible:after:bg-border focus-visible:after:opacity-100 data-[panel-group-direction=vertical]:after:bg-border data-[panel-group-direction=vertical]:hover:after:opacity-100 data-[panel-group-direction=vertical]:focus-visible:after:bg-border data-[panel-group-direction=vertical]:focus-visible:after:opacity-100",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </ResizableHandle>
)

export {
  ResizablePanelGroupComponent as ResizablePanelGroup,
  ResizablePanelComponent as ResizablePanel,
  ResizableHandleComponent as ResizableHandle,
}