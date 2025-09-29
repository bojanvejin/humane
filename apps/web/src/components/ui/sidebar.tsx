"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetOverlay, SheetPortal } from "@/components/ui/sheet" // Import SheetOverlay and SheetPortal
import { ScrollArea } from "@/components/ui/scroll-area"
import { useIsMobile } from "@/hooks/use-mobile"

const sidebarVariants = cva(
  "flex h-full flex-col bg-sidebar text-sidebar-foreground",
  {
    variants: {
      variant: {
        default: "border-r border-sidebar-border",
        ghost: "",
      },
      size: {
        default: "w-64",
        sm: "w-56",
        lg: "w-72",
        xl: "w-80",
        full: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface SidebarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sidebarVariants> {
  asChild?: boolean
  mobileBreakpoint?: number
  defaultOpen?: boolean
  nav: React.ReactNode
  footer?: React.ReactNode
  header?: React.ReactNode
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      mobileBreakpoint,
      defaultOpen = false,
      nav,
      footer,
      header,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "div"
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(defaultOpen)

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetPortal>
            <SheetOverlay /> {/* Add SheetOverlay */}
            <SheetContent
              data-sidebar="sidebar"
              data-mobile="true"
              className={cn(sidebarVariants({ variant, size, className}))}
              style={
                {
                  "--mobile-breakpoint": `${mobileBreakpoint}px`,
                } as React.CSSProperties
              }
              side="left" // Explicitly set side prop
              {...props} // Pass remaining props to SheetContent
            >
              {header}
              <ScrollArea className="flex-1">
                <nav className="grid items-start gap-2 text-sm font-medium lg:px-4">
                  {nav}
                </nav>
              </ScrollArea>
              {footer}
            </SheetContent>
          </SheetPortal>
        </Sheet>
      )
    }

    return (
      <Comp
        ref={ref}
        data-sidebar="sidebar"
        className={cn(sidebarVariants({ variant, size, className }))}
        style={
          {
            "--mobile-breakpoint": `${mobileBreakpoint}px`,
          } as React.CSSProperties
        }
        {...props}
      >
        {header}
        <ScrollArea className="flex-1">
          <nav className="grid items-start gap-2 text-sm font-medium lg:px-4">
            {nav}
          </nav>
        </ScrollArea>
        {footer}
      </Comp>
    )
  }
)
Sidebar.displayName = "Sidebar"

interface SidebarTriggerProps
  extends React.ComponentPropsWithoutRef<typeof Button> {} // Extend ButtonProps directly

const SidebarTrigger = React.forwardRef<HTMLButtonElement, SidebarTriggerProps>(
  ({ className, ...props }, ref) => {
    const isMobile = useIsMobile()
    const { setOpenMobile } = useSidebar()

    if (isMobile) {
      return (
        <Button
          ref={ref}
          data-sidebar="trigger"
          variant="ghost" // Ensure variant is passed
          size="icon" // Ensure size is passed
          className={cn("h-8 w-8", className)}
          onClick={() => setOpenMobile(true)}
          {...props}
        >
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      )
    }

    return null
  }
)
SidebarTrigger.displayName = "SidebarTrigger"

interface SidebarContextProps {
  setOpenMobile: React.Dispatch<React.SetStateAction<boolean>>
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)

  if (!context) {
    throw new Error("useSidebar must be used within a <Sidebar />")
  }

  return context
}

export { Sidebar, SidebarTrigger }